/**
 * Create Treasury API Route
 *
 * POST /api/treasury/create
 *
 * Creates a new treasury using the backend relay wallet.
 * The relay wallet pays for gas, so users don't need MetaMask.
 *
 * Request body:
 * {
 *   childName: string,
 *   childBirthDate: number (Unix timestamp)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   treasury: {
 *     id: string,
 *     address: string,
 *     childName: string,
 *     txHash: string
 *   }
 * }
 */

import { createClient } from '@/lib/supabase/server'
import { createTreasuryViaRelay } from '@/lib/wallet/relay'
import { generatePassphrase, hashPassphrase } from '@/lib/security/withdrawal-password'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success: rateLimitOk } = rateLimit(ip, 'treasury/create', RATE_LIMITS.createTreasury)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Zbyt wiele prob. Poczekaj 10 minut.' }, { status: 429 })
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
    const { childName, childBirthDate, lockUntil } = body

    // 3. Validate input
    if (!childName || typeof childName !== 'string') {
      return NextResponse.json({ error: 'Invalid child name' }, { status: 400 })
    }

    if (!childBirthDate || typeof childBirthDate !== 'number') {
      return NextResponse.json({ error: 'Invalid child birth date' }, { status: 400 })
    }

    // Validate birth date is not in the future
    const now = Math.floor(Date.now() / 1000)
    if (childBirthDate > now) {
      return NextResponse.json({ error: 'Birth date cannot be in the future' }, { status: 400 })
    }

    // Validate child name length
    if (childName.length < 2 || childName.length > 50) {
      return NextResponse.json(
        { error: 'Child name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }

    // 4. Get user's wallet address from profile (if they have one)
    // If user doesn't have a wallet, we'll use their user ID as owner
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Owner address: use wallet_address if available, otherwise use a deterministic address based on user ID
    // For now, we'll require users to connect wallet first
    // TODO: In future, allow creating treasury without wallet and assign ownership later
    const ownerAddress = profile.wallet_address

    if (!ownerAddress) {
      return NextResponse.json(
        {
          error:
            'Please connect your Web3 wallet first. You need a wallet address to own the treasury.',
        },
        { status: 400 }
      )
    }

    console.log('[API] Creating treasury for user:', user.id)
    console.log('[API] Child name:', childName)
    console.log('[API] Owner address:', ownerAddress)

    // 5. Generate withdrawal passphrase (4 words)
    const withdrawalPassphrase = generatePassphrase()
    const passphraseHash = await hashPassphrase(withdrawalPassphrase)
    console.log('[API] Withdrawal passphrase generated (NOT logging actual passphrase for security)')

    // Validate lockUntil if provided
    const parsedLockUntil = typeof lockUntil === 'number' && lockUntil > 0 ? lockUntil : 0

    // 6. Create treasury on blockchain using relay wallet
    const { treasuryAddress, txHash } = await createTreasuryViaRelay(
      childName,
      childBirthDate,
      ownerAddress,
      parsedLockUntil
    )

    console.log('[API] Treasury created:', treasuryAddress)
    console.log('[API] Transaction:', txHash)

    // 7. Save treasury to database with passphrase hash
    const { data: treasury, error: dbError } = await supabase
      .from('treasuries')
      .insert({
        owner_user_id: user.id,
        contract_address: treasuryAddress,
        child_name: childName,
        child_birth_date: childBirthDate, // Store as Unix timestamp (BIGINT)
        owner_wallet_address: ownerAddress,
        total_eth_balance: 0,
        total_contributions_count: 0,
        lock_until: parsedLockUntil,
        withdrawal_password_hash: passphraseHash, // Store HASH only!
      })
      .select()
      .single()

    if (dbError) {
      console.error('[API] Database error:', dbError)
      return NextResponse.json(
        {
          error: 'Failed to save treasury to database',
          details: dbError.message,
          // Still return the treasury address so user can access it
          treasuryAddress,
          txHash,
        },
        { status: 500 }
      )
    }

    // 8. Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'treasury_created',
      title: 'Skarbiec utworzony!',
      message: `Skarbiec dla ${childName} został pomyślnie utworzony. WAŻNE: Zapisz hasło wypłaty!`,
      metadata: {
        treasury_id: treasury.id,
        treasury_address: treasuryAddress,
        tx_hash: txHash,
      },
    })

    // 9. Return success response WITH passphrase (shown ONCE!)
    // CRITICAL: This is the ONLY time the passphrase is returned to the user
    // It is NOT stored in plain text anywhere - only the hash is in the database
    return NextResponse.json({
      success: true,
      treasury: {
        id: treasury.id,
        address: treasuryAddress,
        childName,
        childBirthDate,
        ownerAddress,
        txHash,
        balance: '0',
        createdAt: treasury.created_at,
      },
      // IMPORTANT: Show this to user ONCE and tell them to save it!
      withdrawalPassphrase: withdrawalPassphrase,
      securityWarning: 'ZAPISZ TO HASŁO! Będzie potrzebne do wypłaty środków. To hasło nie będzie już nigdy pokazane.',
    })
  } catch (error: any) {
    console.error('[API] Error creating treasury:', error)

    // Handle specific errors
    if (error.message.includes('insufficient balance')) {
      return NextResponse.json(
        {
          error: 'Relay wallet has insufficient funds. Please contact support.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create treasury',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
