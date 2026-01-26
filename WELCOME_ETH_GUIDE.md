# 🎁 Welcome ETH - Przewodnik Krok Po Kroku

## 📖 Co to jest Welcome ETH?

**Welcome ETH** to innowacyjny system "gas sponsorship" w Skarbiec Dziecka, który automatycznie wysyła małą ilość ETH (0.001 ETH) do nowych użytkowników, aby mogli oni od razu tworzyć skarbce bez konieczności kupowania kryptowalut.

### 💡 Jak to działa?

1. **Użytkownik loguje się** przez Google OAuth
2. **Tworzy Privy wallet** (embedded, bez MetaMask!)
3. **System automatycznie wykrywa** nowy wallet
4. **Backend wysyła 0.001 ETH** z relay wallet
5. **Użytkownik może od razu** tworzyć skarbce!

---

## 🏗️ Architektura Systemu

```
┌─────────────────┐
│  User Login     │
│  (Google OAuth) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Privy Wallet   │
│  Created        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  /api/sync-wallet                   │
│  • Zapisuje wallet_address w DB    │
│  • Sprawdza czy to nowy wallet      │
│  • Jeśli TAK → sendWelcomeETH()    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  lib/wallet/relay.ts                │
│  sendWelcomeETH()                   │
│  • Sprawdza czy user ma już ETH     │
│  • Jeśli NIE → wysyła 0.001 ETH     │
│  • Relay wallet płaci za gas        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  User otrzymuje │
│  0.001 ETH      │
│  ✅ GOTOWE!     │
└─────────────────┘
```

---

## 🔧 Konfiguracja - Sprawdź Te Kroki!

### ✅ **Krok 1: Relay Wallet Musi Być Zasilony**

```bash
# Sprawdź balance relay wallet
npm run check-relay-balance
```

**Oczekiwany output:**
```
💰 BALANCE: 0.008988... ETH
✅ STATUS: GOOD - Wallet has sufficient balance
💡 Can create ~ 8 treasuries
```

**Jeśli balance < 0.01 ETH:**
1. Idź na: https://www.alchemy.com/faucets/base-sepolia
2. Wklej adres relay wallet: `0xb438739bA33f0f71f4a5f954A4777BbeC8a19788`
3. Wyślij **0.1 ETH** (wystarcza na ~100 użytkowników!)
4. Poczekaj ~30 sekund
5. Sprawdź ponownie: `npm run check-relay-balance`

---

### ✅ **Krok 2: Upewnij Się, Że .env.local Jest Poprawnie Skonfigurowany**

```bash
# .env.local MUSI zawierać:
RELAY_WALLET_PRIVATE_KEY=0x...twój-klucz...
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532

# Dla Privy:
NEXT_PUBLIC_PRIVY_APP_ID=...
PRIVY_APP_SECRET=...

# Dla Supabase:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Gdzie znaleźć Relay Wallet Private Key?**
- Jeśli go nie masz: `npm run generate-relay-wallet`
- Skopiuj klucz i dodaj do `.env.local`
- **NIGDY nie commituj .env.local do git!**

---

### ✅ **Krok 3: Przetestuj Welcome ETH Lokalnie**

```bash
# Test 1: Sprawdź czy relay wallet może wysyłać ETH
npm run test-welcome-eth
```

**Oczekiwany output:**
```
🎉 TEST COMPLETED SUCCESSFULLY!
✅ Relay wallet can send welcome ETH
✅ New users will receive 0.001 ETH on first login
```

**Jeśli test fails:**
- Sprawdź czy relay wallet ma ETH (Krok 1)
- Sprawdź czy `.env.local` ma poprawny `RELAY_WALLET_PRIVATE_KEY`
- Sprawdź czy RPC URL działa: `https://sepolia.base.org`

---

## 🚀 Jak Przetestować Cały Flow End-to-End?

### **Test Pełnego Przepływu:**

```bash
# 1. Uruchom aplikację
npm run dev

# 2. Otwórz w przeglądarce
# http://localhost:3000
```

### **Kroki w aplikacji:**

**A) Zaloguj się**
1. Kliknij "Login with Google"
2. Wybierz swoje konto Google
3. Przekierowanie do dashboardu

**B) Stwórz Privy Wallet**
1. Idź na `/privy-demo` (lub kliknij "Create Privy Wallet")
2. Kliknij "Create Embedded Wallet"
3. ✅ Wallet zostanie utworzony (adres pojawi się na ekranie)

**C) Sprawdź czy otrzymałeś Welcome ETH**
1. Otwórz konsolę developera (F12)
2. Sprawdź logi: `[Dashboard] Wallet synced successfully`
3. Powinieneś zobaczyć: `🎉 Witamy! Otrzymałeś 0.001 ETH na start!`

**D) Utwórz Skarbiec**
1. Wróć na `/dashboard`
2. Kliknij "⚡ UTWÓRZ_PIERWSZY_SKARBIEC"
3. Wpisz imię dziecka: np. "Zosia"
4. Wybierz datę urodzenia
5. Kliknij "⚡ UTWÓRZ"
6. ✅ Skarbiec zostanie utworzony na blockchain!

---

