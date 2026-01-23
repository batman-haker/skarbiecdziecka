/**
 * Privy Demo Page
 *
 * Przykład użycia Privy dla embedded wallets
 * User może zalogować się przez Email/Google i automatycznie dostanie wallet
 */

'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PrivyDemoPage() {
  const router = useRouter()
  const { ready, authenticated, user, login, logout, createWallet } = usePrivy()
  const { wallets } = useWallets()

  // Auto-sync wallet to Supabase when detected
  useEffect(() => {
    const syncWalletToSupabase = async () => {
      if (ready && authenticated && user && wallets.length > 0) {
        const walletAddress = wallets[0].address
        console.log('[Privy] User authenticated with wallet:', walletAddress)

        try {
          // Sync wallet address to Supabase profile
          const response = await fetch('/api/sync-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          })

          const data = await response.json()

          if (data.success) {
            console.log('[Privy] Wallet synced to Supabase:', data.walletAddress)
          } else {
            console.error('[Privy] Failed to sync wallet:', data.error)
          }
        } catch (err) {
          console.error('[Privy] Error syncing wallet:', err)
        }
      }

      if (ready && authenticated && user && wallets.length === 0) {
        console.log('[Privy] User authenticated but no wallet found')
        console.log('[Privy] Wallet will be auto-created when needed')
      }
    }

    syncWalletToSupabase()
  }, [ready, authenticated, user, wallets])

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-mono animate-pulse">
          &gt; LOADING PRIVY...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
            ⚡ PRIVY DEMO
          </h1>
          <p className="text-cyan-300 font-mono">
            &gt; Embedded Wallets - Zero MetaMask Required_
          </p>
        </div>

        {/* Not Authenticated */}
        {!authenticated && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 shadow-xl shadow-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">
              [LOGIN] &gt; Zaloguj się przez Privy
            </h2>

            <div className="space-y-4 mb-8">
              <p className="text-gray-300 font-mono text-sm">
                ✅ Privy automatycznie utworzy wallet dla Ciebie
              </p>
              <p className="text-gray-300 font-mono text-sm">
                ✅ Nie potrzebujesz MetaMask ani innego portfela
              </p>
              <p className="text-gray-300 font-mono text-sm">
                ✅ Login przez Email lub Google
              </p>
              <p className="text-gray-300 font-mono text-sm">
                ✅ Wallet jest zaszyfrowany i bezpieczny
              </p>
            </div>

            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-lg transition-all shadow-lg shadow-cyan-500/50 font-mono text-lg"
            >
              ⚡ ZALOGUJ PRZEZ PRIVY
            </button>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-yellow-300 text-xs font-mono">
                ℹ️ Privy zastępuje tradycyjne logowanie + MetaMask jednym rozwiązaniem.
                User dostaje wallet automatycznie przy pierwszym logowaniu.
              </p>
            </div>
          </div>
        )}

        {/* Authenticated */}
        {authenticated && user && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-green-500/30 shadow-xl shadow-green-500/20 p-8">
              <h2 className="text-2xl font-bold text-green-400 mb-6 font-mono">
                [USER_INFO] &gt; Zalogowany!
              </h2>

              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-cyan-300 text-xs">{user.id}</span>
                </div>

                {user.email && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-cyan-300">{user.email.address}</span>
                  </div>
                )}

                {user.google && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Google:</span>
                    <span className="text-cyan-300">{user.google.email}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Created At:</span>
                  <span className="text-cyan-300">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallets Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-xl shadow-purple-500/20 p-8">
              <h2 className="text-2xl font-bold text-purple-400 mb-6 font-mono">
                [WALLETS] &gt; Twoje Embedded Wallets
              </h2>

              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-yellow-400 font-mono mb-4">
                    ⚠️ Wallet jeszcze nie utworzony
                  </p>
                  <p className="text-gray-400 text-sm font-mono mb-6">
                    Kliknij poniżej aby utworzyć swój embedded wallet.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        try {
                          console.log('[Privy] Creating wallet...')
                          if (createWallet) {
                            await createWallet()
                            console.log('[Privy] Wallet created successfully!')
                          } else {
                            // Fallback: reload page to trigger auto-creation
                            console.log('[Privy] createWallet not available, reloading...')
                            window.location.reload()
                          }
                        } catch (err) {
                          console.error('[Privy] Error creating wallet:', err)
                          alert('Błąd podczas tworzenia walleta. Spróbuj wylogować się i zalogować ponownie.')
                        }
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-purple-500/50 font-mono"
                    >
                      ⚡ UTWÓRZ WALLET
                    </button>

                    <button
                      onClick={() => {
                        logout()
                        setTimeout(() => login(), 100)
                      }}
                      className="w-full border border-gray-600 text-gray-400 px-6 py-3 rounded-lg font-mono hover:bg-gray-700 transition-all"
                    >
                      🔄 LUB WYLOGUJ I ZALOGUJ PONOWNIE
                    </button>

                    <p className="text-xs text-gray-500 font-mono">
                      (Wallet zostanie automatycznie utworzony)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {wallets.map((wallet, index) => (
                    <div
                      key={wallet.address}
                      className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-purple-400 font-mono text-sm">
                          Wallet #{index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            wallet.walletClientType === 'privy'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {wallet.walletClientType}
                        </span>
                      </div>

                      <div className="space-y-2 font-mono text-xs">
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <div className="text-cyan-300 break-all mt-1">{wallet.address}</div>
                        </div>

                        <div>
                          <span className="text-gray-400">Chain:</span>
                          <span className="text-cyan-300 ml-2">{wallet.chainId}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
                <p className="text-green-300 text-xs font-mono">
                  ✅ Ten wallet może być używany do tworzenia skarbców!
                  Zapisz wallet.address do bazy danych jako owner.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-cyan-500/50 font-mono"
              >
                &gt; IDŹ DO DASHBOARD
              </button>

              <button
                onClick={logout}
                className="px-8 py-3 border border-red-400 text-red-400 hover:bg-red-400/10 rounded-lg font-mono transition-all"
              >
                &gt; WYLOGUJ
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-6">
          <h3 className="text-cyan-400 font-bold mb-3 font-mono">
            [INFO] &gt; Jak to działa?
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm font-mono">
            <li>• Privy zarządza walletami za Ciebie</li>
            <li>• Private keys są zaszyfrowane i bezpieczne</li>
            <li>• User może wyeksportować wallet do MetaMask (opcjonalnie)</li>
            <li>• Działa jak normalna strona - zero barier wejścia</li>
            <li>• Idealnie dla użytkowników bez wiedzy o crypto</li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-cyan-300 font-mono"
          >
            &lt; Powrót do strony głównej
          </button>
        </div>
      </div>
    </div>
  )
}
