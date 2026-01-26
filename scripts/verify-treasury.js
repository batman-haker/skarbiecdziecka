/**
 * Verify Treasury Details
 * Checks owner, child info, and balance of a specific treasury
 */
const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

const TreasuryVaultABI = require('../lib/contracts/TreasuryVault.json')

// Treasury address to check
const TREASURY_ADDRESS = '0xe7B7de9059A3201A7ba86276758c6A6C967e47e1'
const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'

async function verifyTreasury() {
  console.log('\n🔍 VERIFYING TREASURY DETAILS...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📍 Treasury Address:', TREASURY_ADDRESS)
  console.log('🔗 Basescan:', `https://sepolia.basescan.org/address/${TREASURY_ADDRESS}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC)
    const treasury = new ethers.Contract(TREASURY_ADDRESS, TreasuryVaultABI, provider)

    // Get owner
    console.log('📋 STEP 1: Check Owner')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const owner = await treasury.owner()
    console.log('Owner address:', owner)

    const relayWallet = process.env.RELAY_WALLET_PRIVATE_KEY
      ? new ethers.Wallet(process.env.RELAY_WALLET_PRIVATE_KEY).address
      : 'unknown'

    if (owner.toLowerCase() === relayWallet.toLowerCase()) {
      console.log('⚠️  WARNING: Owner is still relay wallet!')
      console.log('   Ownership transfer may have failed')
    } else {
      console.log('✅ Owner is USER wallet (not relay)')
    }
    console.log()

    // Get child info
    console.log('📋 STEP 2: Check Child Info')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const childName = await treasury.childName()
    const birthDate = await treasury.birthDate()
    const birthDateObj = new Date(Number(birthDate) * 1000)

    console.log('Child Name:', childName)
    console.log('Birth Date (timestamp):', birthDate.toString())
    console.log('Birth Date (readable):', birthDateObj.toLocaleDateString('pl-PL'))
    console.log('✅ Child info retrieved successfully')
    console.log()

    // Get balance
    console.log('📋 STEP 3: Check Balance')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const balance = await provider.getBalance(TREASURY_ADDRESS)
    const balanceInEth = ethers.formatEther(balance)

    console.log('ETH Balance:', balanceInEth, 'ETH')

    if (parseFloat(balanceInEth) === 0) {
      console.log('💡 Treasury is empty (no deposits yet)')
    } else {
      console.log('✅ Treasury has funds!')
    }
    console.log()

    // Calculate maturity date (birth date + 18 years)
    console.log('📋 STEP 4: Check Maturity Date')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const maturityDateObj = new Date(birthDateObj)
    maturityDateObj.setFullYear(maturityDateObj.getFullYear() + 18)
    const now = new Date()
    const isMatured = maturityDateObj <= now

    console.log('Maturity Date (calculated):', maturityDateObj.toLocaleDateString('pl-PL'))
    console.log('Is Matured:', isMatured ? '✅ YES' : '⏳ NO (locked)')

    if (!isMatured) {
      const yearsLeft = Math.ceil((maturityDateObj - now) / (1000 * 60 * 60 * 24 * 365))
      console.log('Years until maturity:', yearsLeft)
    }
    console.log()

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Treasury exists on blockchain')
    console.log('✅ Child:', childName)
    console.log('✅ Owner:', owner === relayWallet ? '⚠️ Relay Wallet' : '✅ User Wallet')
    console.log('✅ Balance:', balanceInEth, 'ETH')
    console.log('✅ Status:', isMatured ? 'Unlocked' : 'Locked until ' + maturityDateObj.getFullYear())
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Treasury verification COMPLETE!\n')

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

verifyTreasury().catch(console.error)
