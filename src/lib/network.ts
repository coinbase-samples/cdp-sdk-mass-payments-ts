import { base, baseSepolia } from 'viem/chains';
import { NetworkConfig } from '@/lib/types/network';

export const getNetworkConfig = (): NetworkConfig => {
  if (process.env.USE_MAINNET === 'true' || process.env.NEXT_PUBLIC_USE_MAINNET === 'true') {
    baseNetworkConfig.rpcUrl = process.env.BASE_NODE_URL;
    return baseNetworkConfig;
  }

  baseSepoliaNetworkConfig.rpcUrl = process.env.BASE_NODE_URL;
  return baseSepoliaNetworkConfig;
};

const baseSepoliaNetworkConfig: NetworkConfig = {
  chain: baseSepolia,
  network: 'base-sepolia',
  explorerUrl: 'https://sepolia.basescan.org',
};

const baseNetworkConfig: NetworkConfig = {
  chain: base,
  network: 'base',
  explorerUrl: 'https://basescan.org',
};
