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

import { Address, formatUnits } from "viem";
import { TOKEN_ADDRESSES, TokenKey } from "@/lib/constant";
import { cdpClient } from "@/lib/cdp";
import { bigintToNumberSafe } from "@/lib/utils";

export const getBalanceForAddress = async (
  address: `0x${string}`,
  tokenSymbol?: string,
): Promise<string> => {
  const balances = await cdpClient.evm.listTokenBalances({
    address,
    network: 'base-sepolia',
  });

  if (!tokenSymbol) {
    const ethBalance = balances.balances.find(b => b.token.symbol === 'ETH');
    if (!ethBalance) {
      throw new Error('ETH balance not found');
    }

    return formatUnits(ethBalance.amount.amount, bigintToNumberSafe(ethBalance.amount.decimals))
  }

  const tokenAddress: Address = TOKEN_ADDRESSES[tokenSymbol as TokenKey];
  if (!tokenAddress) {
    throw new Error(`Unknown token symbol: ${tokenSymbol}`);
  }

  const tokenBalance = balances.balances.find(b => b.token?.symbol?.toLowerCase() === tokenSymbol.toLowerCase());
  if (!tokenBalance) {
    throw new Error(`${tokenSymbol} balance not found`);
  }
  return formatUnits(tokenBalance.amount.amount, bigintToNumberSafe(tokenBalance.amount.decimals));
}
