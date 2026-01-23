/**
 * Manually send welcome ETH to user
 */
const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

const userAddress = '0x35531749242006A572aaF8589b0a2bD81C896808'
const amount = '0.001' // ETH

async function sendWelcomeETH() {
  console.log('\n🎁 SENDING WELCOME ETH...\n')

  const privateKey = process.env.RELAY_WALLET_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ ERROR: RELAY_WALLET_PRIVATE_KEY not found')
    process.exit(1)
  }

  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)

  console.log('📍 FROM (Relay Wallet):', wallet.address)
  console.log('📍 TO (User Wallet):', userAddress)
  console.log('💰 Amount:', amount, 'ETH\n')

  try {
    // Check relay wallet balance
    const relayBalance = await provider.getBalance(wallet.address)
    const relayBalanceInEth = ethers.formatEther(relayBalance)
    console.log('🔍 Relay wallet balance:', relayBalanceInEth, 'ETH')

    if (parseFloat(relayBalanceInEth) < parseFloat(amount)) {
      console.error('❌ ERROR: Insufficient relay wallet balance!')
      process.exit(1)
    }

    // Check user balance
    const userBalance = await provider.getBalance(userAddress)
    const userBalanceInEth = ethers.formatEther(userBalance)
    console.log('🔍 User current balance:', userBalanceInEth, 'ETH\n')

    // Send transaction
    console.log('📤 Sending transaction...')
    const tx = await wallet.sendTransaction({
      to: userAddress,
      value: ethers.parseEther(amount),
    })

    console.log('✅ Transaction sent!')
    console.log('📝 TX Hash:', tx.hash)
    console.log('🔗 View on Block Explorer:')
    console.log('   https://sepolia.basescan.org/tx/' + tx.hash)
    console.log('\n⏳ Waiting for confirmation...\n')

    // Wait for confirmation
    const receipt = await tx.wait()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 SUCCESS!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Welcome ETH sent successfully!')
    console.log('📦 Block:', receipt.blockNumber)
    console.log('💰 User now has:', amount, 'ETH')
    console.log('\n🚀 User can now create treasuries!\n')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

sendWelcomeETH().catch(console.error)
