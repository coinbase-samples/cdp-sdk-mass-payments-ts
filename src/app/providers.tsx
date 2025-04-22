'use client';

import { AuthProvider } from './context/AuthContext';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'viem/chains';
import { coinbaseWallet } from 'wagmi/connectors';

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http('https://api.developer.coinbase.com/rpc/v1/base-sepolia/z1Au8i9SL0g36BCwmYtOYhzdP6fymcm7'),
  },
  connectors: [coinbaseWallet()],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
