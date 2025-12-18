# 🗺️ Implementation Roadmap

> Plan wdrożenia Skarbiec Dziecka od MVP do Production

---

## 📊 Current Status

✅ **Phase 1 (MVP Foundation)** - 70% Complete
- [x] Smart contracts (TreasuryVault + Factory)
- [x] 56 tests passing (100% coverage)
- [x] Deployed to Base Sepolia testnet
- [x] Next.js 14 frontend with Cyberpunk UI
- [x] MetaMask integration (Wagmi v2)
- [x] Basic treasury creation flow
- [ ] Google Auth (Supabase)
- [ ] Database schema implementation
- [ ] Public treasury viewing (no wallet required)

---

## 🎯 Phase 2: Authentication & Database (Week 2-3)

**Goal**: Users mogą się logować przez Google i zarządzać swoimi skarbcami

### Tasks:

#### 2.1 Setup Supabase
- [ ] Create Supabase project
- [ ] Enable Google OAuth provider
- [ ] Configure redirect URLs
- [ ] Get API keys → `.env.local`

#### 2.2 Database Schema
- [ ] Create `users` table
- [ ] Create `treasuries` table
- [ ] Create `contributions` table
- [ ] Create `withdrawals` table
- [ ] Create `notifications` table
- [ ] Setup Row Level Security (RLS) policies

**SQL Script**: See `docs/ARCHITECTURE.md` → Database Schema

#### 2.3 Frontend - Auth Integration
```typescript
// Files to create/modify:
- app/auth/login/page.tsx          // Login page
- app/auth/callback/route.ts       // OAuth callback
- lib/supabase/client.ts           // Supabase client
- lib/supabase/server.ts           // Server-side client
- components/auth/LoginButton.tsx  // Google login button
- middleware.ts                    // Auth middleware
```

#### 2.4 User Dashboard
- [ ] `/dashboard` - List user's treasuries
- [ ] Create new treasury (save to DB + deploy contract)
- [ ] Link existing treasury (import by address)

**Deliverable**: User może się zalogować przez Google i zobaczyć swoje skarbce

**Time**: ~1 week

---

## 💳 Phase 3: Stripe Integration (Week 4-5)

**Goal**: Babcie mogą wpłacać kartą/BLIK bez crypto

### Tasks:

#### 3.1 Setup Stripe
- [ ] Create Stripe account (use test mode first)
- [ ] Enable BLIK payment method (Poland)
- [ ] Get API keys → `.env.local`
- [ ] Configure webhook endpoint

#### 3.2 Backend Wallet Setup
```typescript
// Critical: Backend wallet for relaying Stripe payments

- [ ] Generate new wallet (ethers.Wallet.createRandom())
- [ ] Fund with 0.1 ETH (for gas)
- [ ] Store private key in AWS Secrets Manager / Vercel Env
- [ ] Create treasury service in backend
```

**Security checklist**:
- [ ] Rate limiting (max 1 tx/min per treasury)
- [ ] Max amount limit (1000 PLN per transaction)
- [ ] Monitoring & alerts (Sentry)
- [ ] Wallet balance alerts (< 0.01 ETH)

#### 3.3 Payment Flow - Frontend
```typescript
// Files to create:
- app/treasury/[address]/deposit/page.tsx  // Deposit page
- components/treasury/DepositForm.tsx      // Stripe checkout
- components/treasury/PaymentMethods.tsx   // MetaMask vs Stripe choice
```

#### 3.4 Payment Flow - Backend
```typescript
// Files to create:
- app/api/stripe/checkout/route.ts         // Create checkout session
- app/api/stripe/webhook/route.ts          // Handle payment success
- lib/treasury/relay.ts                    // Relay service
- lib/exchange/buyETH.ts                   // Convert PLN → ETH
```

**Flow**:
1. User clicks "Wpłać kartą" → Create Stripe session
2. Stripe redirects → User pays 100 PLN
3. Stripe webhook → Backend receives notification
4. Backend buys ETH (via exchange or Ramp Business API)
5. Backend calls `treasuryContract.depositETH(contributor, amount)`
6. Send email notification to owner

#### 3.5 Email Notifications
- [ ] Setup Resend or SendGrid
- [ ] Email template: "Nowa wpłata!"
- [ ] Email template: "Wpłata kartą potwierdzona"

**Deliverable**: Babcia może wpłacić 100 PLN kartą, ETH trafia do skarbca, Heniek dostaje email

**Time**: ~1.5 weeks

---

