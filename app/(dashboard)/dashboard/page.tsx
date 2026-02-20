/**
 * Dashboard Page - Enhanced with Privy & Treasury Creation
 *
 * Protected page - tylko dla zalogowanych użytkowników
 * Supports: Supabase auth + Privy embedded wallets + MetaMask
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import NavHeader from '@/app/components/NavHeader'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // Supabase auth
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Privy
  const { ready: privyReady, authenticated: privyAuth } = usePrivy()
  const { wallets } = useWallets()

  // Treasury creation
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [childName, setChildName] = useState('')
  const [childBirthDate, setChildBirthDate] = useState('')
  const [lockPeriod, setLockPeriod] = useState('0') // '0' = no lock
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Passphrase modal (shown after treasury creation)
  const [showPassphraseModal, setShowPassphraseModal] = useState(false)
  const [createdPassphrase, setCreatedPassphrase] = useState('')
  const [createdTreasuryAddress, setCreatedTreasuryAddress] = useState('')
  const [passphraseCopied, setPassphraseCopied] = useState(false)
  const [passphraseConfirmed, setPassphraseConfirmed] = useState(false)

  // Treasuries list
  const [treasuries, setTreasuries] = useState<any[]>([])
  const [loadingTreasuries, setLoadingTreasuries] = useState(false)

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get user profile from database
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)
      setLoading(false)
    }

    loadUser()
  }, [router])

  // Auto-sync Privy wallet to Supabase
  useEffect(() => {
    if (!user || !privyReady) return

    const syncWallet = async () => {
      if (wallets.length > 0) {
        const walletAddress = wallets[0].address
        console.log('[Dashboard] Syncing wallet:', walletAddress)

        try {
          const response = await fetch('/api/sync-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          })

          const data = await response.json()
          if (data.success) {
            console.log('[Dashboard] Wallet synced successfully')

            // Show success message if welcome ETH was sent
            if (data.welcomeETH && data.welcomeETH.txHash) {
              setSuccess(
                `🎉 Witamy! Otrzymałeś ${data.welcomeETH.amountSent} ETH na start! Możesz teraz tworzyć skarbce.`
              )
            }
          }
        } catch (err) {
          console.error('[Dashboard] Error syncing wallet:', err)
        }
      }
    }

    syncWallet()
  }, [user, privyReady, wallets])

  // Load treasuries
  useEffect(() => {
    if (!user) return

    const loadTreasuries = async () => {
      setLoadingTreasuries(true)
      try {
        const response = await fetch('/api/my-treasuries')
        const data = await response.json()
        if (data.success) {
          setTreasuries(data.treasuries || [])
        }
      } catch (err) {
        console.error('Error loading treasuries:', err)
      }
      setLoadingTreasuries(false)
    }

    loadTreasuries()
  }, [user])

  // Get wallet address (Privy or MetaMask)
  const getWalletAddress = () => {
    // Privy embedded wallet (preferred)
    if (wallets.length > 0) {
      return wallets[0].address
    }
    // No wallet
    return null
  }

  const walletAddress = getWalletAddress()

  // Handle create treasury
  const handleCreateTreasury = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!walletAddress) {
      setError('Najpierw połącz wallet! Idź na /privy-demo żeby założyć Privy wallet.')
      return
    }

    if (!childName || childName.length < 2) {
      setError('Imię dziecka musi mieć min. 2 znaki')
      return
    }

    if (!childBirthDate) {
      setError('Podaj datę urodzenia dziecka')
      return
    }

    setCreating(true)

    try {
      // Convert date to Unix timestamp
      const birthDateUnix = Math.floor(new Date(childBirthDate).getTime() / 1000)

      // Calculate lockUntil timestamp based on selected period
      let lockUntil = 0
      const now = Math.floor(Date.now() / 1000)
      if (lockPeriod === '1m') {
        lockUntil = now + 30 * 24 * 60 * 60 // 1 month
      } else if (lockPeriod === '1y') {
        lockUntil = now + 365 * 24 * 60 * 60 // 1 year
      } else if (lockPeriod === '5y') {
        lockUntil = now + 5 * 365 * 24 * 60 * 60 // 5 years
      } else if (lockPeriod === '10y') {
        lockUntil = now + 10 * 365 * 24 * 60 * 60 // 10 years
      } else if (lockPeriod === '18') {
        // Lock until child turns 18
        const birthDateObj = new Date(childBirthDate)
        const eighteenthBirthday = new Date(birthDateObj)
        eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18)
        lockUntil = Math.floor(eighteenthBirthday.getTime() / 1000)
        if (lockUntil <= now) {
          setError('Dziecko ma juz 18 lat - nie mozna ustawic blokady do 18 urodzin')
          setCreating(false)
          return
        }
      }

      console.log('[Dashboard] Creating treasury...', { childName, birthDateUnix, lockUntil })

      const response = await fetch('/api/treasury/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName,
          childBirthDate: birthDateUnix,
          lockUntil,
        }),
      })

      const data = await response.json()
      console.log('[Dashboard] API response:', { status: response.status, data })

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.error || data.details || 'Failed to create treasury'
        console.error('[Dashboard] Error from API:', errorMsg)
        throw new Error(errorMsg)
      }

      // Store passphrase and show modal
      console.log('[Dashboard] Passphrase received:', data.withdrawalPassphrase ? 'YES' : 'NO')
      console.log('[Dashboard] Full response data:', JSON.stringify(data, null, 2))

      if (data.withdrawalPassphrase) {
        console.log('[Dashboard] Setting passphrase modal state...')
        setCreatedPassphrase(data.withdrawalPassphrase)
        setCreatedTreasuryAddress(data.treasury.address)
        setShowPassphraseModal(true)
        setPassphraseCopied(false)
        setPassphraseConfirmed(false)
        console.log('[Dashboard] Modal should now be visible!')
      } else {
        console.warn('[Dashboard] No passphrase in response!')
        setSuccess(`✅ Skarbiec utworzony! Adres: ${data.treasury.address.slice(0, 10)}...`)
      }

      setShowCreateForm(false)
      setChildName('')
      setChildBirthDate('')
    } catch (err: any) {
      console.error('[Dashboard] Error creating treasury:', err)
      const errorMessage = err.message || 'Błąd podczas tworzenia skarbca'

      // Make error more user-friendly
      if (errorMessage.includes('insufficient balance') || errorMessage.includes('insufficient funds')) {
        setError('⚠️ Relay wallet nie ma wystarczających środków (0 ETH). Musisz zasilić relay wallet z faucet!')
      } else {
        setError(errorMessage)
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading || !privyReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-mono animate-pulse">
          &gt; LOADING...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <NavHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
            ⚡ DASHBOARD
          </h1>
          <p className="text-cyan-300 font-mono">
            &gt; WITAJ, {profile?.full_name || user.email}_
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 font-mono text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Important Notice - Relay Wallet Funding */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-yellow-400 font-bold mb-3 font-mono flex items-center gap-2">
            <span>⚠️</span>
            <span>[WAŻNE] &gt; RELAY_WALLET_WYMAGA_ZASILENIA</span>
          </h3>
          <div className="space-y-3 text-sm font-mono">
            <p className="text-gray-300">
              Backend relay wallet musi mieć ETH aby pokryć koszty gas przy tworzeniu skarbców.
            </p>
            <div className="bg-gray-900/50 rounded p-3 border border-yellow-500/20">
              <p className="text-gray-400 mb-1">Relay Wallet Address:</p>
              <p className="text-cyan-300 text-xs break-all">
                0xb438739bA33f0f71f4a5f954A4777BbeC8a19788
              </p>
            </div>
            <p className="text-gray-300">
              <span className="text-yellow-400">1.</span> Idź na faucet:{' '}
              <a
                href="https://www.alchemy.com/faucets/base-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Alchemy Base Sepolia Faucet
              </a>
            </p>
            <p className="text-gray-300">
              <span className="text-yellow-400">2.</span> Wklej powyższy adres i wyślij 0.1 ETH
            </p>
            <p className="text-gray-300">
              <span className="text-yellow-400">3.</span> Poczekaj ~30 sekund na potwierdzenie
            </p>
            <p className="text-gray-300">
              <span className="text-yellow-400">4.</span> Odśwież stronę i spróbuj utworzyć skarbiec ponownie
            </p>
          </div>
        </div>

        {/* Wallet Status Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 shadow-xl shadow-cyan-500/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">
            [WALLET_STATUS] &gt; PORTFEL
          </h2>

          {walletAddress ? (
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">✓ POŁĄCZONY</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Address:</span>
                <span className="text-cyan-300 text-xs">{walletAddress}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Typ:</span>
                <span className="text-purple-400">
                  {wallets.length > 0 ? 'Privy Embedded' : 'MetaMask'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-yellow-400 font-mono mb-4">⚠️ Brak portfela</p>
              <p className="text-gray-400 text-sm font-mono mb-6">
                Potrzebujesz portfel żeby tworzyć skarbce
              </p>
              <button
                onClick={() => router.push('/privy-demo')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-purple-500/50 font-mono"
              >
                ⚡ UTWÓRZ PRIVY WALLET
              </button>
            </div>
          )}
        </div>

        {/* Treasuries Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-xl shadow-purple-500/20 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400 font-mono">
              [TREASURIES] &gt; MOJE_SKARBCE
            </h2>
            <span className="text-gray-400 font-mono text-sm">
              {treasuries.length} skarbców
            </span>
          </div>

          {loadingTreasuries ? (
            <div className="text-center py-8">
              <p className="text-cyan-400 font-mono animate-pulse">LOADING...</p>
            </div>
          ) : treasuries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏦</div>
              <p className="text-gray-400 mb-6 font-mono">
                // Nie masz jeszcze żadnych skarbców
              </p>
              {walletAddress ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-purple-500/50 font-mono"
                >
                  ⚡ UTWÓRZ_PIERWSZY_SKARBIEC
                </button>
              ) : (
                <p className="text-yellow-400 text-sm font-mono">
                  Najpierw połącz wallet →{' '}
                  <button
                    onClick={() => router.push('/privy-demo')}
                    className="underline"
                  >
                    /privy-demo
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {treasuries.map((treasury) => (
                <div
                  key={treasury.id}
                  className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-purple-400 font-mono mb-1">
                        🎁 {treasury.childName}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {treasury.address.slice(0, 10)}...{treasury.address.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400 font-mono">
                        {parseFloat(treasury.balance || '0').toFixed(4)} ETH
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {new Date(treasury.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/treasury/${treasury.address}`)}
                      className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 px-4 rounded-lg text-sm font-mono transition-all border border-purple-500/30"
                    >
                      👁 Zobacz skarbiec
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = `${window.location.origin}/treasury/${treasury.address}`;
                        navigator.clipboard.writeText(link);
                        setSuccess(`Link skopiowany: ${link.slice(0, 40)}...`);
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-2 px-4 rounded-lg text-sm font-mono transition-all border border-cyan-500/30"
                    >
                      🔗 Udostępnij
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gray-900/50 border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-lg py-4 text-purple-400 font-mono transition-all"
              >
                + UTWÓRZ KOLEJNY SKARBIEC
              </button>
            </div>
          )}
        </div>

        {/* Create Treasury Form (Modal) */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-purple-500/30 shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-purple-400 mb-6 font-mono">
                [CREATE] &gt; NOWY_SKARBIEC
              </h2>

              <form onSubmit={handleCreateTreasury} className="space-y-6">
                <div>
                  <label className="block text-gray-400 font-mono text-sm mb-2">
                    Imię dziecka:
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="np. Ola"
                    className="w-full bg-gray-900 border border-cyan-500/30 rounded px-4 py-3 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-mono text-sm mb-2">
                    Data urodzenia:
                  </label>
                  <input
                    type="date"
                    value={childBirthDate}
                    onChange={(e) => setChildBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-900 border border-cyan-500/30 rounded px-4 py-3 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-mono text-sm mb-2">
                    Blokada srodkow:
                  </label>
                  <select
                    value={lockPeriod}
                    onChange={(e) => setLockPeriod(e.target.value)}
                    className="w-full bg-gray-900 border border-cyan-500/30 rounded px-4 py-3 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="0">Bez blokady (wyplata w dowolnym momencie)</option>
                    <option value="1m">1 miesiac</option>
                    <option value="1y">1 rok</option>
                    <option value="5y">5 lat</option>
                    <option value="10y">10 lat</option>
                    <option value="18">Do 18 urodzin dziecka</option>
                  </select>
                  {lockPeriod !== '0' && (
                    <p className="text-xs text-yellow-400 font-mono mt-2">
                      ⚠️ Po zablokowaniu nie bedzie mozliwa wyplata do czasu wygasniecia blokady!
                    </p>
                  )}
                </div>

                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded p-4">
                  <p className="text-xs text-cyan-300 font-mono">
                    ℹ️ Skarbiec zostanie utworzony na blockchain Base Sepolia.
                    Backend relay wallet pokryje koszty gas (~$0.30).
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setError('')
                    }}
                    className="flex-1 border border-gray-600 text-gray-400 px-6 py-3 rounded-lg font-mono hover:bg-gray-700 transition-all"
                    disabled={creating}
                  >
                    ANULUJ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg shadow-purple-500/50 font-mono disabled:opacity-50"
                    disabled={creating}
                  >
                    {creating ? 'TWORZENIE...' : '⚡ UTWÓRZ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Passphrase Modal - CRITICAL: Shown once after treasury creation */}
        {showPassphraseModal && createdPassphrase && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border-2 border-yellow-500/50 shadow-2xl max-w-lg w-full p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-yellow-400 font-mono mb-2">
                  ZAPISZ HASŁO WYPŁATY!
                </h2>
                <p className="text-red-400 font-mono text-sm">
                  ⚠️ TO HASŁO NIE BĘDZIE JUŻ NIGDY POKAZANE!
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-yellow-500/30">
                <p className="text-gray-400 text-xs font-mono mb-2 text-center">
                  Twoje 4-słowne hasło wypłaty:
                </p>
                <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-300 font-mono tracking-wider">
                    {createdPassphrase}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdPassphrase)
                    setPassphraseCopied(true)
                  }}
                  className={`w-full mt-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    passphraseCopied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                  }`}
                >
                  {passphraseCopied ? '✓ Skopiowano!' : '📋 Kopiuj hasło'}
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <ul className="text-sm text-red-300 font-mono space-y-2">
                  <li>• Zapisz to hasło w bezpiecznym miejscu</li>
                  <li>• Będzie potrzebne do KAŻDEJ wypłaty</li>
                  <li>• Bez hasła nie wypłacisz środków</li>
                  <li>• Nie da się go odzyskać!</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passphraseConfirmed}
                    onChange={(e) => setPassphraseConfirmed(e.target.checked)}
                    className="w-5 h-5 rounded border-yellow-500 bg-gray-900 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-gray-300 font-mono text-sm">
                    Zapisałem/am hasło i rozumiem, że nie będzie pokazane ponownie
                  </span>
                </label>

                <button
                  onClick={() => {
                    if (passphraseConfirmed) {
                      setShowPassphraseModal(false)
                      setCreatedPassphrase('')
                      setSuccess(`✅ Skarbiec utworzony! Adres: ${createdTreasuryAddress.slice(0, 10)}...`)
                      // Reload treasuries after a delay
                      setTimeout(() => {
                        window.location.reload()
                      }, 2000)
                    }
                  }}
                  disabled={!passphraseConfirmed}
                  className={`w-full py-3 rounded-lg font-bold font-mono transition-all ${
                    passphraseConfirmed
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {passphraseConfirmed ? '✓ ROZUMIEM, ZAMKNIJ' : 'Potwierdź powyżej aby kontynuować'}
                </button>
              </div>

              <p className="text-center text-gray-500 text-xs font-mono mt-4">
                Skarbiec: {createdTreasuryAddress.slice(0, 10)}...{createdTreasuryAddress.slice(-6)}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-red-400 hover:text-red-300 font-mono border border-red-400 px-6 py-2 rounded hover:shadow-lg hover:shadow-red-500/50 transition-all"
            >
              &gt; WYLOGUJ
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
