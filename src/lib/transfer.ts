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

import { checkGasFunds, getWalletClient } from "@/lib/viem";
import { Address } from "viem";
import { TransferParams, TransferResult } from "@/lib/types/transfer";
import { TOKEN_ADDRESSES, TokenKey } from "@/lib/constant";
import { config } from "./config";
import GasliteDrop from "@/contracts/GasliteDrop.json";

export async function executeTransfers(params: TransferParams): Promise<TransferResult> {
  const { senderAccount, token, addresses, amounts, totalAmount } = params;

  try {
    const walletClient = await getWalletClient(senderAccount);

    await checkGasFunds(senderAccount.address, token, addresses, amounts, totalAmount);

    let hash: `0x${string}`;
    if (token === 'eth') {
      hash = await walletClient.writeContract({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropETH',
        args: [addresses, amounts],
        value: totalAmount,
      });
    } else {
      hash = await walletClient.writeContract({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropERC20',
        args: [
          TOKEN_ADDRESSES[token as TokenKey],
          addresses,
          amounts,
          totalAmount,
        ],
      });
    }

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
