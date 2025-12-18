# 🏗️ Skarbiec Dziecka - Architecture Design

> Kompletna architektura systemu z integracją Stripe, Ramp Network, Google Auth i blockchain

---

## 📋 Spis treści

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Authentication System](#authentication-system)
4. [Payment Architecture](#payment-architecture)
5. [Custody Model](#custody-model)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Security Considerations](#security-considerations)

---

## 🎯 Overview

### Główne komponenty systemu:

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js 14 + Wagmi + Viem + Cyberpunk UI                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Supabase   │    │   Stripe     │    │  Ramp        │
│   Auth + DB  │    │   Payments   │    │  Network     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │  Backend API │
                    │  (Next.js)   │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Smart Contract│
                    │ Base Sepolia │
                    └──────────────┘
```

---

## 👤 User Flows

### Flow 1: Rodzic tworzy skarbiec (Web3 wallet)

**Scenariusz**: Heniek ma MetaMask, zna crypto

```
1. Heniek → Loguje się przez Google (Supabase Auth)
2. Heniek → Łączy MetaMask z aplikacją
3. Heniek → Wypełnia formularz (Imię dziecka: Olaf, Wiek: 5)
4. Heniek → Klika "Utwórz skarbiec" → MetaMask popup
5. Smart Contract → Deploy TreasuryVault (owner: Heniek address)
6. Backend → Zapisuje w DB: user_id, treasury_address, child_name
7. Heniek → Dostaje link: skarbiecdziecka.pl/treasury/0x123...
8. Heniek → Może udostępnić link rodzinie
```

**Koszt**: ~0.0001 ETH (~$0.30) płaci Heniek z MetaMask

---

### Flow 2: Babcia wpłaca bez crypto (Stripe + Ramp)

**Scenariusz**: Babcia Maria nie ma portfela, chce wpłacić 100 PLN

```
1. Babcia → Otwiera link: skarbiecdziecka.pl/treasury/0x123...
2. Babcia → Widzi: "Wpłać dla Olafa" (nie musi się logować!)
3. Babcia → Klika "Wpłać kartą/BLIK"
4. System → Pokazuje dwie opcje:

   OPCJA A: Stripe (prostsze, szybsze)
   ├─ Babcia → Wpłaca 100 PLN kartą/BLIK przez Stripe
   ├─ Backend → Otrzymuje webhook od Stripe
   ├─ Backend → Używa treasury wallet do kupienia ETH
   ├─ Backend → Wysyła ETH do treasury contract
   └─ Babcia → Dostaje email: "Wpłata 100 PLN = 0.025 ETH dodana do skarbca Olafa"

   OPCJA B: Ramp Network (bezpośredni crypto on-ramp)
   ├─ Babcia → Otwiera widget Ramp Network
   ├─ Babcia → Wpłaca 100 PLN kartą
   ├─ Ramp → Konwertuje PLN → ETH i wysyła na treasury address
   └─ Babcia → Crypto idzie bezpośrednio do skarbca (Ramp się tym zajmuje)

5. Smart Contract → Event: ContributionReceived("Babcia Maria", 0.025 ETH)
6. Backend → Webhook → Aktualizuje DB i wysyła email
7. Heniek → Dostaje powiadomienie: "Babcia Maria wpłaciła 100 PLN!"
```

---

### Flow 3: Heniek wypłaca środki (owner tylko)

**Scenariusz**: Heniek chce wypłacić 0.5 ETH na wakacje dla Olafa

```
1. Heniek → Loguje się (Google Auth)
2. Heniek → Przechodzi do swojego skarbca
3. Heniek → Widzi dashboard właściciela (tylko on!)
4. Heniek → Klika "Wypłać" → Formularz:
   - Kwota: 0.5 ETH
   - Adres docelowy: 0xHeniekWallet...
   - Cel: "Wakacje dla Olafa"
5. System → Weryfikuje: czy Heniek = owner w smart contract?
6. Frontend → Pokazuje MetaMask popup (transaction signature)
7. Heniek → Potwierdza w MetaMask
8. Smart Contract → withdrawETH(0.5 ETH, 0xHeniekWallet)
9. Smart Contract → Sprawdza: require(msg.sender == owner)
10. Smart Contract → transfer(0.5 ETH) → sukces
11. Backend → Event listener → Email: "Wypłacono 0.5 ETH"
```

**Bezpieczeństwo**: Tylko owner (Heniek) ma klucz prywatny, więc tylko on może wypłacić.

---

## 🔐 Authentication System

### Stack:
- **Supabase Auth** - zarządzanie użytkownikami
- **Google OAuth** - logowanie przez Google
- **Row Level Security (RLS)** - każdy user widzi tylko swoje dane

### Schema użytkowników:

```sql
-- Supabase Auth (automatyczne)
auth.users
├─ id (UUID)
├─ email
├─ provider (google)
└─ metadata

-- Nasza tabela (public schema)
public.users
├─ id (UUID, FK -> auth.users.id)
├─ email
├─ full_name
├─ created_at
├─ wallet_address (opcjonalne, jeśli połączył MetaMask)
└─ has_web3_wallet (boolean)
```

### Logowanie flow:

```typescript
// 1. User klika "Zaloguj przez Google"
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://skarbiecdziecka.pl/auth/callback'
  }
})

