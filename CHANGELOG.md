# 📜 CHANGELOG - Historia Zmian

Wszystkie ważne zmiany w projekcie są tutaj dokumentowane.

Format: `[Data] - Tytuł zmiany - Krótki opis`

---

## 2026-01-23 (Po wakacjach) - Bug Fixes & Documentation System

### 🐛 Naprawione
- **Supabase connection issue**
  - Problem: Projekt Supabase był paused/deleted
  - Rozwiązanie: Restore starego projektu
  - Status: ✅ Działa

- **ABI mismatch przy tworzeniu skarbca**
  - Problem: `no matching fragment` error
  - Przyczyna: Relay wallet wysyłał 3 parametry zamiast 2
  - Rozwiązanie: Naprawiono `lib/wallet/relay.ts`
    - Zmiana: `createTreasury(childName, birthDate)` (było 3 parametry)
    - Dodano: Transfer ownership do user's wallet po utworzeniu
  - File: `lib/wallet/relay.ts` (linie 99-141)

### 📚 Dokumentacja - System śledzenia postępów
- **CURRENT_WORK.md** - aktualny stan pracy (aktualizuj codziennie!)
- **CHANGELOG.md** - historia wszystkich zmian
- **DAILY_WORKFLOW.md** - workflow na początku/koniec dnia
- **JAK_NIE_STRACIC_PRACY.md** - quick guide
- **scripts/end-session.js** - helper na koniec sesji
- Dodano npm script: `npm run end-session`

### 🔧 Zmienione
- `lib/wallet/relay.ts` - fix ABI mismatch + transfer ownership
- `package.json` - dodano `end-session` script

### ⚠️ Znane problemy
- MetaMask SDK warning (nie blokujące)
- Welcome ETH może nie działać dla starych userów

---

## 2026-01-23 (Przed wakacjami) - Privy.io Embedded Wallet Integration

### ✨ Dodane
- **Privy.io integration** - Users nie potrzebują MetaMask!
  - Embedded wallet automatycznie tworzony przy rejestracji
  - Google OAuth login
  - File: `app/providers.tsx`, `app/privy-demo/page.tsx`

- **Backend Relay Wallet System** - Automatyczne tworzenie skarbców
  - Relay wallet wysyła "welcome ETH" do nowych userów
  - File: `lib/wallet/relay.ts`
  - Script: `scripts/generate-relay-wallet.js`

- **Auto Treasury Creation API**
  - Endpoint: `/api/treasury/create`
  - Tworzy skarbiec bez potrzeby MetaMask
  - Integracja z relay wallet

- **Balance Checking Scripts**
  - `scripts/check-user-balance.js` - sprawdź balance użytkownika
  - `scripts/check-relay-balance.js` - sprawdź balance relay wallet
  - `scripts/send-welcome-eth-manual.js` - wyślij ETH manualnie (testing)

### 🔧 Zmienione
- `hardhat.config.ts` - dodano Base Sepolia network config
- `package.json` - nowe scripts dla relay wallet
- Dashboard (`app/(dashboard)/dashboard/page.tsx`) - integracja z Privy

### 📚 Dokumentacja
- `docs/WELCOME-ETH.md` - dokumentacja welcome ETH systemu
- Updated `.env.example` z Privy config

---

## 2024-12-XX - Google OAuth Authentication

### ✨ Dodane
- Pełna implementacja Google OAuth via Supabase
- Login/Register flow
- Protected routes middleware

### 🔧 Zmienione
- `lib/supabase/middleware.ts` - auth middleware
- Auth pages w `app/(auth)/`

---

## 2024-12-18 - Smart Contracts Deploy

### ✨ Dodane
- **Deploy na Base Sepolia Testnet**
  - TreasuryFactory contract deployed
  - TreasuryVault template deployed
  - Verified on Basescan

### 📚 Dokumentacja
- `PROJECT_STATUS.md` - status projektu (Week 2 complete)
- `NEXT_STEPS.md` - action items
- `SMART_CONTRACTS_GUIDE.md` - kompletny guide

---

## 2024-12-15 - Smart Contracts (Week 2)

### ✨ Dodane
- `contracts/TreasuryVault.sol` - core vault contract
- `contracts/TreasuryFactory.sol` - factory pattern
- 65+ test cases (100% coverage)
- Deployment scripts
- OpenZeppelin 5.0.1 integration

### 🔧 Zmienione
- Hardhat config - Base L2 support
- Test setup - comprehensive test suite

---

## 2024-12-10 - Initial Setup (Week 1)

### ✨ Dodane
- Next.js 14 project setup
- TypeScript + Tailwind CSS
- Hardhat development environment
- Git repository structure
- Basic landing page
- README with cyberpunk theme

### 📁 Struktura
- `/app` - Next.js App Router
- `/contracts` - Solidity contracts
- `/test` - Contract tests
- `/scripts` - Deployment scripts

---

## Format Wpisów

```markdown
## YYYY-MM-DD - Tytuł Feature/Fix

### ✨ Dodane (Added)
- Co nowego zostało dodane

### 🔧 Zmienione (Changed)
- Co zostało zmodyfikowane

### 🐛 Naprawione (Fixed)
- Jakie bugi naprawiono

### 🗑️ Usunięte (Removed)
- Co zostało usunięte

### 📚 Dokumentacja (Documentation)
- Nowa lub zaktualizowana dokumentacja

### ⚠️ Uwagi (Notes)
- Ważne informacje, breaking changes, itp.
```

---

**💡 ZASADA:** Aktualizuj ten plik po każdej większej zmianie / feature!
