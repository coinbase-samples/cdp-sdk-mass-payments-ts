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
import { checkGasFunds } from "@/lib/viem";
import { Address, parseUnits } from "viem";
import { executeTransfers } from "@/lib/transfer";
import { tokenDecimals, TokenKey } from "@/lib/constant";
import { TransferRequest } from "@/lib/types/transfer";

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

    // Get recipient EVM accounts
    const recipientAccounts = await Promise.all(
      recipientIds.map((recipientId: string) => getOrCreateEvmAccountFromId({ accountId: recipientId }))
    );
    const recipientAddresses = recipientAccounts.map(account => account.address as Address);

    // Check if account has sufficient funds
    await checkGasFunds(account.address, sanitizedToken, recipientAddresses, amounts, totalTransferAmount);

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