## 🔍 Debugging - Co Sprawdzić Gdy Nie Działa?

### **Problem: "Relay wallet has insufficient balance"**

**Przyczyna:** Relay wallet ma 0 ETH lub < 0.001 ETH

**Rozwiązanie:**
```bash
# 1. Sprawdź balance
npm run check-relay-balance

# 2. Jeśli < 0.01 ETH:
# Zasilij z faucet (patrz Krok 1 powyżej)
```

---

### **Problem: "Welcome ETH not sent" w konsoli**

**Możliwe przyczyny:**

1. **User już ma ETH na walletcie**
   - System sprawdza czy balance > 0
   - Jeśli TAK, pomija wysyłanie (aby nie wysyłać wielokrotnie)

2. **Relay wallet ma 0 ETH**
   - Zasilić relay wallet (patrz wyżej)

3. **Błąd w RPC URL**
   - Sprawdź czy `NEXT_PUBLIC_BASE_RPC_URL` jest poprawny
   - Domyślnie: `https://sepolia.base.org`

**Jak debugować:**
```bash
# Sprawdź logi w terminalu gdzie działa `npm run dev`
# Szukaj:
[API] New wallet detected! Sending welcome ETH...
[Relay] Sending welcome ETH...
[Relay] Welcome ETH transaction sent: 0x...
```

---

### **Problem: "Cannot find RELAY_WALLET_PRIVATE_KEY"**

**Rozwiązanie:**
```bash
# 1. Sprawdź czy plik .env.local istnieje
ls .env.local

# 2. Jeśli nie istnieje:
cp .env.example .env.local

# 3. Wygeneruj nowy relay wallet
npm run generate-relay-wallet

# 4. Skopiuj private key do .env.local
# RELAY_WALLET_PRIVATE_KEY=0x...
```

---

## 📊 Monitorowanie Relay Wallet

### **Ile kosztuje Welcome ETH?**

Na **Base Sepolia testnet:**
- Welcome ETH: **0.001 ETH** (gratis, testnet)
- Gas fee: **~0.00000003 ETH** (~21,000 gas × 1.2 gwei)
- **Koszt całkowity: ~0.001 ETH per użytkownik**

**Z 0.1 ETH możesz wysłać Welcome ETH dla ~100 użytkowników!**

### **Jak często doładowywać Relay Wallet?**

```bash
# Sprawdzaj regularnie:
npm run check-relay-balance

# Gdy balance < 0.01 ETH:
# → Doładuj z faucet (patrz Krok 1)
```

**Pro tip:** Możesz ustawić sobie alert:
- Sprawdzaj co tydzień
- Lub dodaj monitoring przez `/api/relay-status`

---

## 🔐 Bezpieczeństwo

### **⚠️ WAŻNE - Relay Wallet Security**

1. **Private key NIGDY w git**
   - Trzymaj tylko w `.env.local`
   - `.env.local` jest w `.gitignore` ✅

2. **Używaj tylko na testnet (Base Sepolia)**
   - Welcome ETH = gratis testowy ETH
   - Na mainnet trzeba innej strategii!

3. **Relay wallet powinien mieć TYLKO tyle ETH ile potrzeba**
   - Nie trzymaj tam 1 ETH
   - Wystarcza 0.1 ETH na 100 użytkowników

4. **Rate limiting (TODO - przyszła implementacja)**
   - Zabezpiecz `/api/sync-wallet` przed abuse
   - Max 1 welcome ETH per user
   - Sprawdzanie duplikatów po adresie

---

## 🎯 Podsumowanie

### **✅ System działa jeśli:**

1. ✅ Relay wallet ma ETH (sprawdź: `npm run check-relay-balance`)
2. ✅ `.env.local` ma `RELAY_WALLET_PRIVATE_KEY`
3. ✅ Test przechodzi: `npm run test-welcome-eth`
4. ✅ Nowy user dostaje 0.001 ETH po stworzeniu Privy wallet
5. ✅ User może utworzyć skarbiec bez kupowania crypto!

### **🚀 Następne Kroki**

**Dla nowych użytkowników:**
1. `npm run dev`
2. Login → Create Privy Wallet → Otrzymujesz 0.001 ETH → Create Treasury!

**Dla adminów:**
- Monitoruj relay wallet: `npm run check-relay-balance`
- Doładowuj gdy < 0.01 ETH
- Sprawdzaj logi w terminalu

**Dla developerów:**
- Kod w: [lib/wallet/relay.ts](lib/wallet/relay.ts)
- API: [app/api/sync-wallet/route.ts](app/api/sync-wallet/route.ts)
- Frontend: [app/(dashboard)/dashboard/page.tsx](app/(dashboard)/dashboard/page.tsx)

---

## 📚 Dodatkowe Zasoby

- **Base Sepolia Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Basescan (Testnet):** https://sepolia.basescan.org/
- **Relay Wallet Address:** `0xb438739bA33f0f71f4a5f954A4777BbeC8a19788`
- **Base Sepolia RPC:** `https://sepolia.base.org`
- **Chain ID:** `84532`

---

**Pytania? Problemy?** Sprawdź logi w terminalu lub otwórz issue! 🚀