## 🎨 Phase 4: UX Polish (Week 6)

**Goal**: Aplikacja wygląda profesjonalnie i działa na mobile

### Tasks:

#### 4.1 Public Treasury Pages (No Login)
- [ ] `/treasury/[address]` - Anyone can view
- [ ] Show balance, contributions, QR code
- [ ] No MetaMask required to view
- [ ] Share link on WhatsApp/Facebook

#### 4.2 QR Codes
- [ ] Generate QR code z adresem skarbca
- [ ] Print-friendly page (A4 format)
- [ ] "Zeskanuj żeby wpłacić" instruction

#### 4.3 Mobile Responsive
- [ ] Test on iPhone/Android
- [ ] MetaMask mobile wallet integration
- [ ] Touch-friendly UI (larger buttons)

#### 4.4 Contribution History
- [ ] Timeline view of all contributions
- [ ] Filter by contributor name
- [ ] Export to CSV

#### 4.5 Dashboard dla Owners
- [ ] Total balance across all treasuries
- [ ] Recent contributions
- [ ] Quick withdraw button
- [ ] Analytics (contribution trends)

**Deliverable**: Aplikacja wygląda jak produkt, działa na mobile

**Time**: ~1 week

---

## 🚀 Phase 5: Ramp Network Integration (Week 7)

**Goal**: Advanced users mogą wpłacać przez Ramp (non-custodial)

### Tasks:

#### 5.1 Ramp Network Setup
- [ ] Create Ramp account
- [ ] Get API key
- [ ] Test with demo mode
- [ ] Configure webhook

#### 5.2 Integration
```typescript
// Files to create:
- components/treasury/RampWidget.tsx       // Ramp SDK integration
- app/api/ramp/webhook/route.ts            // Handle Ramp events
```

#### 5.3 Smart Contract Update (Optional)
```solidity
// Add function to update anonymous contributions
function updateContributorName(uint256 index, string memory name)
  external onlyOwner {
  // Allow owner to add name to anonymous Ramp contributions
}
```

**Deliverable**: Users mają 3 opcje: MetaMask, Stripe, Ramp

**Time**: ~3 days

---

## 🔐 Phase 6: Security & Testing (Week 8)

**Goal**: Aplikacja jest bezpieczna i gotowa na produkcję

### Tasks:

#### 6.1 Security Audit
- [ ] Review smart contracts (consider professional audit)
- [ ] Review backend wallet security
- [ ] Penetration testing
- [ ] Fix any vulnerabilities

#### 6.2 Automated Testing
```typescript
// Tests to write:
- E2E tests (Playwright)
  - Login flow
  - Create treasury flow
  - Deposit via MetaMask
  - Deposit via Stripe
  - Withdraw flow

- API tests (Jest)
  - Auth middleware
  - Stripe webhook
  - Ramp webhook
  - Treasury API endpoints

- Contract tests (Hardhat)
  - Already done! 56 tests ✅
```

#### 6.3 Monitoring & Alerts
- [ ] Setup Sentry (error tracking)
- [ ] Setup PostHog (analytics)
- [ ] Backend wallet balance alerts
- [ ] Failed transaction alerts

#### 6.4 Legal & Compliance
- [ ] Terms of Service
- [ ] Privacy Policy (GDPR compliant)
- [ ] Cookie consent banner
- [ ] Disclaimer: "Not financial advice"

**Deliverable**: Aplikacja bezpieczna i legally compliant

**Time**: ~1 week

---

## 🌐 Phase 7: Production Deploy (Week 9)

**Goal**: Aplikacja live na Base Mainnet

### Tasks:

#### 7.1 Mainnet Preparation
- [ ] Fund deployer wallet with real ETH
- [ ] Review all contract addresses
- [ ] Update `.env.production`
- [ ] Test on Base Mainnet testnet first!

#### 7.2 Contract Deployment
```bash
# Deploy to Base Mainnet
npm run deploy:mainnet

# Verify on Basescan
npx hardhat verify --network base <FACTORY_ADDRESS>
```

#### 7.3 Frontend Deployment
- [ ] Push to GitHub
- [ ] Deploy to Vercel (production)
- [ ] Configure custom domain
- [ ] Setup SSL (automatic on Vercel)
- [ ] Configure environment variables on Vercel

#### 7.4 Database Migration
- [ ] Backup Supabase data
- [ ] Migrate to production DB (if needed)
- [ ] Setup automatic backups

