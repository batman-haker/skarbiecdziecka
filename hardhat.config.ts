import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Hardhat Configuration for Skarbiec Dziecka Smart Contracts
 *
 * This config supports:
 * - Local development (Hardhat Network)
 * - Base Sepolia Testnet (for testing)
 * - Base Mainnet (for production)
 */

const config: HardhatUserConfig = {
  // Solidity compiler version and settings
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for average usage
      },
    },
  },

  // Networks configuration
  networks: {
    // Hardhat local network (default for testing)
    hardhat: {
      chainId: 31337,
      // Fork Base Sepolia for testing (optional)
      // forking: {
      //   url: process.env.NEXT_PUBLIC_BASE_RPC_URL || "",
      //   enabled: false,
      // },
    },

    // Base Sepolia Testnet
    baseSepolia: {
      url: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },

    // Base Mainnet (Production)
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },

  // Path configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
