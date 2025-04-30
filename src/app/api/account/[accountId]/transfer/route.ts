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

import { getEvmAccountFromAddress, getOrCreateEvmAccountFromId } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { getWalletClient, publicClient } from "@/lib/viem";
import { Address, erc20Abi, formatUnits, parseUnits } from "viem";
import { executeTransfers } from "@/lib/transfer";
import { erc20approveAbi, TOKEN_ADDRESSES, tokenDecimals, TokenKey } from "@/lib/constant";
import { TransferRequest } from "@/lib/types/transfer";
import { config } from "@/lib/config";
import { InsufficientBalanceError } from "@/lib/errors";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
): Promise<NextResponse> {
  try {
    const { recipients, token }: TransferRequest = await request.json();

    // Validate input
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

    // Validate recipient IDs are valid email addresses
    const invalidEmails = recipients
      .map((recipient, index) => ({ email: recipient.recipientId, index }))
      .filter(({ email }) => !EMAIL_REGEX.test(email));

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format in row ${invalidEmails[0].index + 1}: ${invalidEmails[0].email}` },
        { status: 400 }
      );
    }

    // Get account details
    const { accountId } = await params;
    const account = await getEvmAccountFromAddress(accountId as Address);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Extract recipientIds and amounts
    const recipientIds = recipients.map(r => r.recipientId);

    const decimalPrecision = tokenDecimals[token as TokenKey];
    const amounts = recipients.map(r => parseUnits(r.amount, decimalPrecision));
    const totalTransferAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

    const sanitizedToken = token.toLowerCase();

    if (token === 'eth') {
      const ethBalance = await publicClient.getBalance({ address: account.address });
      if (ethBalance < totalTransferAmount) {
        throw new InsufficientBalanceError(
          `Insufficient ETH balance for transfer. Required: ${formatUnits(totalTransferAmount, 18)} ETH`
        );
      }
    } else {
      const tokenAddress = TOKEN_ADDRESSES[token as TokenKey];
      if (!tokenAddress) {
        throw new Error(`Unknown token symbol: ${token}`);
      }

      // Check ERC20 token balance
      const tokenBalance = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [account.address],
      });

      if (tokenBalance < totalTransferAmount) {
        throw new InsufficientBalanceError(
          `Insufficient ${token.toUpperCase()} balance. Required: ${formatUnits(totalTransferAmount, decimalPrecision)} ${token.toUpperCase()}`
        );
      }
    }

    // Get recipient EVM accounts
    const recipientAccounts = await Promise.all(
      recipientIds.map((recipientId: string) => getOrCreateEvmAccountFromId({ accountId: recipientId }))
    );
    const recipientAddresses = recipientAccounts.map(account => account.address as Address);

    if (token !== 'eth') {
      const tokenAddress = TOKEN_ADDRESSES[token as TokenKey];
      const walletClient = await getWalletClient(account);
      await walletClient.writeContract({
        abi: erc20approveAbi,
        address: tokenAddress as Address,
        functionName: 'approve',
        args: [config.GASLITE_DROP_ADDRESS as Address, totalTransferAmount],
      });
    }

    // Create transaction
    const result = await executeTransfers({
      senderAccount: account,
      token: sanitizedToken as TokenKey,
      addresses: recipientAddresses,
      amounts,
      totalAmount: totalTransferAmount,
    });

    return NextResponse.json({ recipients, ...result });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transfer' },
      { status: 500 }
    );
  }
} 
