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

import { Address, parseAbi } from 'viem';

export const TOKEN_ADDRESSES: Record<TokenKey, Address> = {
  eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  eurc: '0x808456652fdb597867f38412077A9182bf77359F',
  cbbtc: '0xcbB7C0006F23900c38EB856149F799620fcb8A4a',
};

export const TOKEN_ADDRESSES_MAINNET: Record<TokenKey, Address> = {
  eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  eurc: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
  cbbtc: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
};

export type TokenKey = 'eth' | 'usdc' | 'eurc' | 'cbbtc';

export const validTokens: TokenKey[] = ['eth', 'usdc', 'eurc', 'cbbtc'];

export function isTokenKey(value: string): value is TokenKey {
  return validTokens.includes(value as TokenKey);
}

export const tokenDisplayMap: Record<TokenKey, string> = {
  eth: 'ETH',
  usdc: 'USDC',
  eurc: 'EURC',
  cbbtc: 'cbBTC',
};

export const tokenDecimals: Record<TokenKey, number> = {
  eth: 18,
  usdc: 6,
  eurc: 6,
  cbbtc: 8,
};

export const erc20approveAbi = parseAbi([
  'function approve(address spender, uint256 amount) public',
]);

export function getTokenAddresses(
  isMainnet: boolean
): Record<TokenKey, Address> {
  return isMainnet ? TOKEN_ADDRESSES_MAINNET : TOKEN_ADDRESSES;
}
