/**
 * Adresy zdeployowanych kontraktów
 *
 * WAŻNE: Po każdym deploymencie zaktualizuj te adresy!
 */

// Hardhat local network (chain ID 31337)
export const CONTRACTS_LOCAL = {
  TreasuryFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Z naszego deployu
  chainId: 31337,
  rpcUrl: 'http://127.0.0.1:8545',
} as const;

// Base Sepolia testnet (gdy zdeployujemy później)
export const CONTRACTS_BASE_SEPOLIA = {
  TreasuryFactory: '0x0000000000000000000000000000000000000000', // TODO: zaktualizuj po deploymencie
  chainId: 84532,
  rpcUrl: 'https://sepolia.base.org',
} as const;

// Base Mainnet (produkcja - na przyszłość)
export const CONTRACTS_BASE_MAINNET = {
  TreasuryFactory: '0x0000000000000000000000000000000000000000', // TODO: zaktualizuj po deploymencie
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
} as const;

// Wybierz które adresy używasz (domyślnie local)
export const CONTRACTS =
  process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? CONTRACTS_BASE_SEPOLIA :
  process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? CONTRACTS_BASE_MAINNET :
  CONTRACTS_LOCAL;
