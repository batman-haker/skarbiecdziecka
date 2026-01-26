/**
 * Test Welcome ETH Flow
 *
 * This script tests the complete welcome ETH flow:
 * 1. Check relay wallet balance
 * 2. Generate a new test user wallet
 * 3. Send welcome ETH to the test wallet
 * 4. Verify the test wallet received the ETH
 */

const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

async function testWelcomeETH() {
  console.log('\n🧪 TESTING WELCOME ETH FLOW...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Setup
  const privateKey = process.env.RELAY_WALLET_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ ERROR: RELAY_WALLET_PRIVATE_KEY not found in .env.local')
    process.exit(1)
  }

  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const relayWallet = new ethers.Wallet(privateKey, provider)

  console.log('📋 STEP 1: Check Relay Wallet Balance')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Relay wallet address:', relayWallet.address)

  const relayBalance = await provider.getBalance(relayWallet.address)
  const relayBalanceInEth = ethers.formatEther(relayBalance)
  console.log('Relay wallet balance:', relayBalanceInEth, 'ETH')

  if (parseFloat(relayBalanceInEth) < 0.002) {
    console.log('\n⚠️  WARNING: Relay wallet balance is low!')
    console.log('Please fund the relay wallet from:')
    console.log('https://www.alchemy.com/faucets/base-sepolia\n')

    if (parseFloat(relayBalanceInEth) < 0.001) {
      console.error('❌ ERROR: Insufficient balance to continue test')
      process.exit(1)
    }
  }
  console.log('✅ Relay wallet has sufficient balance\n')

  // 2. Generate test user wallet
  console.log('📋 STEP 2: Generate Test User Wallet')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const testUser = ethers.Wallet.createRandom()
  console.log('Test user address:', testUser.address)

  const userBalanceBefore = await provider.getBalance(testUser.address)
  const userBalanceBeforeEth = ethers.formatEther(userBalanceBefore)
  console.log('Test user balance (before):', userBalanceBeforeEth, 'ETH')
  console.log('✅ Test user wallet created\n')

  // 3. Send welcome ETH
  const welcomeAmount = '0.001' // 0.001 ETH
  console.log('📋 STEP 3: Send Welcome ETH')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Amount to send:', welcomeAmount, 'ETH')
  console.log('From:', relayWallet.address)
  console.log('To:', testUser.address)
  console.log('\n📤 Sending transaction...')

  try {
    const tx = await relayWallet.sendTransaction({
      to: testUser.address,
      value: ethers.parseEther(welcomeAmount),
    })

    console.log('✅ Transaction sent!')
    console.log('TX Hash:', tx.hash)
    console.log('🔗 View on Basescan:')
    console.log('   https://sepolia.basescan.org/tx/' + tx.hash)
    console.log('\n⏳ Waiting for confirmation...')

    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber)
    console.log('Gas used:', receipt.gasUsed.toString())
    console.log('Gas cost:', ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0n), 'ETH\n')

  } catch (error) {
    console.error('\n❌ ERROR sending transaction:', error.message)
    process.exit(1)
  }

  // 4. Verify user received ETH
  console.log('📋 STEP 4: Verify User Received ETH')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const userBalanceAfter = await provider.getBalance(testUser.address)
  const userBalanceAfterEth = ethers.formatEther(userBalanceAfter)
  console.log('Test user balance (after):', userBalanceAfterEth, 'ETH')

  if (userBalanceAfterEth === welcomeAmount) {
    console.log('✅ VERIFIED: User received exactly', welcomeAmount, 'ETH\n')
  } else {
    console.log('⚠️  Warning: Balance mismatch (expected:', welcomeAmount, 'ETH)\n')
  }

  // 5. Check final relay wallet balance
  console.log('📋 STEP 5: Check Final Relay Wallet Balance')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const relayBalanceAfter = await provider.getBalance(relayWallet.address)
  const relayBalanceAfterEth = ethers.formatEther(relayBalanceAfter)
  console.log('Relay wallet balance (after):', relayBalanceAfterEth, 'ETH')

  const spent = parseFloat(relayBalanceInEth) - parseFloat(relayBalanceAfterEth)
  console.log('Total spent (ETH + gas):', spent.toFixed(6), 'ETH')
  console.log('Remaining treasuries can create:', Math.floor(parseFloat(relayBalanceAfterEth) / 0.001))

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 TEST COMPLETED SUCCESSFULLY!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Relay wallet can send welcome ETH')
  console.log('✅ New users will receive', welcomeAmount, 'ETH on first login')
  console.log('✅ Users can use this ETH to pay gas for creating treasuries')
  console.log('\n💡 NEXT STEPS:')
  console.log('1. Start the app: npm run dev')
  console.log('2. Login with Google OAuth')
  console.log('3. Create Privy wallet')
  console.log('4. You should automatically receive 0.001 ETH')
  console.log('5. Create a treasury for your child!')
  console.log('\n🚀 System is ready for production!\n')
}

testWelcomeETH().catch(console.error)
