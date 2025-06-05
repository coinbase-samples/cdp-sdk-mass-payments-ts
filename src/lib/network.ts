import { base, baseSepolia } from 'viem/chains';
import { config } from '@/lib/config';
import { NetworkConfig } from '@/lib/types/network';

export const getNetworkConfig = (): NetworkConfig => {
  // If running on Vercel, always use Sepolia
  if (process.env.VERCEL === '1') {
    return baseSepoliaNetworkConfig;
  }

  // If running locally and USE_MAINNET is set to 'true', use mainnet
  if (config.USE_MAINNET === 'true') {
    return baseNetworkConfig;
  }

  // Default to Sepolia
  return baseSepoliaNetworkConfig;
};

const baseSepoliaNetworkConfig = {
  chain: baseSepolia,
  rpcUrl: config.BASE_SEPOLIA_NODE_URL,
  network: baseSepolia.name,
  explorerUrl: 'https://sepolia.basescan.org',
};

const baseNetworkConfig = {
  chain: base,
  rpcUrl: config.BASE_MAINNET_NODE_URL,
  network: base.name,
  explorerUrl: 'https://basescan.org',
}