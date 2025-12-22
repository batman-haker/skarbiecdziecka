/**
 * Login Page
 *
 * Simple login page with Google OAuth button
 * User clicks button → redirects to Google → comes back via callback
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 shadow-xl shadow-cyan-500/20">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
            ⚡ SKARBIEC DZIECKA
          </h1>
          <p className="text-cyan-300 text-sm font-mono">
            &gt; ZBUDUJ_PRZYSZŁOŚĆ_NA_BLOCKCHAIN_
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-cyan-500 text-sm font-medium rounded-md text-cyan-300 bg-gray-900 hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </span>
            <span className="font-mono">
              {loading ? '[...] &gt; ŁĄCZENIE...' : '[01] &gt; ZALOGUJ_PRZEZ_GOOGLE'}
            </span>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-400 font-mono">
              &gt; Pierwsze logowanie utworzy automatycznie profil
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded">
          <p className="text-xs text-cyan-300/70 font-mono">
            ℹ️ Po zalogowaniu będziesz mógł utworzyć skarbiec dla swojego dziecka bez potrzeby posiadania portfela MetaMask.
          </p>
        </div>
      </div>
    </div>
  )
}
