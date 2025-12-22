/**
 * OAuth Callback Handler
 *
 * Google redirects here after successful login
 * GET /auth/callback?code=xxx
 *
 * This exchanges the code for a session and redirects to dashboard
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // No code present, redirect back to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
