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

import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk";
import { config } from '@/lib/config';
import { getWalletAddress, createWallet } from '@/lib/db/wallet';
import { GetOrCreateEvmAccountParams, RequestFaucetParams } from "@/lib/types/cdp";
import { publicClient } from "@/lib/viem";
import { baseSepolia } from "viem/chains";
import { Address } from "viem";

const cdpClient: CdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

export async function getOrCreateEvmAccountFromId(params: GetOrCreateEvmAccountParams): Promise<EvmServerAccount> {
  if (!config.DATABASE_URL) {
    throw new Error("Database configuration is not properly set");
  }

  try {
    const existingWallet = await getWalletAddress(params.accountId);
    if (existingWallet) {
      // Return the existing wallet
      return await cdpClient.evm.getAccount({ address: existingWallet.address });
    }

    // Create new wallet only if user doesn't have one
    const evmAccount = await cdpClient.evm.createAccount();
    await createWallet(params.accountId, evmAccount.address);

    return evmAccount;
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw error;
  }
}

export async function getEvmAccountFromAddress(address: Address): Promise<EvmServerAccount> {
  return await cdpClient.evm.getAccount({ address });
}

export async function getEvmAccountFromId(userId: string): Promise<EvmServerAccount> {
  const walletRecord = await getWalletAddress(userId);

  if (walletRecord === null) {
    throw new Error("no address found associated with userId")
  }

  return cdpClient.evm.getAccount({ address: walletRecord.address })
}

export async function requestFaucetFunds(params: RequestFaucetParams) {
  const { transactionHash } = await cdpClient.evm.requestFaucet({
    address: params.address,
    network: baseSepolia.network,
    token: params.tokenName,
  });

  await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });
}
