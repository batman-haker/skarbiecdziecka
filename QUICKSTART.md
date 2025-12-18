# 🚀 Quick Start - Skarbiec Dziecka

Get up and running in 5 minutes!

## ⚡ Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your values (can use placeholders for now)
```

## 🧪 Test Smart Contracts

```bash
# Run all tests
npm run test:contracts

# All tests should pass ✅
```

## 🔨 Compile Contracts

```bash
# Compile smart contracts
npm run compile

# This creates:
# - artifacts/ (compiled contracts)
# - typechain-types/ (TypeScript types)
```

## 🚢 Deploy to Testnet

### Step 1: Get Test ETH
1. Go to https://www.alchemy.com/faucets/base-sepolia
2. Connect wallet
3. Request testnet ETH

### Step 2: Configure
```bash
# .env.local
PRIVATE_KEY=your-test-wallet-private-key-here
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

### Step 3: Deploy
```bash
npm run deploy:testnet
```

Should see:
```
✅ TreasuryFactory deployed to: 0x...
✅ Test treasury created: 0x...
✅ Deployment complete!
```

### Step 4: Verify
Visit: `https://sepolia.basescan.org/address/YOUR_FACTORY_ADDRESS`

## 📱 Run Frontend (Week 3+)

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

## 📋 Useful Commands

```bash
# Smart Contracts
npm run compile          # Compile contracts
npm run test            # Run tests
npm run test:contracts  # Same as above
npx hardhat clean       # Clean artifacts
npx hardhat coverage    # Test coverage

# Deployment
npm run deploy:testnet  # Deploy to Base Sepolia
npm run deploy:mainnet  # Deploy to Base Mainnet (careful!)

# Frontend (Week 3+)
npm run dev             # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Lint code

# Hardhat Console
npx hardhat console --network baseSepolia
npx hardhat console --network base
```

## 🔧 Manual Contract Interaction

```bash
# Start console
npx hardhat console --network baseSepolia
```

```javascript
// In console:
const factory = await ethers.getContractAt("TreasuryFactory", "FACTORY_ADDRESS");

// Create treasury
const tx = await factory.createTreasury("Zosia Kowalska", 1704067200);
await tx.wait();

// Get treasuries
const treasuries = await factory.getUserTreasuries("YOUR_ADDRESS");
console.log(treasuries);

// Deposit to treasury
const treasury = await ethers.getContractAt("TreasuryVault", treasuries[0]);
await treasury.depositETH("Test", { value: ethers.parseEther("0.1") });

// Check balance
const balance = await treasury.getETHBalance();
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

## 📚 Documentation

- [SMART_CONTRACTS_GUIDE.md](./SMART_CONTRACTS_GUIDE.md) - Complete guide
- [README.md](./README.md) - Project overview
- Original spec in project root

## ✅ Week 1-2 Checklist

**Smart Contracts (Week 2):**
- [x] TreasuryVault.sol written
- [x] TreasuryFactory.sol written
- [x] Comprehensive tests
- [x] Deployment scripts
- [ ] Deploy to testnet
- [ ] Manual testing
- [ ] Verify on Basescan

**Next: Frontend (Week 3):**
- [ ] Landing page
- [ ] Auth flow (Supabase)
- [ ] Dashboard
- [ ] Create treasury form

## 🆘 Quick Troubleshooting

**Tests failing?**
```bash
rm -rf node_modules
npm install
npx hardhat clean
```

**Deployment failing?**
- Check PRIVATE_KEY in .env.local
- Check testnet ETH balance
- Try alternative RPC: https://sepolia.base.org

**Need help?**
- Read SMART_CONTRACTS_GUIDE.md
- Check Hardhat docs: https://hardhat.org
- Base network: https://docs.base.org

---

**Status:** ✅ Smart Contracts Complete (Week 2)

**Next:** Deploy to testnet and test manually, then start Frontend (Week 3)
