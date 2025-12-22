/**
 * Dashboard Page
 *
 * Protected page - tylko dla zalogowanych użytkowników
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()

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

  if (loading) {
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

        {/* User Info Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 shadow-xl shadow-cyan-500/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">
            [USER_INFO] &gt; PROFIL
          </h2>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Email:</span>
              <span className="text-cyan-300">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">User ID:</span>
              <span className="text-cyan-300 text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Full Name:</span>
              <span className="text-cyan-300">{profile?.full_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Wallet Connected:</span>
              <span className={profile?.has_web3_wallet ? 'text-green-400' : 'text-yellow-400'}>
                {profile?.has_web3_wallet ? '✓ YES' : '✗ NO'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Created At:</span>
              <span className="text-cyan-300">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Treasuries Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-xl shadow-purple-500/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-purple-400 mb-6 font-mono">
            [TREASURIES] &gt; MOJE_SKARBCE
          </h2>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <p className="text-gray-400 mb-6 font-mono">
              // Nie masz jeszcze żadnych skarbców
            </p>
            <button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-purple-500/50 font-mono"
              onClick={() => alert('Create treasury feature coming soon!')}
            >
              ⚡ UTWÓRZ_PIERWSZY_SKARBIEC
            </button>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-green-400 font-bold mb-2 font-mono">
            ✓ LOGIN_SUCCESS
          </h3>
          <p className="text-gray-300 text-sm font-mono">
            Udało się! Jesteś zalogowany przez Google OAuth.<br/>
            Twój profil został automatycznie utworzony w bazie danych.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 p-8">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">
            [TODO] &gt; NASTĘPNE_KROKI
          </h3>
          <ul className="space-y-3 text-gray-300 font-mono text-sm">
            <li className="flex items-start">
              <span className="text-green-400 mr-3">✓</span>
              <span>Google OAuth login - DZIAŁA!</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-3">✓</span>
              <span>Auto-create user profile - DZIAŁA!</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-3">✓</span>
              <span>Protected routes (middleware) - DZIAŁA!</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3">⏸</span>
              <span>Backend relay wallet - TODO (Task #10)</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3">⏸</span>
              <span>Create treasury API - TODO (Task #11)</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3">⏸</span>
              <span>Full dashboard UI - TODO (Task #12)</span>
            </li>
          </ul>
        </div>

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