// 2. Google OAuth → redirect → callback
// 3. Supabase tworzy session (JWT token w cookies)
// 4. Frontend sprawdza: czy user ma już profil?

const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single()

// 5. Jeśli nie - tworzymy profil
if (!profile) {
  await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata.full_name,
    has_web3_wallet: false
  })
}
```

---

## 💳 Payment Architecture

### Metody płatności:

| Metoda | Dla kogo? | Prowizja | Czas | Custody |
|--------|-----------|----------|------|---------|
| **MetaMask** | Crypto users | Gas only (~$0.01) | 2s | Self-custody |
| **Stripe** | Babcie/wujki | 2.9% + 1 PLN | 1-5 min | Custodial (my) |
| **Ramp Network** | No-coiners | 0.49-2.9% | 1-10 min | Self-custody |

---

### OPCJA A: Stripe Flow (Custodial)

**Kiedy**: User chce wpłacić kartą/BLIK, nie ma portfela

```
┌──────────┐  100 PLN    ┌──────────┐  webhook   ┌──────────┐
│  Babcia  │ ─────────> │  Stripe  │ ────────> │ Backend  │
│  Maria   │  karta/BLIK │ Checkout │  success   │   API    │
└──────────┘             └──────────┘            └──────────┘
                                                       │
                                                       │ 1. Buy ETH
                                                       │ 2. Send to treasury
                                                       ▼
                                              ┌──────────────┐
                                              │  Treasury    │
                                              │  Wallet      │
                                              │  (custodial) │
                                              └──────────────┘
                                                       │
                                                       │ depositETH()
                                                       ▼
                                              ┌──────────────┐
                                              │  Smart       │
                                              │  Contract    │
                                              │  0x123...    │
                                              └──────────────┘
