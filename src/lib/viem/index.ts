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

import { createPublicClient, http, createWalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { EvmServerAccount } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

export async function getWalletClient(account: EvmServerAccount) {
  console.log('ACCOUNT', account.address)
  return createWalletClient({
    account: toAccount(account),
    chain: baseSepolia,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
  });
}
