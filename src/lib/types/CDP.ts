export type GetOrCreateEvmAccountParams = {
  accountId: string;
}

export type RequestFaucetParams = {
  address: `0x${string}`;
  tokenName: 'eth' | 'usdc' | 'eurc' | 'cbbtc';
}
