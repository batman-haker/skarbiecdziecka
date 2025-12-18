# 🎁 Skarbiec Dziecka - Aplikacja Webowa - GOTOWA!

## ✅ Co zostało zbudowane

### 1. **Strona Główna** (`/`)
- Połączenie portfela (MetaMask, Coinbase Wallet, etc.)
- Formularz tworzenia skarbca:
  - Imię rodzica
  - Imię dziecka
  - Wiek dziecka
- Automatyczne przekierowanie do strony skarbca po utworzeniu
- Link do przykładowego skarbca Olafa

### 2. **Strona Skarbca** (`/treasury?address=0x...`)
- **Dynamiczna** - działa z dowolnym adresem skarbca
- **Wyświetla**:
  - QR kod adresu skarbca
  - Aktualne saldo w ETH i PLN
  - Wiek dziecka (obliczany z blockchain)
  - Liczbę wpłat
  - Pełną historię wpłat (wszystkie wpłaty, nie tylko pierwsze 2)
- **Funkcjonalność wpłat**:
  - Przycisk "Wpłać dla [Imię]"
  - Formularz z imieniem wpłacającego i kwotą
  - Połączenie z portfelem
  - Transakcja blockchain
  - Automatyczne odświeżenie salda po wpłacie

## 🚀 Jak używać

### Opcja A: Hardhat (bez portfela)

1. **Uruchom lokalny blockchain** (jeśli nie działa):
```bash
npx hardhat node
```

2. **Wdróż kontrakty** (jeśli jeszcze nie):
```bash
npx hardhat run scripts/deploy-simple.js --network localhost
```

3. **Stwórz dane demonstracyjne**:
```bash
npx hardhat run scripts/test-web-flow.js --network localhost
```

4. **Otwórz przeglądarkę**:
- Strona główna: http://localhost:3000
- Skarbiec Olafa: http://localhost:3000/treasury
- Skarbiec Zosi: http://localhost:3000/treasury?address=0xeEBe00Ac0756308ac4AaBfD76c05c4F3088B8883

### Opcja B: Z portfelem MetaMask

1. **Dodaj sieć Hardhat do MetaMask**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Zaimportuj konto testowe** (opcjonalnie):
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - To konto ma 10,000 ETH z Hardhat

3. **Otwórz http://localhost:3000**

4. **Połącz portfel** i utwórz skarbiec!

## 📊 Dostępne skarbce demonstracyjne

### Skarbiec Olafa (pierwotny)
- **Adres**: `0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968`
- **Link**: http://localhost:3000/treasury
- **Dziecko**: Olaf, 5 lat
- **Saldo**: 1.0 ETH
- **Wpłaty**:
  - Babcia Maria: 0.5 ETH (urodziny)
  - Wujek Tomasz: 1.0 ETH (Boże Narodzenie)
  - Heniek (wypłata): -0.5 ETH

### Skarbiec Zosi (nowy)
- **Adres**: `0xeEBe00Ac0756308ac4AaBfD76c05c4F3088B8883`
- **Link**: http://localhost:3000/treasury?address=0xeEBe00Ac0756308ac4AaBfD76c05c4F3088B8883
- **Dziecko**: Zosia, 3 lata
- **Saldo**: 1.0 ETH
- **Wpłaty**:
  - Ciocia Ewa: 0.3 ETH (imieniny)
  - Dziadek Jan: 0.7 ETH (święta)

## 🎯 Kluczowe funkcje

### ✨ Dynamiczny routing
Strona `/treasury` automatycznie:
- Pobiera adres z parametru URL `?address=0x...`
- Jeśli brak parametru, pokazuje skarbiec Olafa (fallback)
- Wszystkie dane pobierane z blockchain w czasie rzeczywistym

### 💰 System wpłat
1. Kliknij "Wpłać dla [Imię]"
2. Połącz portfel
3. Wpisz swoje imię i kwotę
4. Zatwierdź transakcję
5. Poczekaj na potwierdzenie blockchain
6. Saldo odświeża się automatycznie

### 📜 Historia wpłat
- Wszystkie wpłaty wyświetlane dynamicznie
- Różne kolory i emoji dla każdej wpłaty
- Data, kwota i imię wpłacającego
- Przelicznik ETH → PLN (1 ETH ≈ 10,000 PLN)

### 🎨 Responsywny design
- Działa na desktop i mobile
- Gradient kolory
- Animacje i przejścia
- QR kod dla łatwego skanowania

## 🔧 Architektura techniczna

