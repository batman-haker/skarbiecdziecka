/**
 * My Treasuries API Route
 *
 * GET /api/my-treasuries
 *
 * Fetches all treasuries owned by the authenticated user.
 * Includes balance, contributions, and metadata.
 *
 * Response:
 * {
 *   success: true,
 *   treasuries: Array<{
 *     id: string,
 *     address: string,
 *     childName: string,
 *     childBirthDate: string,
 *     balance: string,
 *     totalContributions: string,
 *     totalWithdrawals: string,
 *     createdAt: string
 *   }>
 * }
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // 2. Fetch user's treasuries from database
    const { data: treasuries, error: dbError } = await supabase
      .from('treasuries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('[API] Database error:', dbError)
      return NextResponse.json(
        {
          error: 'Failed to fetch treasuries',
          details: dbError.message,
        },
        { status: 500 }
      )
    }

    // 3. Format response
    const formattedTreasuries = treasuries.map((treasury) => ({
      id: treasury.id,
      address: treasury.contract_address,
      childName: treasury.child_name,
      childBirthDate: treasury.child_birth_date,
      ownerAddress: treasury.owner_address,
      balance: treasury.balance || '0',
      totalContributions: treasury.total_contributions || '0',
      totalWithdrawals: treasury.total_withdrawals || '0',
      createdAt: treasury.created_at,
      updatedAt: treasury.updated_at,
    }))

    // 4. Return success response
    return NextResponse.json({
      success: true,
      count: formattedTreasuries.length,
      treasuries: formattedTreasuries,
    })
  } catch (error: any) {
    console.error('[API] Error fetching treasuries:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch treasuries',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