```

**Backend flow**:

```typescript
// 1. Frontend tworzy Stripe Checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card', 'blik'],
  line_items: [{
    price_data: {
      currency: 'pln',
      product_data: {
        name: 'Wpłata do skarbca Olafa',
      },
      unit_amount: 10000, // 100 PLN
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: 'https://skarbiecdziecka.pl/success',
  cancel_url: 'https://skarbiecdziecka.pl/cancel',
  metadata: {
    treasury_address: '0x123...',
    contributor_name: 'Babcia Maria',
  },
})

// 2. Stripe webhook (payment_intent.succeeded)
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

  if (event.type === 'payment_intent.succeeded') {
    const session = event.data.object
    const { treasury_address, contributor_name } = session.metadata
    const amount_pln = session.amount_received / 100

    // 3. Kup ETH (używamy exchange API lub stablecoin swap)
    const eth_amount = await buyETHWithPLN(amount_pln)

    // 4. Wyślij ETH do treasury contract
    const tx = await treasuryWallet.sendTransaction({
      to: treasury_address,
      value: ethers.parseEther(eth_amount),
      data: treasuryContract.interface.encodeFunctionData('depositETH', [
        contributor_name
      ])
    })

    await tx.wait()

    // 5. Zapisz w DB
    await supabase.from('contributions').insert({
      treasury_address,
      contributor_name,
      amount_pln,
      amount_eth: eth_amount,
      payment_method: 'stripe',
      tx_hash: tx.hash,
    })

    // 6. Wyślij email
    await sendEmail({
      to: treasuryOwnerEmail,
      subject: 'Nowa wpłata do skarbca!',
      html: `${contributor_name} wpłaciła ${amount_pln} PLN (${eth_amount} ETH)`
    })
  }

  return new Response('OK', { status: 200 })
}
```

**Kluczowy element**: Backend musi mieć **treasury wallet** z trochę ETH na gas.

---

### OPCJA B: Ramp Network Flow (Non-Custodial)

**Kiedy**: User chce wpłacić, ale chcemy zero custody (bezpieczniej)

```
┌──────────┐  100 PLN    ┌──────────┐  ETH       ┌──────────┐
│  Babcia  │ ─────────> │   Ramp   │ ────────> │  Smart   │
│  Maria   │  karta/BLIK │  Network │  direct   │ Contract │
└──────────┘             └──────────┘            └──────────┘
```

**Frontend flow**:

```typescript
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'

// 1. User klika "Wpłać kartą"
const ramp = new RampInstantSDK({
  hostAppName: 'Skarbiec Dziecka',
  hostLogoUrl: 'https://skarbiecdziecka.pl/logo.png',

  // KLUCZOWE: Gdzie wysłać ETH
  userAddress: treasuryAddress, // 0x123... (adres treasury contract!)

  // Konfiguracja
  swapAsset: 'BASE_ETH', // ETH na Base
  fiatCurrency: 'PLN',
  fiatValue: 100, // 100 PLN

  // Webhook (opcjonalny)
  webhookStatusUrl: 'https://skarbiecdziecka.pl/api/ramp-webhook',
})

ramp.show()

// 2. Ramp otwiera widget → User wpłaca → Ramp wysyła ETH
// 3. Smart contract otrzymuje ETH (fallback receive)
// 4. Ale jak dodać contributor_name? 🤔
```

**Problem**: Ramp wysyła ETH bezpośrednio, ale nie może wywołać `depositETH(name)`.

**Rozwiązanie**: Dwuetapowy flow:

```typescript
// KROK 1: User wpłaca przez Ramp → ETH idzie na TreasuryVault
// Smart contract ma funkcję receive() która przyjmuje ETH

contract TreasuryVault {
  receive() external payable {
    // Accept ETH, ale brak contributor name
    // Zapisujemy tylko jako "anonymous"
    emit ContributionReceived(msg.sender, msg.value, "Anonymous (Ramp)");
  }
}

// KROK 2: Po wpłacie, user wypełnia formularz z imieniem
// Backend wywołuje updateContributorName() jeśli to możliwe
```

**Albo lepiej**: Używamy Ramp tylko dla advanced users, a dla babć Stripe.

---

## 🔑 Custody Model

### Model 1: Pure Self-Custody (tylko MetaMask)

```
Zalety:
✅ Zero risk dla nas (nie trzymamy kluczy)
✅ User ma pełną kontrolę
✅ No regulatory issues

Wady:
❌ Babcie nie mogą wpłacać (za trudne)
❌ Mniejsza adopcja
❌ Wymaga crypto knowledge
```

### Model 2: Hybrid (Stripe + Backend Wallet) ⭐ RECOMMENDED

```
Zalety:
✅ Babcie mogą wpłacać kartą/BLIK
✅ Większa adopcja
✅ UX jak w normalnej aplikacji

Wady:
⚠️ Musimy trzymać treasury wallet (dla gas + relay)
⚠️ Regulatory compliance (AML/KYC?)
⚠️ Security risk (backend wallet musi być zabezpieczony)
```

**Implementacja**:

```typescript
// Backend ma 1 wallet ("Treasury Service Wallet")
const treasuryServiceWallet = new ethers.Wallet(
  process.env.TREASURY_SERVICE_PRIVATE_KEY!, // ⚠️ BARDZO TAJNE!
  provider
)

