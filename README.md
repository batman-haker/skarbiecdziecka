# 🎁 Skarbiec Dziecka

**Cyfrowe skarbce dla dzieci** - Platforma umożliwiająca rodzinom tworzenie długoterminowych inwestycji w kryptowaluty dla swoich dzieci poprzez proste wpłaty BLIK/kartą.

## 🚀 Szybki Start

### Wymagania
- Node.js 18+
- npm lub yarn
- MetaMask lub inny wallet (do testowania)
- Konto Supabase (darmowe)
- Konto Ramp Network (do płatności)

### Instalacja

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skonfiguruj zmienne środowiskowe
cp .env.example .env.local
# Wypełnij .env.local swoimi kluczami API

# 3. Skompiluj smart contracty
npm run compile

# 4. Uruchom testy
npm run test:contracts

# 5. Uruchom aplikację (development)
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

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
