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

import { CdpClient } from "@coinbase/cdp-sdk";
import { TransferParams, TransferResult } from "@/lib/types/transfer";
import { TOKEN_ADDRESSES } from "@/lib/constant";
import { config } from "./config";
import GasliteDrop from "@/contracts/GasliteDrop.json";
import { encodeFunctionData } from "viem";

const MAX_RETRIES = 3;
const GAS_BUMP_PERCENTAGE = 20; // Increase gas by 20% each retry

// Initialize CDP client
const cdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

export async function executeTransfers(params: TransferParams): Promise<TransferResult> {
  const { senderAccount, token, addresses, amounts, totalAmount } = params;

  console.log('Executing batch transfer:', senderAccount.address, token, addresses, amounts, totalAmount);

  try {
    let retryCount = 0;
    let lastError: Error | null = null;
    let transactionHash: string | undefined;

    while (retryCount < MAX_RETRIES) {
      try {
        const contractAddress = config.GASLITE_DROP_ADDRESS;
        const functionName = token === 'eth' ? 'airdropETH' : 'airdropERC20';
        const args = token === 'eth' 
          ? [addresses, amounts]
          : [TOKEN_ADDRESSES[token], addresses, amounts, totalAmount];

        const result = await cdpClient.evm.sendTransaction({
          address: senderAccount.address as `0x${string}`,
          transaction: {
            to: contractAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: GasliteDrop,
              functionName,
              args,
            }),
            value: token === 'eth' ? BigInt(totalAmount) : BigInt(0),
            type: 'eip1559',
          },
          network: 'base-sepolia',
          idempotencyKey: `transfer-${Date.now()}-${retryCount}`,
        });

        transactionHash = result.transactionHash;
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && error.message.includes('replacement transaction underpriced')) {
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying with increased gas price (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            continue;
          }
        }
        throw error; // Re-throw if it's not a gas price error or we've exhausted retries
      }
    }

    if (!transactionHash) {
      throw lastError || new Error('Failed to execute transfer after retries');
    }

    return {
      success: true,
      hash: transactionHash,
    }
  } catch (error) {
    console.error('Error executing batch transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
