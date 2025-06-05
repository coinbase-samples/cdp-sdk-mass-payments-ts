/**
 * Copyright 2025-present Coinbase Global, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cdpClient } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { Address, formatUnits, parseUnits } from "viem";
import { executeTransfers } from "@/lib/transfer";
import { erc20approveAbi, TOKEN_ADDRESSES, tokenDecimals, TokenKey } from "@/lib/constant";
import { TransferRequest } from "@/lib/types/transfer";
import { config } from "@/lib/config";
import { InsufficientBalanceError } from "@/lib/errors";
import { getUserByEmailHash, hashEmail, createUser } from "@/lib/db/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encodeFunctionData } from "viem";
import { randomUUID } from "crypto";
import { publicClient } from "@/lib/viem";
import { getBalanceForAddress } from "@/lib/balance";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  // Get account details
  const session = await getServerSession(authOptions)

  try {
    const { recipients, token }: TransferRequest = await request.json();

    if (!recipients || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    const invalidEmails = recipients
      .map((recipient, index) => ({ email: recipient.recipientId, index }))
      .filter(({ email }) => !EMAIL_REGEX.test(email));

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format in row ${invalidEmails[0].index + 1}: ${invalidEmails[0].email}` },
        { status: 400 }
      );
    }

    const account = await cdpClient.evm.getAccount({ name: session!.user.id })

    const recipientIds = recipients.map(r => r.recipientId);

    const decimalPrecision = tokenDecimals[token as TokenKey];
    const amounts = recipients.map(r => parseUnits(r.amount, decimalPrecision));
    const totalTransferAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

    const sanitizedToken = token.toLowerCase();

    const tokenBalance = await getBalanceForAddress(account.address, sanitizedToken);
    const rawTokenBalance = parseUnits(tokenBalance, decimalPrecision);
    if (rawTokenBalance < totalTransferAmount) {
      throw new InsufficientBalanceError(
        `Insufficient ${sanitizedToken} balance for transfer. Required: ${formatUnits(totalTransferAmount, decimalPrecision)} ${sanitizedToken}`
      );
    }

    const recipientAccounts = await Promise.all(
      recipientIds.map(async (recipientId: string) => {
        const sha256Email = hashEmail(recipientId);
        let user = await getUserByEmailHash(sha256Email);

        if (!user) {
          user = await createUser(sha256Email, '');
        }

        return await cdpClient.evm.getOrCreateAccount({ name: user.userId });
      })
    );
    const recipientAddresses = recipientAccounts.map(account => account.address as Address);

    if (token !== 'eth') {
      const tokenAddress = TOKEN_ADDRESSES[token as TokenKey];
      const result = await cdpClient.evm.sendTransaction({
        address: account.address as `0x${string}`,
        transaction: {
          to: tokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: erc20approveAbi,
            functionName: 'approve',
            args: [config.GASLITE_DROP_ADDRESS as Address, totalTransferAmount],
          }),
          value: BigInt(0),
          type: 'eip1559',
        },
        network: 'base-sepolia',
        idempotencyKey: randomUUID(),
      });

      await publicClient.waitForTransactionReceipt({
        hash: result.transactionHash as `0x${string}`,
      });
    }

    const result = await executeTransfers({
      senderAccount: account,
      token: sanitizedToken as TokenKey,
      addresses: recipientAddresses,
      amounts,
      totalAmount: totalTransferAmount,
    });

    return NextResponse.json({ recipients, result });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transfer' },
      { status: 500 }
    );
  }
} 
