/**
 * Relay Wallet Status API Route
 *
 * GET /api/relay-status
 *
 * Returns the current status of the relay wallet.
 * This endpoint is useful for monitoring and admin dashboard.
 *
 * Note: This should be protected in production (admin only)
 */

import { getRelayWalletBalance } from '@/lib/wallet/relay'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success: rateLimitOk } = rateLimit(ip, 'relay-status', RATE_LIMITS.read)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Zbyt wiele zapytan.' }, { status: 429 })
    }

    // Get relay wallet balance
    const { address, balanceInEth } = await getRelayWalletBalance()

    const balanceNum = parseFloat(balanceInEth)
    const estimatedTreasuries = Math.floor(balanceNum / 0.001) // Assuming ~0.001 ETH per treasury

    let status: 'good' | 'low' | 'empty'
    let message: string

    if (balanceNum === 0) {
      status = 'empty'
      message = 'Relay wallet has no funds. Please fund immediately!'
    } else if (balanceNum < 0.01) {
      status = 'low'
      message = 'Relay wallet balance is low. Please refund soon.'
    } else {
      status = 'good'
      message = 'Relay wallet has sufficient balance.'
    }

    return NextResponse.json({
      success: true,
      relay: {
        address,
        balance: balanceInEth,
        balanceETH: `${balanceInEth} ETH`,
        status,
        message,
        estimatedTreasuries,
        network: 'Base Sepolia',
        chainId: 84532,
      },
      faucets: {
        alchemy: 'https://www.alchemy.com/faucets/base-sepolia',
        coinbase: 'https://portal.cdp.coinbase.com/products/faucet',
      },
    })
  } catch (error: any) {
    console.error('[API] Error checking relay status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check relay wallet status',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
