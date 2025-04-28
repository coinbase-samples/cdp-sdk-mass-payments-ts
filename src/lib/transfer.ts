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

import { EvmServerAccount } from "@coinbase/cdp-sdk";
import { getOrCreateEvmAccountFromId } from "@/lib/cdp";
import { publicClient, TOKEN_ADDRESSES, executeBatchTransfer } from "@/lib/viem";
import { erc20Abi, Address } from "viem";
import { TransferRequest, TransferResult } from "@/lib/types/transfer";

export async function executeTransfers(
  account: EvmServerAccount,
  token: string,
  data: TransferRequest['data']
): Promise<TransferResult> {
  try {
    // Get or create EVM accounts for all recipients
    const recipients = await Promise.all(
      data.map(async (row) => {
        const recipientEvmAccount = await getOrCreateEvmAccountFromId({ accountId: row.to });
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

    // Execute batch transfer
    const hash = await executeBatchTransfer(
      account,
      token,
      addresses,
      amountsWei
    );

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
