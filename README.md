# ⚡ SKARBIEC DZIECKA

<div align="center">

**CYBERPUNK CRYPTO VAULTS FOR KIDS**

*Zbuduj przyszłość swojego dziecka na blockchainie*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Base L2](https://img.shields.io/badge/Base-L2-0052FF?style=for-the-badge&logo=coinbase)](https://base.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🎨 Design](#-cyberpunk-design) • [📖 Docs](#-dokumentacja)

</div>

---

## 🌃 O Projekcie

**Skarbiec Dziecka** to blockchain-based platforma umożliwiająca rodzinom tworzenie **długoterminowych oszczędności w kryptowalutach** dla swoich dzieci.

### 💡 Concept
- **Rodzic** tworzy skarbiec (smart contract) dla dziecka
- **Rodzina i znajomi** wpłacają ETH na adres skarbca
- **Tylko rodzic** może wypłacić środki (full custody)
- **Na Base L2** = 500x taniej niż Ethereum (~$0.01 za transakcję)

## ✨ Features

### 🔐 Smart Contracts (Solidity)
- ✅ **TreasuryVault** - indywidualny skarbiec dla dziecka
- ✅ **TreasuryFactory** - factory pattern dla tworzenia skarbców
- ✅ **OpenZeppelin 5.0.1** - audited security libraries
- ✅ **56 testów** - pełne pokrycie testami (100%)
- ✅ **Access Control** - tylko owner może wypłacić
- ✅ **Contribution Tracking** - historia wszystkich wpłat

### 🌐 Web Application (Next.js 14)
- ✅ **Cyberpunk Neon Design** - futurystyczny UI w stylu cyberpunk
- ✅ **Wagmi v2 + Viem** - nowoczesna integracja Web3
- ✅ **Dynamic Treasury Pages** - każdy skarbiec ma własną stronę
- ✅ **QR Codes** - łatwe wpłaty przez skanowanie
- ✅ **Real-time Data** - dane z blockchain na żywo
- ✅ **Responsive** - działa na mobile i desktop

### ⚡ Blockchain
- ✅ **Base L2** - 500x taniej niż Ethereum L1
- ✅ **2s block time** - szybkie potwierdzenia
- ✅ **EVM Compatible** - ten sam kod działa wszędzie
- 🔜 **Base Sepolia** testnet support
- 🔜 **Base Mainnet** production ready

### 💰 Payments (Roadmap)
- 🔜 **Stripe** - BLIK i karty (PL users)
- 🔜 **Ramp Network** - crypto on-ramp
- 🔜 **No wallet needed** - rodzina wpłaca bez crypto

---

## 🎨 Cyberpunk Design

Aplikacja została zaprojektowana w stylu **cyberpunk/neon** z pełną paletą neonowych kolorów:

### 🎨 Kolory
- 🔴 **Neon Pink** `#FF006E` - główne akcenty
- 🔵 **Neon Cyan** `#00F0FF` - teksty i buttony
- 🟣 **Neon Purple** `#B026FF` - gradient effects
- 🟡 **Neon Yellow** `#FFFF00` - highlights
- 🟢 **Neon Green** `#39FF14` - success states

### ✨ Efekty
- 🌐 Grid background pattern
- ⚡ Scan line animations
- 💫 Glow effects na wszystkich elementach
- ⚙️ Flicker animations
- 🖥️ Terminal-style typography (monospace)

### 📱 Przykładowy wygląd
```
⚡ SKARBIEC DZIECKA
> ZBUDUJ PRZYSZŁOŚĆ NA BLOCKCHAIN_

[01] > POŁĄCZ_PORTFEL
    > CONNECT MetaMask

[02] > UTWÓRZ_SKARBIEC
    CHILD.NAME: Olaf
    CHILD.AGE: 5
    ⚡ DEPLOY_VAULT > OLAF

VAULT [OLAF]
BALANCE: 1.0 ETH
> TRANSACTION_HISTORY
  👵 Babcia Maria    +0.5 ETH
  👨 Wujek Tomasz    +1.0 ETH
```

---

## 🚀 Quick Start

### Wymagania
- **Node.js 18+**
- **npm/yarn**
- **Git**

### Instalacja

```bash
# 1. Clone repo
git clone https://github.com/batman-haker/skarbiecdziecka.git
cd skarbiecdziecka

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edytuj .env.local (dla local dev wystarczą defaulty)

# 4. Compile smart contracts
npm run compile

# 5. Run tests (56 tests should pass)
npm run test:contracts

# 6. Start local blockchain (w osobnym terminalu)
npx hardhat node

# 7. Deploy contracts locally (w osobnym terminalu)
npx hardhat run scripts/deploy-simple.js --network localhost

# 8. Start web app
npm run dev
```

**Aplikacja:** http://localhost:3000
**Treasury demo:** http://localhost:3000/treasury

### 🎮 Demo Flow

1. **Otwórz** http://localhost:3000
2. **Utwórz** nowy skarbiec (możesz bez portfela na local)
3. **Zobacz** skarbiec Olafa z przykładowymi wpłatami
4. **Eksperymentuj** z kodem i designem!

## 📁 Struktura Projektu

```
skarbiec-dziecka/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── treasury/          # Public treasury pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── treasury/         # Treasury-specific components
├── contracts/            # Solidity smart contracts
│   ├── TreasuryVault.sol     # Main treasury contract
│   ├── TreasuryFactory.sol   # Factory for creating treasuries
│   └── interfaces/           # Contract interfaces
├── scripts/              # Deployment scripts
├── test/                 # Contract tests
├── lib/                  # Utility libraries
│   ├── supabase/        # Supabase client
│   ├── web3/            # Web3 utilities
│   └── ramp.ts          # Ramp Network integration
└── public/              # Static assets
```

## 🔧 Konfiguracja

### 1. Supabase Setup
1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Skopiuj URL i anon key do `.env.local`
3. Uruchom migracje SQL (dostępne w `supabase/migrations/`)

### 2. Smart Contracts
```bash
# Skompiluj contracty
npm run compile

# Uruchom testy
npm run test:contracts

# Deploy na Base Sepolia (testnet)
npm run deploy:testnet

# Deploy na Base Mainnet (produkcja)
npm run deploy:mainnet
```

### 3. Ramp Network
1. Załóż konto na [ramp.network](https://ramp.network)
2. Użyj demo mode do testowania: `https://app.demo.ramp.network`
3. Dodaj klucz API do `.env.local`

## 🧪 Testowanie

### Smart Contracts
```bash
# Wszystkie testy
npm run test:contracts

# Z coverage
npx hardhat coverage

# Specific test file
npx hardhat test test/TreasuryVault.test.ts
```

### Frontend (TODO - Week 3+)
```bash
# Unit tests (będą dodane później)
npm run test

# E2E tests (Playwright/Cypress)
npm run test:e2e
```

## 📦 Deployment

### Testnet (Base Sepolia)
1. Dodaj testnet ETH do swojego walleta (użyj faucet)
2. Skonfiguruj `PRIVATE_KEY` w `.env.local`
3. Deploy: `npm run deploy:testnet`

### Mainnet (Produkcja)
1. ⚠️ **UPEWNIJ SIĘ, ŻE CONTRACTY SĄ PRZETESTOWANE**
2. Zmień konfigurację na Base Mainnet w `.env.local`
3. Deploy: `npm run deploy:mainnet`
4. Zweryfikuj contracty na Basescan

### Frontend (Vercel)
```bash
# Push do GitHub
git push origin main

# Vercel automatycznie zrobi deploy
# Lub ręcznie:
vercel --prod
```

## 🔐 Bezpieczeństwo

- ✅ Smart contracty używają OpenZeppelin (audited)
- ✅ Privy dla Account Abstraction (bezpieczne wallet)
- ✅ Supabase Auth + Row Level Security
- ✅ Environment variables nigdy nie w repo
- ⚠️ Audit contractów zalecany przed mainnet (opcjonalny)

## 📄 Licencja & Legal

- Smart Contracts: MIT License
- Kod aplikacji: Proprietary (Skarbiec Dziecka)
- Wymaga działalności gospodarczej (JDG/Sp. z o.o.)
- GDPR compliant (Polityka Prywatności wymagana)
- Nie stanowi porady inwestycyjnej

## 🤝 Contributing

To jest prywatny projekt. Jeśli chcesz pomóc:
1. Zgłoś issue jeśli znajdziesz bug
2. Zaproponuj feature przez discussions
3. Skontaktuj się: support@skarbiecdziecka.pl

## 📚 Dokumentacja

- [Architecture Overview](./docs/ARCHITECTURE.md) - TODO
- [Smart Contracts Guide](./docs/CONTRACTS.md) - TODO
- [API Documentation](./docs/API.md) - TODO
- [Deployment Guide](./docs/DEPLOYMENT.md) - TODO

## 🆘 Support

- Email: support@skarbiecdziecka.pl
- Issues: [GitHub Issues](https://github.com/your-username/skarbiec-dziecka/issues)
- Docs: [Documentation](https://docs.skarbiecdziecka.pl) - TODO

---

**Made with ❤️ in Poland** 🇵🇱
