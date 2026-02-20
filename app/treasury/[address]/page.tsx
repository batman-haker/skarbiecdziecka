/**
 * Public Treasury Page - Dynamic Route
 * URL: /treasury/0x1234...
 *
 * Publiczna strona skarbca do udostepniania rodzinie:
 * - Nie wymaga logowania do przegladania
 * - Pokazuje: imie dziecka, saldo, historie wplat
 * - Pozwala wplacac przez MetaMask
 * - Open Graph meta tagi dla social media preview
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';

// Dynamicznie importuj komponent bez SSR zeby uniknac bledow hydratacji
const TreasuryContent = dynamic(() => import('./TreasuryContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🎁</div>
        <p className="text-cyan-400 font-mono">Ladowanie skarbca...</p>
      </div>
    </div>
  ),
});

type Props = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  let childName = 'dziecka';

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('treasuries')
      .select('child_name')
      .eq('contract_address', address)
      .single();

    if (data?.child_name) {
      childName = data.child_name;
    }
  } catch {
    // Fallback to default name
  }

  const title = `Skarbiec ${childName} - Wplac na przyszlosc!`;
  const description = `Wplac na skarbiec ${childName}. Kazda wplata jest bezpieczna na blockchainie. Dolaczy do rodziny i wsparcie przyszlosc dziecka!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Skarbiec Dziecka',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function PublicTreasuryPage() {
  return <TreasuryContent />;
}
