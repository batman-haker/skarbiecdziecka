'use client';

/**
 * Providers dla całej aplikacji
 * Opakowuje komponenty w Web3 context + Privy embedded wallets
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { wagmiConfig } from '@/lib/wagmi-config';
import { baseSepolia } from 'wagmi/chains';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Query client dla React Query (wymagane przez wagmi)
  const [queryClient] = useState(() => new QueryClient());

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Jeśli Privy nie skonfigurowane, użyj tylko Wagmi (fallback)
  if (!privyAppId || privyAppId === 'YOUR_PRIVY_APP_ID_HERE') {
    console.warn('⚠️ Privy not configured. Using MetaMask only mode.');
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Appearance - cyberpunk theme
        appearance: {
          theme: 'dark',
          accentColor: '#00FFF0', // Neon cyan
          showWalletLoginFirst: false, // Pokazuj najpierw social login
        },
        // Login methods
        loginMethods: ['email', 'google', 'wallet'],
        // Default chain
        defaultChain: baseSepolia,
        // Supported chains
        supportedChains: [baseSepolia],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