### Frontend
- **Next.js 14** (App Router)
- **React 18** (z hookami)
- **Tailwind CSS** (styling)
- **TypeScript** (type safety)

### Web3
- **wagmi v2** (React hooks dla Ethereum)
- **viem** (TypeScript Ethereum library)
- **@tanstack/react-query** (data fetching)
- **qrcode** (generowanie QR kodów)

### Smart Contracts
- **Solidity 0.8.20**
- **OpenZeppelin 5.0.1** (bezpieczeństwo)
- **Hardhat** (development framework)
- **Base L2** (docelowa sieć, 500x tańsze niż Ethereum)

## 📁 Struktura plików

```
skarbiecdziecka/
├── app/
│   ├── page.tsx              # Strona główna (tworzenie skarbca)
│   ├── treasury/
│   │   └── page.tsx          # Strona skarbca (wyświetlanie + wpłaty)
│   ├── layout.tsx            # Layout z Providers
│   ├── providers.tsx         # WagmiProvider + QueryClient
│   └── globals.css           # Style globalne
├── lib/
│   ├── contracts/
│   │   ├── addresses.ts      # Adresy wdrożonych kontraktów
│   │   ├── TreasuryFactory.json  # ABI Factory
│   │   └── TreasuryVault.json    # ABI Vault
│   └── wagmi-config.ts       # Konfiguracja Web3
├── contracts/
│   ├── TreasuryFactory.sol   # Kontrakt fabryki
│   └── TreasuryVault.sol     # Kontrakt skarbca
├── scripts/
│   ├── deploy-simple.js      # Wdrożenie kontraktów
│   ├── create-olaf-treasury.js  # Demo Olafa
│   └── test-web-flow.js      # Demo Zosi
└── test/
    ├── TreasuryFactory.test.ts  # Testy fabryki
    └── TreasuryVault.test.ts    # Testy skarbca
```

## 🎓 Co dalej?

### Faza 2: Integracja płatności (zaplanowana)
1. **Stripe** - BLIK i karty dla użytkowników PL
2. **Ramp Network** - Krypto on-ramp (fiat → crypto)
3. Wpłaty bez portfela dla rodziny

### Faza 3: Social login (zaplanowana)
1. **Privy** lub **Dynamic** - logowanie przez Google/Email
2. Automatyczne tworzenie portfeli
3. Brak potrzeby rozumienia crypto

### Faza 4: Produkcja
1. Deploy na **Base Mainnet** lub **Base Sepolia testnet**
2. Hosting na **Vercel**
3. Domena **skarbiecdziecka.pl**
4. Analytics i monitoring

## 🐛 Znane ograniczenia

1. **Ostrzeżenia webpack** - harmless warnings o brakujących React Native modules (nie wpływają na działanie)
2. **Brak cache zapisu** - warnings o ENOSPC można zignorować
3. **MetaMask localhost warning** - false alarm, bezpiecznie zignorować
4. **Brak walidacji wieku** - frontend przyjmuje dowolny wiek (0-999)

## 💡 Porady

### Debugowanie
1. Sprawdź czy Hardhat node działa: `lsof -i :8545` (Mac/Linux) lub `netstat -ano | findstr :8545` (Windows)
2. Sprawdź czy Next.js działa: otwórz http://localhost:3000
3. Sprawdź console w przeglądarce (F12) dla błędów Web3
4. Sprawdź terminal Hardhat dla transakcji blockchain

### Testowanie
1. Zawsze testuj najpierw na **Hardhat local** (darmowe, szybkie)
2. Potem na **Base Sepolia testnet** (prawdziwy blockchain, testnet ETH)
3. Na końcu **Base Mainnet** (produkcja, prawdziwe pieniądze)

### Koszty
- **Hardhat local**: 0 PLN (fake ETH)
- **Base Sepolia**: 0 PLN (testnet ETH z faucet)
- **Base Mainnet**: ~$0.01-0.05 za transakcję (~0.05-0.20 PLN)

## 🎉 Gratulacje!

Masz teraz w pełni funkcjonalną aplikację blockchain do zarządzania skarbcami dziecięcymi!

**Wszystko działa**:
- ✅ Smart kontrakty wdrożone
- ✅ Aplikacja webowa działająca
- ✅ Tworzenie skarbców
- ✅ Wpłaty ETH
- ✅ Wyświetlanie historii
- ✅ QR kody
- ✅ Responsywny design

**Gotowe do prezentacji, testów lub dalszego rozwoju!** 🚀
