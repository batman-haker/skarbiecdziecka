'use client';

import { useRouter, usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

export default function NavHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, logout } = usePrivy();

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🎁</span>
            <span className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Skarbiec Dziecka
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {ready && authenticated ? (
              <>
                {pathname !== '/dashboard' && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm sm:text-base"
                  >
                    <span>📊</span>
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => logout()}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base"
                >
                  Wyloguj
                </button>
              </>
            ) : ready ? (
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 rounded-lg font-bold transition-all text-sm sm:text-base"
              >
                Zaloguj
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
