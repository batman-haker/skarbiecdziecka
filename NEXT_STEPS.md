# ✅ Next Steps - Your Action Items

Follow these steps in order to get your smart contracts deployed and tested.

---

## 🚀 Phase 1: Local Setup & Testing (15 minutes)

### Step 1: Install Dependencies
```bash
cd C:\skarbiecdziecka
npm install
```

**Expected:** No errors, packages installed successfully

**Troubleshooting:**
- If npm not found: Install Node.js from https://nodejs.org/
- If errors: Try `npm install --legacy-peer-deps`

---

### Step 2: Compile Contracts
```bash
npm run compile
```

**Expected:**
```
Compiled 2 Solidity files successfully
```

**What this does:**
- Compiles TreasuryVault.sol and TreasuryFactory.sol
- Creates `artifacts/` directory with compiled contracts
- Generates TypeScript types in `typechain-types/`

---

### Step 3: Run Tests
```bash
npm run test:contracts
```

**Expected:**
```
  TreasuryVault
    ✓ Should deploy successfully
    ✓ Should accept ETH deposits
    ... (40+ tests)

  TreasuryFactory
    ✓ Should create new treasury
    ... (25+ tests)

  65 passing
```

**If tests fail:**
```bash
# Clean and retry
npx hardhat clean
npm run compile
npm run test:contracts
```

---

## 🌐 Phase 2: Deploy to Testnet (30 minutes)

### Step 1: Get Test Wallet Ready

**Option A: Create New Test Wallet (Recommended)**
1. Install MetaMask: https://metamask.io/
2. Create new account
3. Export private key: Settings → Security & Privacy → Reveal Private Key
4. ⚠️ **IMPORTANT:** This is a TEST wallet only! Never use for real funds!

**Option B: Use Existing Test Wallet**
- Use a wallet you already have for testing
- Make sure it has NO real funds
- Export private key from wallet

---

### Step 2: Get Testnet ETH (FREE)
1. Go to: https://www.alchemy.com/faucets/base-sepolia
2. Connect your test wallet (MetaMask)
3. Click "Send Me ETH"
4. Wait ~30 seconds for confirmation

**Alternative Faucets:**
- https://www.coinbase.com/faucets/base-sepolia-faucet
- https://faucet.quicknode.com/base/sepolia

