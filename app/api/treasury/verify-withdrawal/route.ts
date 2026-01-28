/**
 * Verify Withdrawal Password API
 *
 * POST /api/treasury/verify-withdrawal
 *
 * Verifies the withdrawal passphrase before allowing a withdrawal.
 * This is the 2FA for withdrawals - user needs Google login + passphrase.
 *
 * Request body:
 * {
 *   treasuryAddress: string,
 *   passphrase: string (4 words separated by dashes)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   verified: true/false
 * }
 */

import { createClient } from '@/lib/supabase/server'
import { verifyPassphrase, isValidPassphraseFormat } from '@/lib/security/withdrawal-password'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
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
    const { treasuryAddress, passphrase } = body

    // 3. Validate input
    if (!treasuryAddress || typeof treasuryAddress !== 'string') {
      return NextResponse.json({ error: 'Invalid treasury address' }, { status: 400 })
    }

    if (!passphrase || typeof passphrase !== 'string') {
      return NextResponse.json({ error: 'Invalid passphrase' }, { status: 400 })
    }

    // Validate passphrase format (4 words)
    if (!isValidPassphraseFormat(passphrase)) {
      return NextResponse.json(
        { error: 'Invalid passphrase format. Use 4 words separated by dashes (e.g., kot-dom-słońce-rower)' },
        { status: 400 }
      )
    }

    // 4. Get treasury from database
    const { data: treasury, error: treasuryError } = await supabase
      .from('treasuries')
      .select('id, owner_user_id, withdrawal_password_hash')
      .eq('contract_address', treasuryAddress.toLowerCase())
      .single()

    if (treasuryError || !treasury) {
      // Try with original case
      const { data: treasury2, error: treasuryError2 } = await supabase
        .from('treasuries')
        .select('id, owner_user_id, withdrawal_password_hash')
        .eq('contract_address', treasuryAddress)
        .single()

      if (treasuryError2 || !treasury2) {
        return NextResponse.json({ error: 'Treasury not found' }, { status: 404 })
      }

      // Use treasury2
      if (treasury2.owner_user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized - you are not the owner' }, { status: 403 })
      }

      if (!treasury2.withdrawal_password_hash) {
        // Old treasury without password - allow withdrawal (backwards compatibility)
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Treasury created before password system - no verification needed',
        })
      }

      // Verify passphrase
      const isValid = await verifyPassphrase(passphrase.toLowerCase().trim(), treasury2.withdrawal_password_hash)

      if (!isValid) {
        // Log failed attempt for security monitoring
        console.log(`[Security] Failed withdrawal attempt for treasury ${treasuryAddress} by user ${user.id}`)

        return NextResponse.json({
          success: false,
          verified: false,
          error: 'Incorrect passphrase',
        })
      }

      return NextResponse.json({
        success: true,
        verified: true,
      })
    }

    // 5. Verify ownership
    if (treasury.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized - you are not the owner' }, { status: 403 })
    }

    // 6. Check if treasury has password set
    if (!treasury.withdrawal_password_hash) {
      // Old treasury without password - allow withdrawal (backwards compatibility)
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Treasury created before password system - no verification needed',
      })
    }

    // 7. Verify passphrase against stored hash
    const isValid = await verifyPassphrase(passphrase.toLowerCase().trim(), treasury.withdrawal_password_hash)

    if (!isValid) {
      // Log failed attempt for security monitoring
      console.log(`[Security] Failed withdrawal attempt for treasury ${treasuryAddress} by user ${user.id}`)

      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Incorrect passphrase',
      })
    }

    // 8. Success!
    console.log(`[Security] Successful passphrase verification for treasury ${treasuryAddress}`)

    return NextResponse.json({
      success: true,
      verified: true,
    })
  } catch (error: any) {
    console.error('[API] Error verifying passphrase:', error)

    return NextResponse.json(
      {
        error: 'Failed to verify passphrase',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
