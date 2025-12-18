/**
 * Konfiguracja wagmi dla Web3
 * Połączenie z walletami i blockchainami
 */

import { http, createConfig } from 'wagmi';
import { hardhat, baseSepolia, base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Które blockchainy wspieramy
export const supportedChains = [
  hardhat, // Local development
  baseSepolia, // Testnet
  // base, // Mainnet (odkomentuj gdy ready)
] as const;

// Konfiguracja wagmi
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    // MetaMask, Coinbase Wallet, etc (przez browser extension)
    injected({
      target: 'metaMask',
    }),
    // WalletConnect (dla mobile wallets)
    // walletConnect({
    //   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    // }),
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    // [base.id]: http('https://mainnet.base.org'),
  },
});
