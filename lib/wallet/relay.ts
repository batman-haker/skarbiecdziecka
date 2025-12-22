/**
 * Relay Wallet Service
 *
 * This service manages the backend relay wallet that creates treasuries
 * on behalf of users. The relay wallet pays for gas fees.
 *
 * SECURITY:
 * - Private key stored in env vars (never exposed to client)
 * - Only used server-side (API routes)
 * - Rate limiting should be implemented in API routes
 */

import { ethers } from 'ethers'
import TreasuryFactoryABI from '@/lib/contracts/TreasuryFactory.json'

// Contract addresses (from deployment)
const TREASURY_FACTORY_ADDRESS = '0x6a8043CfB09C4BE4E94e98Ae0c3f1f09a7C15ceb'

// Base Sepolia RPC
const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'
const CHAIN_ID = 84532

/**
 * Get the relay wallet instance
 * This wallet is used to create treasuries and pay gas
 */
export function getRelayWallet(): ethers.Wallet {
  const privateKey = process.env.RELAY_WALLET_PRIVATE_KEY

  if (!privateKey) {
    throw new Error('RELAY_WALLET_PRIVATE_KEY not configured in environment variables')
  }

  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC, {
    chainId: CHAIN_ID,
    name: 'base-sepolia',
  })

  // Create wallet instance
  const wallet = new ethers.Wallet(privateKey, provider)

  return wallet
}

/**
 * Get TreasuryFactory contract instance with relay wallet as signer
 */
export function getTreasuryFactoryContract(): ethers.Contract {
  const wallet = getRelayWallet()

  const contract = new ethers.Contract(
    TREASURY_FACTORY_ADDRESS,
    TreasuryFactoryABI,
    wallet
  )

  return contract
}

/**
 * Create a new treasury using the relay wallet
 *
 * @param childName - Name of the child
 * @param childBirthDate - Unix timestamp of child's birth date
 * @param ownerAddress - Address of the treasury owner (parent)
 * @returns Treasury address and transaction hash
 */
export async function createTreasuryViaRelay(
  childName: string,
  childBirthDate: number,
  ownerAddress: string
): Promise<{ treasuryAddress: string; txHash: string }> {
  try {
    // Get contract instance
    const factoryContract = getTreasuryFactoryContract()
    const wallet = getRelayWallet()

    console.log('[Relay] Creating treasury...')
    console.log('[Relay] Child name:', childName)
    console.log('[Relay] Birth date:', new Date(childBirthDate * 1000).toISOString())
    console.log('[Relay] Owner:', ownerAddress)
    console.log('[Relay] Relay wallet:', wallet.address)

    // Check relay wallet balance
    const balance = await wallet.provider!.getBalance(wallet.address)
    const balanceInEth = ethers.formatEther(balance)
    console.log('[Relay] Wallet balance:', balanceInEth, 'ETH')

    if (parseFloat(balanceInEth) < 0.001) {
      throw new Error(
        `Relay wallet has insufficient balance: ${balanceInEth} ETH. Please fund the relay wallet.`
      )
    }

    // Call createTreasury on factory contract
    // The relay wallet will pay for gas
    const tx = await factoryContract.createTreasury(childName, childBirthDate, ownerAddress)

    console.log('[Relay] Transaction sent:', tx.hash)
    console.log('[Relay] Waiting for confirmation...')

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    console.log('[Relay] Transaction confirmed in block:', receipt.blockNumber)

    // Parse TreasuryCreated event to get the new treasury address
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factoryContract.interface.parseLog(log)
        return parsed?.name === 'TreasuryCreated'
      } catch {
        return false
      }
    })

    if (!event) {
      throw new Error('TreasuryCreated event not found in transaction receipt')
    }

    const parsedEvent = factoryContract.interface.parseLog(event)
    const treasuryAddress = parsedEvent?.args.treasury

    if (!treasuryAddress) {
      throw new Error('Treasury address not found in event')
    }

    console.log('[Relay] Treasury created at:', treasuryAddress)

    return {
      treasuryAddress,
      txHash: tx.hash,
    }
  } catch (error: any) {
    console.error('[Relay] Error creating treasury:', error)
    throw new Error(`Failed to create treasury: ${error.message}`)
  }
}

/**
 * Get relay wallet balance
 * Useful for monitoring and alerting
 */
export async function getRelayWalletBalance(): Promise<{
  address: string
  balance: string
  balanceInEth: string
}> {
  const wallet = getRelayWallet()
  const balance = await wallet.provider!.getBalance(wallet.address)
  const balanceInEth = ethers.formatEther(balance)

  return {
    address: wallet.address,
    balance: balance.toString(),
    balanceInEth,
  }
}

/**
 * Estimate gas cost for creating a treasury
 */
export async function estimateCreateTreasuryGas(
  childName: string,
  childBirthDate: number,
  ownerAddress: string
): Promise<{
  gasEstimate: bigint
  gasPriceInGwei: string
  estimatedCostInEth: string
}> {
  const factoryContract = getTreasuryFactoryContract()
  const wallet = getRelayWallet()

  // Estimate gas
  const gasEstimate = await factoryContract.createTreasury.estimateGas(
    childName,
    childBirthDate,
    ownerAddress
  )

  // Get current gas price
  const feeData = await wallet.provider!.getFeeData()
  const gasPrice = feeData.gasPrice || 0n

  // Calculate cost
  const estimatedCost = gasEstimate * gasPrice
  const estimatedCostInEth = ethers.formatEther(estimatedCost)
  const gasPriceInGwei = ethers.formatUnits(gasPrice, 'gwei')

  return {
    gasEstimate,
    gasPriceInGwei,
    estimatedCostInEth,
  }
}
