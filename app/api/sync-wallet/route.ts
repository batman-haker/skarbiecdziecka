/**
 * Sync Wallet API Route
 *
 * POST /api/sync-wallet
 *
 * Syncs the user's Privy wallet address to their Supabase profile.
 * This ensures the backend knows the user's wallet address for treasury creation.
 *
 * Also sends welcome ETH to new users (gas sponsorship).
 *
 * Request body:
 * {
 *   walletAddress: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   walletAddress: string,
 *   welcomeETH?: { txHash: string, amountSent: string }
 * }
 */

import { createClient } from '@/lib/supabase/server'
import { sendWelcomeETH } from '@/lib/wallet/relay'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success: rateLimitOk } = rateLimit(ip, 'sync-wallet', RATE_LIMITS.syncWallet)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Zbyt wiele prob. Poczekaj minute.' }, { status: 429 })
    }

    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { walletAddress } = body

    // 3. Validate wallet address (basic Ethereum address validation)
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Check if it looks like an Ethereum address (0x + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
    }

    console.log('[API] Syncing wallet for user:', user.id)
    console.log('[API] Wallet address:', walletAddress)

    // 4. Check if this is a new wallet (user doesn't have wallet_address yet)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    const isNewWallet = !existingProfile?.wallet_address

    // 5. Update user profile with wallet address
    const { data: profile, error: updateError } = await supabase
      .from('users')
      .update({ wallet_address: walletAddress })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[API] Database error:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to sync wallet address',
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    console.log('[API] Wallet synced successfully:', profile.wallet_address)

    // 6. Send welcome ETH if this is a new wallet
    let welcomeETH = null
    if (isNewWallet) {
      console.log('[API] New wallet detected! Sending welcome ETH...')
      try {
        const result = await sendWelcomeETH(walletAddress, '0.001')
        if (result.txHash) {
          console.log('[API] Welcome ETH sent:', result)
          welcomeETH = result
        } else {
          console.log('[API] Welcome ETH skipped (user already has balance)')
        }
      } catch (err) {
        console.error('[API] Error sending welcome ETH:', err)
        // Don't fail the request if welcome ETH fails
      }
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      walletAddress: profile.wallet_address,
      welcomeETH,
      isNewWallet,
    })
  } catch (error: any) {
    console.error('[API] Error syncing wallet:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync wallet',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
