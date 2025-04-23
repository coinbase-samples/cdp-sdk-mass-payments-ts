'use client';

import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'viem/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { SessionProvider } from 'next-auth/react';
import { WalletProvider } from './context/WalletContext';

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [coinbaseWallet()],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
