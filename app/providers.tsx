'use client';

/**
 * Providers dla całej aplikacji
 * Opakowuje komponenty w Web3 context
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi-config';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Query client dla React Query (wymagane przez wagmi)
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
