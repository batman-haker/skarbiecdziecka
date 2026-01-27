'use client';

/**
 * Treasury Page - Redirect to new dynamic route
 * Old URL: /treasury?address=0x...
 * New URL: /treasury/0x...
 *
 * This page redirects to the new format for backwards compatibility.
 */

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function TreasuryRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get('address');

  useEffect(() => {
    if (address) {
      // Redirect to new dynamic route
      router.replace(`/treasury/${address}`);
    } else {
      // No address provided, redirect to home
      router.replace('/');
    }
  }, [address, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔄</div>
        <p className="text-cyan-400 font-mono">Przekierowywanie...</p>
      </div>
    </div>
  );
}

export default function TreasuryRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Loading...</div>
      </div>
    }>
      <TreasuryRedirectContent />
    </Suspense>
  );
}