// Ten wallet:
// 1. Ma ETH na gas (~0.1 ETH wystarczy na rok)
// 2. Używamy go tylko do relay wpłat ze Stripe
// 3. NIE trzymamy user funds (tylko przekazujemy)
```

**Bezpieczeństwo**:
- Private key w **AWS Secrets Manager** / **Vault**
- Rate limiting (max 1 tx/minute na treasury)
- Monitoring (alert jeśli wallet balance < 0.01 ETH)
- Multisig (opcjonalnie, na przyszłość)

### Model 3: Account Abstraction (przyszłość)

```
Używamy Privy lub Biconomy dla:
✅ Social login (Google) → automatic wallet
✅ Gasless transactions (sponsored by us)
✅ No MetaMask needed
```

**Rekomendacja**: Start z Model 2, migrate do Model 3 later.

---

## 🗄️ Database Schema

```sql
-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  wallet_address TEXT, -- MetaMask address (jeśli połączył)
  has_web3_wallet BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: User widzi tylko siebie
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- ==========================================
-- TREASURIES
-- ==========================================
CREATE TABLE public.treasuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Blockchain data
  contract_address TEXT NOT NULL UNIQUE, -- 0x123...
  chain_id INTEGER NOT NULL DEFAULT 84532, -- Base Sepolia

  -- Child data
  child_name TEXT NOT NULL,
  child_birth_date BIGINT NOT NULL, -- Unix timestamp

  -- Owner data
  owner_user_id UUID REFERENCES public.users(id), -- Heniek
  owner_wallet_address TEXT NOT NULL, -- 0xHeniek...

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT treasuries_contract_address_key UNIQUE(contract_address)
);

CREATE INDEX idx_treasuries_owner ON public.treasuries(owner_user_id);
CREATE INDEX idx_treasuries_contract ON public.treasuries(contract_address);

-- RLS Policy: Everyone can view, only owner can edit
ALTER TABLE public.treasuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view treasuries" ON public.treasuries
  FOR SELECT USING (true);
CREATE POLICY "Owner can update treasury" ON public.treasuries
  FOR UPDATE USING (auth.uid() = owner_user_id);

-- ==========================================
-- CONTRIBUTIONS (wpłaty)
-- ==========================================
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Treasury reference
  treasury_id UUID REFERENCES public.treasuries(id),
  treasury_address TEXT NOT NULL, -- denormalized dla szybkości

  -- Contributor data
  contributor_name TEXT NOT NULL, -- "Babcia Maria"
  contributor_wallet TEXT, -- jeśli wpłata przez MetaMask

  -- Payment data
  amount_eth DECIMAL(18, 8) NOT NULL,
  amount_pln DECIMAL(10, 2), -- jeśli przez Stripe
  payment_method TEXT NOT NULL, -- 'metamask' | 'stripe' | 'ramp'

  -- Blockchain data
  tx_hash TEXT, -- transaction hash
  block_number BIGINT,

  -- Stripe data (jeśli payment_method = 'stripe')
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT contributions_tx_hash_key UNIQUE(tx_hash)
);

CREATE INDEX idx_contributions_treasury ON public.contributions(treasury_id);
CREATE INDEX idx_contributions_tx ON public.contributions(tx_hash);

-- RLS Policy: Everyone can view contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contributions" ON public.contributions
  FOR SELECT USING (true);

