'use client';

/**
 * Landing Page - Skarbiec Dziecka
 * Główna strona z nawigacją i instrukcjami
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

export default function HomePage() {
  const router = useRouter();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [treasuryAddress, setTreasuryAddress] = useState('');

  const handleGoToTreasury = () => {
    if (treasuryAddress.trim()) {
      router.push(`/treasury/${treasuryAddress.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation Header */}
      <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎁</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Skarbiec Dziecka
              </span>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-3">
              {ready && authenticated ? (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                  >
                    <span>📊</span> Mój Dashboard
                  </button>
                  <button
                    onClick={() => logout()}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Wyloguj
                  </button>
                </>
              ) : (
                <button
                  onClick={() => login()}
                  disabled={!ready}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  Zaloguj przez Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="text-7xl mb-6 animate-bounce">🎁</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Skarbiec Dziecka
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Blockchain-owy fundusz oszczędnościowy dla Twojego dziecka.
            Rodzina wpłaca prezenty, środki są bezpieczne do 18 urodzin.
          </p>

          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {ready && authenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg shadow-purple-500/30"
              >
                📊 Przejdź do Dashboard
              </button>
            ) : (
              <button
                onClick={() => login()}
                disabled={!ready}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                🚀 Utwórz Skarbiec (Zaloguj się)
              </button>
            )}
          </div>

          {/* Logged in user info */}
          {ready && authenticated && user && (
            <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
              <span className="text-green-400 text-sm">
                ✓ Zalogowany jako: {user.email?.address || user.google?.email || 'użytkownik'}
              </span>
            </div>
          )}
        </div>

        {/* How it Works - 3 Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-10">
            Jak to działa?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-xl p-6 text-center hover:border-cyan-500/60 transition-all">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👨‍👩‍👧</span>
              </div>
              <div className="text-cyan-400 font-bold text-sm mb-2">KROK 1</div>
              <h3 className="text-xl font-bold text-white mb-3">Rodzic tworzy skarbiec</h3>
              <p className="text-gray-400 text-sm">
                Zaloguj się przez Google, podaj imię dziecka i datę urodzenia.
                Skarbiec zostaje zapisany na blockchain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-6 text-center hover:border-purple-500/60 transition-all">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👵👴</span>
              </div>
              <div className="text-purple-400 font-bold text-sm mb-2">KROK 2</div>
              <h3 className="text-xl font-bold text-white mb-3">Rodzina wpłaca prezenty</h3>
              <p className="text-gray-400 text-sm">
                Udostępnij link do skarbca. Babcia, dziadek, wujek - każdy może
                wpłacić ETH przez MetaMask.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800/50 border border-pink-500/30 rounded-xl p-6 text-center hover:border-pink-500/60 transition-all">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <div className="text-pink-400 font-bold text-sm mb-2">KROK 3</div>
              <h3 className="text-xl font-bold text-white mb-3">Środki rosną do 18-stki</h3>
              <p className="text-gray-400 text-sm">
                Tylko rodzic może wypłacić środki. Idealne na studia,
                mieszkanie lub start w dorosłość.
              </p>
            </div>
          </div>
        </div>

        {/* Two Paths Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* For Parents */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-8">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-bold text-white mb-4">Dla Rodziców</h3>
            <p className="text-gray-300 mb-6">
              Utwórz skarbiec dla swojego dziecka i zarządzaj nim przez dashboard.
              Zobacz wpłaty, wypłacaj środki.
            </p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Logowanie przez Google (bez MetaMask!)
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Twórz wiele skarbców
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Tylko Ty możesz wypłacać
              </li>
            </ul>
            {ready && authenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                📊 Otwórz Dashboard
              </button>
            ) : (
              <button
                onClick={() => login()}
                disabled={!ready}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
              >
                🔐 Zaloguj się przez Google
              </button>
            )}
          </div>

          {/* For Family */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-cyan-500/30 rounded-xl p-8">
            <div className="text-4xl mb-4">👵👴</div>
            <h3 className="text-2xl font-bold text-white mb-4">Dla Rodziny</h3>
            <p className="text-gray-300 mb-6">
              Dostałeś link do skarbca? Wpłać prezent dla dziecka przez MetaMask.
              Bez rejestracji!
            </p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Wpłacaj bez logowania
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Używaj MetaMask
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Twoje imię widoczne w historii
              </li>
            </ul>

            {/* Treasury Address Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={treasuryAddress}
                onChange={(e) => setTreasuryAddress(e.target.value)}
                placeholder="Wklej adres skarbca (0x...)"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleGoToTreasury}
                disabled={!treasuryAddress.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Otwórz Skarbiec
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            Dlaczego blockchain?
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h4 className="font-bold text-white mb-1">Bezpieczne</h4>
              <p className="text-gray-400 text-sm">Smart contract chroni środki</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📜</div>
              <h4 className="font-bold text-white mb-1">Transparentne</h4>
              <p className="text-gray-400 text-sm">Historia wpłat widoczna dla wszystkich</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💰</div>
              <h4 className="font-bold text-white mb-1">Tanie</h4>
              <p className="text-gray-400 text-sm">Base L2 = 500x taniej niż Ethereum</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🌍</div>
              <h4 className="font-bold text-white mb-1">Globalne</h4>
              <p className="text-gray-400 text-sm">Rodzina z całego świata może wpłacać</p>
            </div>
          </div>
        </div>

        {/* Demo Treasuries */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Przykładowe skarbce (testnet)
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push('/treasury/0x4125014B0bc0B6e12E38E5bf6387547609670170')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-mono text-sm transition-all border border-gray-700 hover:border-purple-500"
            >
              🎁 Skarbiec "hel"
            </button>
            <button
              onClick={() => router.push('/treasury/0xe7B7de9059A3201A7ba86276758c6A6C967e47e1')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-mono text-sm transition-all border border-gray-700 hover:border-purple-500"
            >
              🎁 Skarbiec "asa"
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
          <p className="mb-2">Skarbiec Dziecka • Powered by Base L2 (Sepolia Testnet)</p>
          <p>
            <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
              Base Network
            </a>
            {' • '}
            <a href="https://www.privy.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
              Privy Auth
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
