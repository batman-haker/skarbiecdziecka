'use client';

/**
 * Public Treasury Page - Dynamic Route
 * URL: /treasury/0x1234...
 *
 * Publiczna strona skarbca do udostępniania rodzinie:
 * - Nie wymaga logowania do przeglądania
 * - Pokazuje: imię dziecka, saldo, historię wpłat
 * - Pozwala wpłacać przez MetaMask
 */

import dynamic from 'next/dynamic';

// Dynamicznie importuj komponent bez SSR żeby uniknąć błędów hydratacji
const TreasuryContent = dynamic(() => import('./TreasuryContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🎁</div>
        <p className="text-cyan-400 font-mono">Ładowanie skarbca...</p>
      </div>
    </div>
  ),
});

export default function PublicTreasuryPage() {
  return <TreasuryContent />;
}
