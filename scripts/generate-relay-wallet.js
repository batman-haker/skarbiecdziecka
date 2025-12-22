/**
 * Generate Relay Wallet
 *
 * This script generates a new Ethereum wallet that will be used
 * as the backend relay wallet for creating treasuries.
 *
 * SECURITY:
 * - Keep the private key SECRET
 * - Only add to .env.local (never commit to git)
 * - This wallet should only have enough ETH for gas
 */

const { ethers } = require('ethers')

async function generateRelayWallet() {
  console.log('\n🔐 GENERATING RELAY WALLET...\n')

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom()

  console.log('✅ Wallet Generated Successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📍 WALLET ADDRESS:')
  console.log(wallet.address)
  console.log('')
  console.log('🔑 PRIVATE KEY (KEEP SECRET!):')
  console.log(wallet.privateKey)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📋 NEXT STEPS:\n')
  console.log('1. ✅ Wallet generated')
  console.log('2. ⏸️  Fund wallet from Base Sepolia faucet:')
  console.log('   - Visit: https://www.alchemy.com/faucets/base-sepolia')
  console.log('   - Enter address:', wallet.address)
  console.log('   - Request 0.1 ETH')
  console.log('')
  console.log('3. ⏸️  Add to .env.local:')
  console.log('   RELAY_WALLET_PRIVATE_KEY=' + wallet.privateKey)
  console.log('')
  console.log('4. ⏸️  Verify balance:')
  console.log('   npm run check-relay-balance')
  console.log('')
  console.log('⚠️  WARNING: NEVER commit .env.local to git!')
  console.log('⚠️  This wallet will pay gas for all treasury creations!\n')
}

generateRelayWallet().catch(console.error)
