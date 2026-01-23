/**
 * Check user wallet balance
 */
const { ethers } = require('ethers')

const userAddress = '0x35531749242006A572aaF8589b0a2bD81C896808'
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org'

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC)

  console.log('==========================================')
  console.log('USER WALLET BALANCE CHECK')
  console.log('==========================================')
  console.log('Address:', userAddress)

  const balance = await provider.getBalance(userAddress)
  const balanceInEth = ethers.formatEther(balance)

  console.log('Balance:', balanceInEth, 'ETH')

  if (parseFloat(balanceInEth) >= 0.001) {
    console.log('Status: ✅ HAS WELCOME ETH')
  } else if (parseFloat(balanceInEth) > 0) {
    console.log('Status: ⚠️ HAS SOME ETH (not from welcome)')
  } else {
    console.log('Status: ❌ NO ETH - Welcome ETH not sent!')
  }
  console.log('==========================================')
}

checkBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
