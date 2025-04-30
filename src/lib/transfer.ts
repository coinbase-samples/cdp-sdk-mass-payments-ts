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

import { getWalletClient, publicClient } from "@/lib/viem";
import { Address } from "viem";
import { TransferParams, TransferResult } from "@/lib/types/transfer";
import { TOKEN_ADDRESSES } from "@/lib/constant";
import { config } from "./config";
import GasliteDrop from "@/contracts/GasliteDrop.json";

export async function executeTransfers(params: TransferParams): Promise<TransferResult> {
  const { senderAccount, token, addresses, amounts, totalAmount } = params;

  console.log('Executing batch transfer:', senderAccount.address, token, addresses, amounts, totalAmount);

  try {
    const walletClient = await getWalletClient(senderAccount);
    
    // Get the latest nonce and add 1 for the next transaction
    const nonce = await publicClient.getTransactionCount({
      address: senderAccount.address as Address,
    }) + 1;

    let hash: `0x${string}`;
    if (token === 'eth') {
      hash = await walletClient.writeContract({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropETH',
        args: [addresses, amounts],
        value: totalAmount,
        nonce: nonce,
      });
    } else {
      hash = await walletClient.writeContract({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropERC20',
        args: [
          TOKEN_ADDRESSES[token],
          addresses,
          amounts,
          totalAmount,
        ],
        nonce: nonce,
      });
    }

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      hash,
    }
  } catch (error) {
    console.error('Error executing batch transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
