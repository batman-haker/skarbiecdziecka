/**
 * Check Relay Wallet Balance
 *
 * This script checks the balance of the relay wallet on Base Sepolia testnet.
 * Use it to monitor when the wallet needs to be refunded.
 */

const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

async function checkBalance() {
  console.log('\n🔍 CHECKING RELAY WALLET BALANCE...\n')

  // Check if private key is set
  const privateKey = process.env.RELAY_WALLET_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ ERROR: RELAY_WALLET_PRIVATE_KEY not found in .env.local')
    process.exit(1)
  }

  // Connect to Base Sepolia
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  // Create wallet instance
  const wallet = new ethers.Wallet(privateKey, provider)

  console.log('📍 Wallet Address:', wallet.address)
  console.log('🌐 Network: Base Sepolia (testnet)')
  console.log('')

  try {
    // Get balance
    const balance = await provider.getBalance(wallet.address)
    const balanceInEth = ethers.formatEther(balance)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💰 BALANCE:', balanceInEth, 'ETH')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Status check
    const balanceNum = parseFloat(balanceInEth)

    if (balanceNum === 0) {
      console.log('⚠️  STATUS: EMPTY - Wallet needs funding!')
      console.log('📝 NEXT STEP: Fund from faucet:')
      console.log('   https://www.alchemy.com/faucets/base-sepolia')
      console.log('')
    } else if (balanceNum < 0.01) {
      console.log('⚠️  STATUS: LOW - Wallet needs refunding soon!')
      console.log('💡 Can create ~', Math.floor(balanceNum / 0.001), 'more treasuries')
      console.log('')
    } else {
      console.log('✅ STATUS: GOOD - Wallet has sufficient balance')
      console.log('💡 Can create ~', Math.floor(balanceNum / 0.001), 'treasuries')
      console.log('')
    }

    // Show faucet link
    console.log('📌 FAUCET LINKS:')
    console.log('   • Alchemy: https://www.alchemy.com/faucets/base-sepolia')
    console.log('   • Coinbase: https://portal.cdp.coinbase.com/products/faucet')
    console.log('')

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    process.exit(1)
  }
}

checkBalance().catch(console.error)
