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

import { getOrCreateEvmAccount } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { publicClient, TOKEN_ADDRESSES, executeBatchTransfer } from "@/lib/viem";
import { erc20Abi, Address } from "viem";
import { TransferRequest, TransferResult } from "@/lib/types/transfer";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

async function validateRequest(request: NextRequest): Promise<TransferRequest> {
  const { token, data } = await request.json();

  if (!token || !data) {
    throw new ValidationError('Invalid request: token and data are required');
  }

  if (token !== 'eth' && !TOKEN_ADDRESSES[token]) {
    throw new ValidationError('Unsupported token');
  }

  return { token, data };
}

async function calculateTotalAmount(data: TransferRequest['data']): Promise<number> {
  return data
    .map(row => parseFloat(row.amount))
    .reduce((sum, amount) => sum + amount, 0);
}

async function executeTransfers(
  evmAccount: any,
  token: string,
  data: TransferRequest['data']
): Promise<TransferResult> {
  try {
    // Get or create EVM accounts for all recipients
    const recipients = await Promise.all(
      data.map(async (row) => {
        const recipientEvmAccount = await getOrCreateEvmAccount({ accountId: row.to });
        return {
          address: recipientEvmAccount.address,
          amount: row.amount,
          recipientId: row.to
        };
      })
    );

    // Prepare arrays for batch transfer
    const addresses = recipients.map(r => r.address as Address);
    const amounts = recipients.map(r => parseFloat(r.amount));

    // Convert amounts to wei
    const amountsWei = token === 'eth'
      ? amounts.map(amount => BigInt(Math.floor(amount * 10 ** 18)))
      : await (async () => {
        const tokenAddress = TOKEN_ADDRESSES[token];
        const decimals = await publicClient.readContract({
          abi: erc20Abi,
          address: tokenAddress,
          functionName: 'decimals',
        });
        return amounts.map(amount => BigInt(Math.floor(amount * 10 ** decimals)));
      })();

    // Execute batch transfer - this will either succeed for all or fail for all
    const { hash } = await executeBatchTransfer(
      evmAccount,
      token,
      addresses,
      amountsWei
    );

    // Return a single success result since all transfers succeeded
    return {
      success: true,
      hash,
      recipients: recipients.map(recipient => ({
        recipientId: recipient.recipientId,
        recipientAddress: recipient.address,
        amount: recipient.amount
      }))
    };
  } catch (error) {
    console.error('Error executing batch transfer:', error);
    // Return a single error result since all transfers failed
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recipients: data.map(row => ({
        recipientId: row.to,
        recipientAddress: '',
        amount: row.amount
      }))
    };
  }
}

async function checkEthBalance(address: Address, requiredAmount: bigint): Promise<void> {
  const balance = await publicClient.getBalance({ address });
  if (balance < requiredAmount) {
    throw new InsufficientBalanceError('Insufficient ETH balance');
  }
}

async function checkErc20Balance(
  tokenAddress: Address,
  ownerAddress: Address,
  requiredAmount: bigint
): Promise<void> {
  const balance = await publicClient.readContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [ownerAddress],
  });

  if (balance < requiredAmount) {
    throw new InsufficientBalanceError('Insufficient token balance');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
): Promise<NextResponse> {
  try {
    console.log('Starting transfer request processing');
    const { accountId } = params;
    console.log('Processing transfer for account:', accountId);

    const { token, data } = await validateRequest(request);
    console.log('Validated request:', { token, data });

    const evmAccount = await getOrCreateEvmAccount({ accountId });
    console.log('Got EVM account:', evmAccount.address);

    const totalAmount = await calculateTotalAmount(data);
    console.log('Calculated total amount:', totalAmount);

    if (token === 'eth') {
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));
      console.log('Checking ETH balance for amount:', totalAmountWei.toString());
      await checkEthBalance(evmAccount.address as Address, totalAmountWei);
    } else {
      const tokenAddress = TOKEN_ADDRESSES[token];
      console.log('Checking ERC20 balance for token:', tokenAddress);
      const decimals = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'decimals',
      });
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** decimals));
      console.log('Checking token balance for amount:', totalAmountWei.toString());
      await checkErc20Balance(tokenAddress, evmAccount.address as Address, totalAmountWei);
    }

    console.log('Starting transfers execution');
    const result = await executeTransfers(evmAccount, token, data);

    if (!result.success) {
      console.error('Transfer failed:', result.error);
      return NextResponse.json({
        error: result.error,
        result
      }, { status: 500 });
    }

    console.log('Transfer completed successfully');
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Transfer request failed:', error);
    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      status = 400;
      errorMessage = error.message;
    } else if (error instanceof InsufficientBalanceError) {
      status = 400;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      error: errorMessage
    }, { status });
  }
} 