#### 7.5 Go Live Checklist
- [ ] Test create treasury on mainnet
- [ ] Test MetaMask deposit (small amount)
- [ ] Test Stripe payment (small amount)
- [ ] Test email notifications
- [ ] Monitor for 24h (no errors)
- [ ] Announce to beta users

**Deliverable**: skarbiecdziecka.pl live on Base Mainnet! 🎉

**Time**: ~3 days

---

## 🚀 Phase 8: Growth & Features (Week 10+)

**Goal**: Grow user base and add advanced features

### Features:

#### 8.1 Account Abstraction
- [ ] Integrate Privy for social login → automatic wallet
- [ ] Gasless transactions (sponsored by us)
- [ ] Better UX (no MetaMask popup for every action)

#### 8.2 Recurring Deposits
- [ ] Stripe subscriptions (100 PLN/month auto)
- [ ] Email reminders for family

#### 8.3 Investment Options
- [ ] Stake ETH (Lido/Rocket Pool)
- [ ] Auto-compound interest
- [ ] Show projected balance at age 18

#### 8.4 Multi-Currency
- [ ] Support USDC deposits (stablecoin)
- [ ] Auto-convert to ETH or keep as USDC

#### 8.5 Referral Program
- [ ] Share link → Get 10% off Stripe fee
- [ ] Viral growth mechanism

#### 8.6 Mobile App
- [ ] React Native app
- [ ] Push notifications
- [ ] Face ID unlock

**Timeline**: Ongoing (1-2 features per month)

---

## 📊 Resource Requirements

### Development Time
- **Phase 1**: 1 week ✅ (mostly done)
- **Phase 2**: 1 week (auth + DB)
- **Phase 3**: 1.5 weeks (Stripe)
- **Phase 4**: 1 week (UX polish)
- **Phase 5**: 3 days (Ramp)
- **Phase 6**: 1 week (security)
- **Phase 7**: 3 days (deploy)

**Total MVP → Production**: ~6-7 weeks (1 developer)

### Costs (Monthly)
- Vercel Pro: $20
- Supabase Pro: $25
- Domain: $1
- AWS Secrets: $1
- Sentry: $0 (free tier)
- **Total**: ~$50/mo

### Costs (One-time)
- Smart contract audit: $5k-20k (optional but recommended)
- Logo/branding: $0-500
- Legal consultation: $500-1000

---

## 🎯 Success Metrics

### MVP Launch (Week 7)
- [ ] 10 treasuries created
- [ ] 50 contributions total
- [ ] $1000+ total value locked
- [ ] 0 critical bugs
- [ ] < 0.1% failed transactions

### 3 Months Post-Launch
- [ ] 100+ active treasuries
- [ ] $10k+ total value locked
- [ ] 1000+ contributions
- [ ] Stripe revenue: $300+ (= 10k transactions)

### 6 Months Post-Launch
- [ ] 500+ treasuries
- [ ] $50k+ total value locked
- [ ] 5000+ contributions
- [ ] Break-even on operating costs

---

## ❓ Open Questions

Questions to decide before implementation:

### Q1: Stripe → ETH Conversion Strategy?
**Options**:
- A) Manual (founder buys ETH and relays) - simple, doesn't scale
- B) Exchange API (Binance/Kraken) - requires KYC, good rates
- C) Ramp Business API - easiest, handles everything
- D) DEX (Uniswap) - on-chain, but needs stablecoin first

**Decision needed**: ?

### Q2: Custody dla Backend Wallet?
**Options**:
- A) Single wallet (simple, risky)
- B) Multisig 2/3 (secure, slower)
- C) AWS KMS (enterprise, expensive)

**Decision needed**: ?

### Q3: KYC/AML Requirements?
**Options**:
- A) No KYC (risk: regulatory issues later)
- B) KYC through Stripe (Stripe handles it)
- C) KYC through Ramp (Ramp handles it)

**Decision needed**: Consult lawyer

### Q4: Business Entity?
**Options**:
- A) JDG (jednoosobowa działalność) - prosty start
- B) Sp. z o.o. (company) - better for investors
- C) Fundacja non-profit - jeśli chcemy być charity

**Decision needed**: ?

---

## 🤝 Contributors Welcome

Jeśli chcesz pomóc w development:
1. Check current phase in roadmap
2. Pick a task from open issues
3. Fork repo i submit PR
4. Discuss na GitHub Discussions

---

**Made with ❤️ for Polish families** 🇵🇱

> "The best time to plant a tree was 20 years ago. The second best time is now."
> — Chinese Proverb