**How much do you need?** 0.01 ETH is plenty (it's free!)

---

### Step 3: Configure Environment
```bash
# Copy template
cp .env.example .env.local

# Open .env.local in your editor
# Add your test wallet private key:
```

**Edit `.env.local`:**
```bash
# Minimum required for testnet:
PRIVATE_KEY=your-test-wallet-private-key-here
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
```

**Where to find private key:**
- MetaMask: Settings → Security & Privacy → Reveal Private Key
- Other wallets: Check wallet settings/security section

⚠️ **NEVER commit .env.local to git!** (It's already in .gitignore)

---

### Step 4: Deploy Contracts
```bash
npm run deploy:testnet
```

**Expected output:**
```
============================================================
  SKARBIEC DZIECKA - SMART CONTRACT DEPLOYMENT
============================================================

Network: baseSepolia
Deployer: 0xYourAddress
Balance: 0.01 ETH

📦 Deploying TreasuryFactory...
✅ TreasuryFactory deployed to: 0xFactoryAddress

📦 Creating test treasury...
✅ Test treasury created: 0xTreasuryAddress

💾 Saving deployment addresses...
✅ Deployment saved to: baseSepolia-latest.json

🔍 Verifying contracts on Basescan...
✅ TreasuryFactory verified on Basescan

============================================================
  DEPLOYMENT SUMMARY
============================================================
Network:           baseSepolia
Factory Address:   0xFactoryAddress
Test Treasury:     0xTreasuryAddress

Basescan:          https://sepolia.basescan.org/address/0xFactoryAddress

============================================================

✅ Deployment complete!
```

**Save the Factory Address!** You'll need it for the frontend.

---

### Step 5: Verify on Basescan
1. Click the Basescan link from the output
2. Should see:
   - ✅ Green checkmark (verified)
   - "Read Contract" tab
   - "Write Contract" tab
   - Source code visible

---

## 🧪 Phase 3: Manual Testing (15 minutes)

### Test Creating a Treasury

```bash
# Open Hardhat console
npx hardhat console --network baseSepolia
```

In the console:
```javascript
// Get factory
const factoryAddress = "YOUR_FACTORY_ADDRESS_FROM_DEPLOY";
const factory = await ethers.getContractAt("TreasuryFactory", factoryAddress);

// Create treasury
const childName = "Zosia Testowa";
const birthDate = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 1 year ago
const tx = await factory.createTreasury(childName, birthDate);
await tx.wait();

console.log("✅ Treasury created!");

// Get your treasuries
const [deployer] = await ethers.getSigners();
const treasuries = await factory.getUserTreasuries(deployer.address);
console.log("Your treasuries:", treasuries);

// Connect to first treasury
const treasuryAddress = treasuries[0];
const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

// Check child name
const name = await treasury.childName();
console.log("Child name:", name);

// Check balance (should be 0)
const balance = await treasury.getETHBalance();
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

---

### Test Depositing ETH

```javascript
// Still in console...

// Deposit 0.001 ETH
const depositTx = await treasury.depositETH("Test Contributor", {
  value: ethers.parseEther("0.001")
});
await depositTx.wait();

console.log("✅ Deposit successful!");

// Check new balance
const newBalance = await treasury.getETHBalance();
console.log("New balance:", ethers.formatEther(newBalance), "ETH");

// Check contributions
const count = await treasury.getContributionsCount();
console.log("Total contributions:", count.toString());

// Get first contribution details
const contribution = await treasury.getContribution(0);
console.log("Contribution details:", {
  contributor: contribution.contributor,
  amount: ethers.formatEther(contribution.amount),
  name: contribution.contributorName
});
```

---

### Test Withdrawing (Owner Only)

```javascript
// Try to withdraw (you're the owner)
const withdrawAmount = ethers.parseEther("0.0005"); // Half
const withdrawTx = await treasury.withdrawETH(withdrawAmount);
await withdrawTx.wait();

console.log("✅ Withdrawal successful!");

// Check balance after withdrawal
const finalBalance = await treasury.getETHBalance();
console.log("Final balance:", ethers.formatEther(finalBalance), "ETH");
```

---

### Test on Basescan (GUI)

1. Go to your treasury on Basescan:
   ```
   https://sepolia.basescan.org/address/YOUR_TREASURY_ADDRESS
   ```

2. Click "Contract" → "Read Contract"
   - Try `childName()` - should show the child's name
   - Try `getETHBalance()` - should show current balance
   - Try `getContributionsCount()` - should show number of contributions

3. Click "Write Contract"
   - Connect wallet (MetaMask)
   - Try `depositETH`:
     - contributorName: "Test from Basescan"
     - payableAmount: 0.001 (ETH)
     - Click "Write"
     - Confirm in MetaMask
   - Should succeed! ✅

---

## ✅ Completion Checklist

After completing all phases above, check off:

### Local Development
- [ ] Dependencies installed (`npm install`)
- [ ] Contracts compiled (`npm run compile`)
- [ ] All tests passing (`npm run test:contracts`)

### Testnet Deployment
- [ ] Test wallet created/funded
- [ ] `.env.local` configured with private key
- [ ] Contracts deployed to Base Sepolia
- [ ] Factory address saved
- [ ] Contracts verified on Basescan

### Manual Testing
- [ ] Created treasury via Hardhat console
- [ ] Deposited ETH successfully
- [ ] Withdrew ETH successfully (as owner)
- [ ] Tested on Basescan GUI
- [ ] All functions working as expected

### Documentation Review
- [ ] Read README.md
- [ ] Skimmed SMART_CONTRACTS_GUIDE.md
- [ ] Bookmarked QUICKSTART.md for reference

---

## 🎉 When You're Done

**Congratulations!** 🎊 Your smart contracts are:
- ✅ Written
- ✅ Tested (65+ tests)
- ✅ Deployed to testnet
- ✅ Verified on Basescan
- ✅ Manually tested and working

**You've completed Week 2 of the 6-week plan!**

---

## 📅 What's Next?

### Week 3: Frontend Development
- Setup Supabase (database + auth)
- Create landing page
- Build dashboard layout
- Treasury creation form
- Basic routing

**Want to start Week 3?** Let me know and I can help with:
- Supabase setup
- Database migrations (SQL)
- Auth flow implementation
- Component development
- API routes

---

## 🆘 Troubleshooting

### "Error: insufficient funds"
**Problem:** Not enough ETH in wallet for gas
**Solution:** Get more from faucet or check you're using correct wallet

### "Error: nonce too high"
**Problem:** Transaction stuck or wallet state mismatch
**Solution:** MetaMask → Settings → Advanced → Reset Account

### "Cannot find module '@nomicfoundation/hardhat-toolbox'"
**Problem:** Dependencies not installed
**Solution:** `npm install`

### "Invalid private key"
**Problem:** Private key format wrong or missing
**Solution:**
- Should start with `0x`
- Should be 64 characters (after 0x)
- No spaces or special characters
- Example: `0x1234567890abcdef...`

### Tests failing
**Problem:** Compilation issues or outdated cache
**Solution:**
```bash
npx hardhat clean
npm run compile
npm run test:contracts
```

### Can't verify on Basescan
**Problem:** Verification script failed
**Solution:**
```bash
# Manual verification
npx hardhat verify --network baseSepolia YOUR_FACTORY_ADDRESS
```

---

## 📞 Need Help?

1. **Read docs:**
   - [SMART_CONTRACTS_GUIDE.md](./SMART_CONTRACTS_GUIDE.md)
   - [QUICKSTART.md](./QUICKSTART.md)

2. **Check resources:**
   - Hardhat: https://hardhat.org/docs
   - Base: https://docs.base.org
   - OpenZeppelin: https://docs.openzeppelin.com

3. **Ask for help:**
   - Let me know what error you're getting
   - Share the command and full error message
   - I can help debug!

---

**Ready to start? Let's go! 🚀**

First command: `npm install`
