import { Address, zeroAddress } from "viem";

export const TOKEN_ADDRESSES: Record<TokenKey, Address> = {
  eth: zeroAddress,
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  eurc: '0x808456652fdb597867f38412077A9182bf77359F',
  cbbtc: '0xcbB7C0006F23900c38EB856149F799620fcb8A4a',
};

export type TokenKey = 'eth' | 'usdc' | 'eurc' | 'cbbtc'

export const tokenDisplayMap: Record<TokenKey, string> = {
  eth: 'ETH',
  usdc: 'USDC',
  eurc: 'EURC',
  cbbtc: 'cbBTC'
}

export const tokenDecimals: Record<TokenKey, number> = {
  eth: 18,
  usdc: 6,
  eurc: 6,
  cbbtc: 8,
}