-- ==========================================
-- WITHDRAWALS (wypłaty)
-- ==========================================
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  treasury_id UUID REFERENCES public.treasuries(id),
  treasury_address TEXT NOT NULL,

  -- Withdrawal data
  amount_eth DECIMAL(18, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  reason TEXT, -- "Wakacje dla Olafa"

  -- Blockchain data
  tx_hash TEXT NOT NULL,
  block_number BIGINT,

  -- User
  withdrawn_by_user_id UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Only owner can see withdrawals
CREATE POLICY "Owner can view withdrawals" ON public.withdrawals
  FOR SELECT USING (
    withdrawn_by_user_id = auth.uid()
  );

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES public.users(id),
  treasury_id UUID REFERENCES public.treasuries(id),

  type TEXT NOT NULL, -- 'contribution' | 'withdrawal' | 'milestone'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- RLS Policy
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 🔌 API Design

### Public API Endpoints (no auth)

```typescript
// GET /api/treasury/[address] - Public treasury data
export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params

  // 1. Fetch from blockchain
  const treasury = await getTreasuryFromBlockchain(address)

  // 2. Fetch from DB
  const dbData = await supabase
    .from('treasuries')
    .select('*, contributions(*)')
    .eq('contract_address', address)
    .single()

  return NextResponse.json({
    address,
    childName: treasury.childName,
    balance: treasury.balance,
    contributionsCount: treasury.contributionsCount,
    contributions: dbData.contributions,
  })
}

// POST /api/stripe/checkout - Create Stripe session
export async function POST(request: Request) {
  const { treasury_address, amount_pln, contributor_name } = await request.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'blik'],
    line_items: [{
      price_data: {
        currency: 'pln',
        product_data: {
          name: `Wpłata do skarbca`,
        },
        unit_amount: amount_pln * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/treasury/${treasury_address}`,
    metadata: {
      treasury_address,
      contributor_name,
    },
  })

  return NextResponse.json({ sessionId: session.id })
}

// POST /api/stripe/webhook - Stripe webhook
export async function POST(request: Request) {
  // ... (implementation above)
}
```

### Protected API Endpoints (auth required)

```typescript
// POST /api/treasury/create - Create new treasury
export async function POST(request: Request) {
  // 1. Verify auth
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. Get params
  const { child_name, child_age, owner_wallet } = await request.json()

  // 3. Deploy contract (relay from backend or user does it)
  // ... deploy logic

  // 4. Save to DB
  const { data } = await supabase.from('treasuries').insert({
    contract_address: treasuryAddress,
    child_name,
    child_birth_date: birthDate,
    owner_user_id: user.id,
    owner_wallet_address: owner_wallet,
  }).select().single()

  return NextResponse.json(data)
}

// GET /api/my-treasuries - List user's treasuries
export async function GET(request: Request) {
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data } = await supabase
    .from('treasuries')
    .select('*')
    .eq('owner_user_id', user.id)

  return NextResponse.json(data)
}

// POST /api/treasury/[address]/withdraw - Withdraw ETH
export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  // 1. Verify auth
  const supabase = createServerClient(cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. Verify ownership
  const { data: treasury } = await supabase
    .from('treasuries')
    .select('*')
    .eq('contract_address', params.address)
    .eq('owner_user_id', user.id)
    .single()

  if (!treasury) return new Response('Not your treasury', { status: 403 })

  // 3. User signs transaction on frontend (we don't relay withdrawals!)
  // This endpoint is just for recording the withdrawal in DB

  const { amount, tx_hash, destination, reason } = await request.json()

  await supabase.from('withdrawals').insert({
    treasury_id: treasury.id,
    treasury_address: params.address,
    amount_eth: amount,
    destination_address: destination,
    reason,
    tx_hash,
    withdrawn_by_user_id: user.id,
  })

  return NextResponse.json({ success: true })
}
```

---

## 🛡️ Security Considerations

### 1. Smart Contract Security
- ✅ OpenZeppelin contracts (audited)
- ✅ Only owner can withdraw
- ✅ ReentrancyGuard on all payable functions
- ⚠️ Consider audit before mainnet (~$5k-20k)

### 2. Backend Wallet Security
- ✅ Private key w AWS Secrets Manager / Vault
- ✅ Rate limiting (1 tx/min per treasury)
- ✅ Max amount limit (np. 1000 PLN per transaction)
- ✅ Monitoring & alerts
- ⚠️ Consider multisig (2/3 keys)

### 3. Stripe Security
- ✅ Webhook signature verification (stripe.webhooks.constructEvent)
- ✅ HTTPS only
- ✅ Idempotency (check if payment already processed)

### 4. Database Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only see their data
- ✅ Prepared statements (no SQL injection)

### 5. Frontend Security
- ✅ HTTPS enforced
- ✅ CSP headers
- ✅ No sensitive data in localStorage
- ✅ Wallet signature verification

### 6. Legal & Compliance
- ⚠️ GDPR compliance (privacy policy, terms)
- ⚠️ AML/KYC? (jeśli Stripe > 15k EUR/year, może być wymagane)
- ⚠️ Terms of Service (disclaimer: not financial advice)
- ⚠️ Polish regulations dla pośrednictwa finansowego

---

## 📊 Recommended Tech Stack

```yaml
Frontend:
  - Next.js 14 (App Router)
  - Wagmi v2 + Viem (Web3)
  - Supabase Client (Auth + DB)
  - Stripe.js (Payments)
  - Ramp SDK (Crypto on-ramp)
  - TailwindCSS (Cyberpunk UI)

