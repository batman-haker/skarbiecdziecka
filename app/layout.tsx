import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Configure Inter font from Google Fonts
const inter = Inter({ subsets: ['latin', 'latin-ext'] });

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Skarbiec Dziecka - Cyfrowe skarbce dla dzieci',
  description: 'Twórz długoterminowe inwestycje w kryptowaluty dla swoich dzieci. Rodzina i znajomi mogą wpłacać przez BLIK na przyszłość dziecka.',
  keywords: ['skarbiec dziecka', 'kryptowaluty dla dzieci', 'bitcoin dla dzieci', 'oszczędności dziecka'],
  authors: [{ name: 'Skarbiec Dziecka' }],
  creator: 'Skarbiec Dziecka',
  publisher: 'Skarbiec Dziecka',
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Skarbiec Dziecka',
    description: 'Cyfrowe skarbce dla dzieci - inwestuj w przyszłość',
    url: 'https://skarbiecdziecka.pl',
    siteName: 'Skarbiec Dziecka',
    locale: 'pl_PL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {/* Web3 Providers (wagmi + React Query) */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
