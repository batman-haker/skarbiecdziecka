# 🔐 Smart Contracts Guide - Skarbiec Dziecka

This guide explains how to work with the smart contracts in this project.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Testing](#testing)
4. [Deploying](#deploying)
5. [Interacting with Contracts](#interacting-with-contracts)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Skarbiec Dziecka platform uses two main smart contracts:

### 1. **TreasuryVault.sol**
The core contract that holds a child's crypto savings.

**Key Features:**
- ✅ Anyone can contribute (deposit) ETH or ERC20 tokens
- ✅ Only the owner (parent) can withdraw
- ✅ Tracks all contributions with contributor names
- ✅ Built with OpenZeppelin for security
- ✅ Gas optimized

**Main Functions:**
```solidity
// Deposit functions (anyone can call)
depositETH(string contributorName) payable
depositToken(address token, uint256 amount, string contributorName)

// Withdraw functions (only owner)
withdrawETH(uint256 amount)
withdrawToken(address token, uint256 amount)
withdrawAllETH()
withdrawAllTokens(address token)

// View functions
getETHBalance()
getTokenBalance(address token)
getContributionsCount()
getContribution(uint256 index)
getAllContributions()
```

### 2. **TreasuryFactory.sol**
Factory contract for easily creating new treasury vaults.

**Key Features:**
- ✅ Deploy new treasuries with one transaction
- ✅ Track all treasuries per user
- ✅ Get platform statistics (TVL, total treasuries)

**Main Functions:**
```solidity
// Create new treasury
createTreasury(string childName, uint256 birthDate) returns (address)

// View functions
getUserTreasuries(address user) returns (address[])
getUserTreasuriesCount(address user) returns (uint256)
getAllTreasuries() returns (address[])
getTreasuryDetails(address treasury)
getFactoryStats()
```

---

## Getting Started

### Prerequisites

Make sure you have:
- Node.js 18+ installed
- Git installed
- A text editor (VS Code recommended)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Fill in .env.local with your values
# (You can use placeholders for now)
```

### Environment Variables

For testing, you only need these:

```bash
# .env.local
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
PRIVATE_KEY=your-test-wallet-private-key-here
```

**⚠️ NEVER commit your .env.local file!** It's already in .gitignore.

---

## Testing

### Run All Tests

```bash
npm run test:contracts
```

This will run all tests using Hardhat's local network (no real ETH needed).

### Run Specific Test File

```bash
npx hardhat test test/TreasuryVault.test.ts
npx hardhat test test/TreasuryFactory.test.ts
```

### Run Tests with Gas Report

```bash
REPORT_GAS=true npm run test:contracts
```

This shows how much gas each function uses.

### Run Tests with Coverage

```bash
npx hardhat coverage
```

This shows which lines of code are tested.

### Expected Test Results

All tests should pass:
```
TreasuryVault
  ✓ Should deploy successfully
  ✓ Should accept ETH deposits
  ✓ Should allow owner to withdraw
  ... (40+ tests)

TreasuryFactory
  ✓ Should create new treasury
  ✓ Should track user treasuries
  ... (25+ tests)
```

---

## Deploying

### 1. Deploy to Local Hardhat Network

```bash
# Start local node
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.ts --network localhost
```

### 2. Deploy to Base Sepolia Testnet

#### Step 1: Get Testnet ETH

1. Go to [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Connect your wallet
3. Request testnet ETH (free)

#### Step 2: Configure Environment

```bash
# .env.local
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
PRIVATE_KEY=your-wallet-private-key
```

**How to get your private key:**
- MetaMask: Settings → Security & Privacy → Reveal Private Key
- ⚠️ ONLY use a TEST wallet! Never use your main wallet!

#### Step 3: Deploy

```bash
npm run deploy:testnet
```

You should see:
```
📦 Deploying TreasuryFactory...
✅ TreasuryFactory deployed to: 0x...
📦 Creating test treasury...
✅ Test treasury created: 0x...
💾 Saving deployment addresses...
✅ Deployment saved to: baseSepolia-latest.json
🔍 Verifying contracts on Basescan...
✅ TreasuryFactory verified on Basescan
```

#### Step 4: Verify on Basescan

After deployment, visit:
```
https://sepolia.basescan.org/address/YOUR_FACTORY_ADDRESS
```

You should see:
- ✅ Contract verified (green checkmark)
- Read/Write tabs available
- Source code visible

### 3. Deploy to Base Mainnet (Production)

⚠️ **ONLY DO THIS AFTER THOROUGH TESTING ON TESTNET!**

```bash
# Update .env.local for mainnet
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CHAIN_ID=8453
PRIVATE_KEY=your-production-wallet-private-key

# Deploy (uses REAL ETH!)
npm run deploy:mainnet
```

**Pre-deployment Checklist:**
- [ ] All tests passing
- [ ] Deployed and tested on testnet
- [ ] Contracts audited (recommended)
- [ ] Legal setup complete
- [ ] Insurance considered
- [ ] Backup plan ready

---

## Interacting with Contracts

### Using Hardhat Console

```bash
npx hardhat console --network baseSepolia
```

Then in the console:

```javascript
// Get contract instances
const factory = await ethers.getContractAt("TreasuryFactory", "FACTORY_ADDRESS");

// Create a treasury
const tx = await factory.createTreasury("Zosia Kowalska", 1704067200);
await tx.wait();

// Get user's treasuries
const treasuries = await factory.getUserTreasuries("YOUR_ADDRESS");
console.log(treasuries);

// Interact with a treasury
const treasury = await ethers.getContractAt("TreasuryVault", treasuries[0]);

// Check balance
const balance = await treasury.getETHBalance();
console.log("Balance:", ethers.formatEther(balance), "ETH");

// Deposit (from another account)
const [deployer, contributor] = await ethers.getSigners();
await treasury.connect(contributor).depositETH("Babcia Anna", {
  value: ethers.parseEther("0.1")
});

// Get contributions
const count = await treasury.getContributionsCount();
console.log("Total contributions:", count.toString());
```

### Using TypeScript in Frontend

Example (will be used in Week 3-4):

```typescript
import { ethers } from 'ethers';
import TreasuryFactoryABI from './artifacts/contracts/TreasuryFactory.sol/TreasuryFactory.json';

// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const factory = new ethers.Contract(FACTORY_ADDRESS, TreasuryFactoryABI.abi, signer);

// Create treasury
const tx = await factory.createTreasury("Zosia Kowalska", birthDate);
await tx.wait();

// Deposit to treasury
const treasury = new ethers.Contract(treasuryAddress, TreasuryVaultABI.abi, signer);
await treasury.depositETH("Wujek Tomasz", { value: ethers.parseEther("1.0") });
```

---

## Security Considerations

### ✅ Built-in Security Features

1. **OpenZeppelin Contracts**
   - Battle-tested, audited code
   - Ownable (access control)
   - ReentrancyGuard (prevents attacks)
   - SafeERC20 (safe token transfers)

2. **Access Control**
   - Only owner can withdraw
   - Anyone can contribute
   - Clear ownership model

3. **Input Validation**
   - Amount > 0 checks
   - Non-empty strings
   - Valid dates

### ⚠️ Potential Risks

1. **Private Key Compromise**
   - If parent loses private key → funds lost forever
   - **Mitigation:** Use hardware wallet, implement social recovery

2. **Smart Contract Bugs**
   - Despite testing, bugs can exist
   - **Mitigation:** Start with small amounts, get audit, bug bounty

3. **Front-running**
   - On public blockchain, transactions are visible before confirmation
   - **Mitigation:** Not a major issue for this use case (not trading)

4. **Gas Price Volatility**
   - Ethereum gas can be expensive
   - **Mitigation:** Using Base L2 (much cheaper than Ethereum mainnet)

### 🛡️ Best Practices

1. **For Development:**
   - Always test on testnet first
   - Never use real funds for testing
   - Use separate test wallet
   - Keep private keys secure

2. **For Production:**
   - Consider smart contract audit ($5k-20k)
   - Start with small limits (e.g., max 1000 PLN per treasury)
   - Implement monitoring/alerts
   - Have incident response plan
   - Consider insurance (Nexus Mutual)

3. **For Users:**
   - Educate about private key security
   - Recommend hardware wallets
   - Provide backup/recovery guidance
   - Clear disclaimers about risks

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds" error

**Problem:** Not enough ETH to pay gas fees

**Solution:**
```bash
# Check balance
npx hardhat console --network baseSepolia
> const [signer] = await ethers.getSigners();
> const balance = await ethers.provider.getBalance(signer.address);
> console.log(ethers.formatEther(balance), "ETH");

# Get more testnet ETH from faucet
```

#### 2. "Nonce too high" error

**Problem:** Transaction stuck or nonce mismatch

**Solution:**
- Clear transaction in MetaMask
- Or reset account: Settings → Advanced → Reset Account

#### 3. Tests failing

**Problem:** Dependencies not installed or outdated

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Hardhat cache
npx hardhat clean
```

#### 4. "Contract not verified" on Basescan

**Problem:** Verification failed during deployment

**Solution:**
```bash
# Manual verification
npx hardhat verify --network baseSepolia FACTORY_ADDRESS

# If still fails, check:
# - API key correct in hardhat.config.ts
# - Network configured correctly
# - Compiler version matches
```

#### 5. Can't connect to Base Sepolia

**Problem:** RPC URL not working

**Solution:**
- Try alternative RPC: `https://sepolia.base.org`
- Or get Alchemy key: https://www.alchemy.com/
- Update .env.local with: `https://base-sepolia.g.alchemy.com/v2/YOUR-KEY`

---

## Next Steps

Now that smart contracts are ready:

1. **Week 2 Checklist:**
   - [x] Contracts written
   - [x] Tests comprehensive
   - [x] Deployment script ready
   - [ ] Deploy to testnet
   - [ ] Verify on Basescan
   - [ ] Test deposits/withdrawals manually

2. **Week 3: Frontend Development**
   - Landing page
   - Auth flow
   - Dashboard
   - Treasury creation form

3. **Week 4: Integration**
   - Connect frontend to contracts
   - Ramp Network payment
   - End-to-end flow

---

## Resources

### Documentation
- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Base Network Docs](https://docs.base.org/)
- [Ethers.js Docs](https://docs.ethers.org/)

### Tools
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [Basescan (Testnet)](https://sepolia.basescan.org/)
- [Basescan (Mainnet)](https://basescan.org/)
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity IDE

### Learning
- [Solidity by Example](https://solidity-by-example.org/)
- [Ethereum.org Dev Docs](https://ethereum.org/en/developers/docs/)
- [CryptoZombies](https://cryptozombies.io/) - Learn Solidity

---

**Questions?** Check the main README.md or create an issue.

**Good luck with your deployment! 🚀**