Backend:
  - Next.js API Routes
  - Supabase (PostgreSQL + Auth)
  - Stripe API (Payments)
  - Ethers.js (Smart contract interaction)
  - Resend/SendGrid (Emails)

Blockchain:
  - Solidity 0.8.20
  - OpenZeppelin 5.0
  - Hardhat (Development)
  - Base Sepolia (Testnet)
  - Base Mainnet (Production)

Infrastructure:
  - Vercel (Hosting)
  - Supabase (Database + Auth)
  - AWS Secrets Manager (Keys)
  - Sentry (Error tracking)
  - PostHog (Analytics)
```

---

## 🚀 Deployment Phases

### Phase 1: MVP (2-3 tygodnie) ✅
- [x] Smart contracts deployed
- [x] Web3 wallet integration (MetaMask)
- [x] Basic UI (cyberpunk)
- [ ] Google Auth (Supabase)
- [ ] Database schema
- [ ] Create treasury flow

### Phase 2: Payments (2-3 tygodnie)
- [ ] Stripe integration
- [ ] Backend relay wallet
- [ ] Webhook handling
- [ ] Email notifications
- [ ] Public treasury pages (no login required)

### Phase 3: Polish UX (1-2 tygodnie)
- [ ] Ramp Network integration
- [ ] Dashboard dla ownerów
- [ ] Contribution history
- [ ] QR codes dla łatwych wpłat
- [ ] Mobile responsive

### Phase 4: Production Ready (1-2 tygodnie)
- [ ] Security audit (opcjonalnie)
- [ ] Deploy na Base Mainnet
- [ ] Terms of Service / Privacy Policy
- [ ] Monitoring & alerts
- [ ] Customer support (email/chat)

### Phase 5: Growth (ongoing)
- [ ] Account Abstraction (Privy)
- [ ] Recurring deposits
- [ ] Investment options (staking ETH?)
- [ ] Multiple currencies
- [ ] Referral program

---

## 💡 Key Decisions To Make

### Decision 1: Custody Model
**Question**: Kto trzyma klucze dla wpłat przez Stripe?

**Options**:
- A) Pure self-custody (tylko MetaMask) - bezpieczniejsze, mniej users
- B) Hybrid (backend wallet dla relay) - więcej users, więcej risk ⭐
- C) Account Abstraction (Privy) - najlepsze UX, droższe

**Recommendation**: Start z B (hybrid), plan migrate to C

---

### Decision 2: Payment Provider Priority
**Question**: Stripe czy Ramp jako primary?

**Options**:
- A) Stripe primary (prostsze UX, custodial)
- B) Ramp primary (non-custodial, lepiej dla crypto)
- C) Both równolegle

**Recommendation**: A (Stripe) dla MVP, dodaj Ramp w Phase 3

---

### Decision 3: Withdrawal Flow
**Question**: Jak owner wypłaca środki?

**Options**:
- A) Owner musi mieć MetaMask (sign transaction)
- B) Backend może relay withdrawal (dangerous!)
- C) Multi-sig required

**Recommendation**: A tylko! Owner MUSI mieć klucz. Zero backend relay dla withdrawals.

---

## 📞 Contact & Questions

Jeśli masz pytania o architekturę:
1. Przeczytaj ten dokument
2. Check codebase (comments in code)
3. Ask on GitHub Discussions

**Made with ❤️ in Poland** 🇵🇱
