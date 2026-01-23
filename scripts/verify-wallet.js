/**
 * Verify wallet address from private key
 */
const { ethers } = require('ethers')

const privateKey = '9e4dad88efc205763bb3cf0e5def623cf049d33f89d2d365af0b2909183a19ad'
const expectedAddress = '0xb438739bA33f0f71f4a5f954A4777BbeC8a19788'

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey)

console.log('==========================================')
console.log('WALLET VERIFICATION')
console.log('==========================================')
console.log('Private Key:', privateKey)
console.log('Derived Address:', wallet.address)
console.log('Expected Address:', expectedAddress)
console.log('Match:', wallet.address.toLowerCase() === expectedAddress.toLowerCase() ? '✅ YES' : '❌ NO')
console.log('==========================================')
