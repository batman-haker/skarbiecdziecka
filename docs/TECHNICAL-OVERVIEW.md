# Skarbiec Dziecka - Proces Myslowy & Architektura Techniczna

## Spis tresci
1. [Idea projektu](#idea-projektu)
2. [Warstwy aplikacji i jezyki programowania](#warstwy-aplikacji)
3. [Smart kontrakty (Solidity)](#smart-kontrakty)
4. [Frontend (TypeScript + React)](#frontend)
5. [Backend / API (Next.js)](#backend)
6. [Baza danych (Supabase / PostgreSQL)](#baza-danych)
7. [Blockchain - siec Base L2](#blockchain)
8. [Proces wdrazania smart kontraktow](#proces-wdrazania)
9. [Portfele i autentykacja](#portfele)
10. [Bezpieczenstwo](#bezpieczenstwo)
11. [Zmiana sieci L2](#zmiana-sieci)
12. [Pelna lista zaleznosci](#zaleznosci)

---

## 1. Idea projektu <a name="idea-projektu"></a>

Skarbiec Dziecka to platforma Web3, ktora pozwala rodzicom tworzyc cyfrowe "skarbonki" (treasury vaults) dla swoich dzieci na blockchainie. Kazdy skarbiec to osobny smart kontrakt, do ktorego rodzina i przyjaciele moga wplacac srodki (ETH lub tokeny ERC20). Srodki sa bezpiecznie przechowywane na blockchainie i moga byc wyplacone tylko przez wlasciciela po weryfikacji haslem.

**Kluczowe cechy:**
- Uzytkownik nie musi miec portfela krypto - loguje sie przez Google
- Portfel tworzony automatycznie (Privy embedded wallet)
- Gas sponsoring - relay wallet placi za gas, uzytkownik nie musi kupowac krypto
- Kazdy skarbiec = osobny smart kontrakt = pelna transparentnosc
- 2FA dla wyplat: login Google + 4-slowne haslo

---

## 2. Warstwy aplikacji i jezyki programowania <a name="warstwy-aplikacji"></a>

```
+--------------------------------------------------+
|  FRONTEND (TypeScript + React + Next.js)          |
|  Jezyk: TypeScript/TSX                            |
|  Framework: Next.js 14 + React 18                 |
|  Styling: Tailwind CSS 3.4                        |
+--------------------------------------------------+
              |
              v
+--------------------------------------------------+
|  BACKEND / API (Next.js API Routes)               |
|  Jezyk: TypeScript                                |
|  Runtime: Node.js                                 |
|  Framework: Next.js 14 App Router                 |
+--------------------------------------------------+
              |
    +---------+---------+
    v                   v
+------------------+  +---------------------------+
|  BAZA DANYCH     |  |  BLOCKCHAIN (Base L2)     |
|  Supabase        |  |  Smart kontrakty:         |
|  (PostgreSQL)    |  |  Jezyk: Solidity 0.8.20   |
|                  |  |  Framework: Hardhat       |
+------------------+  +---------------------------+
```

### Podsumowanie jezykow:

| Warstwa | Jezyk | Cel |
|---------|-------|-----|
| Smart kontrakty | **Solidity 0.8.20** | Logika skarbcow na blockchainie |
| Frontend | **TypeScript + TSX** | Interfejs uzytkownika |
| Backend API | **TypeScript** | Endpointy REST, logika biznesowa |
| Testy smart kontraktow | **TypeScript** | 56 testow jednostkowych |
| Baza danych | **SQL** | Migracje, zapytania Supabase |
| Konfiguracja | **TypeScript** | Hardhat config, Next.js config |

---

## 3. Smart kontrakty (Solidity) <a name="smart-kontrakty"></a>

### Czym jest Solidity?

Solidity to jezyk programowania stworzony specjalnie do pisania smart kontraktow na Ethereum i kompatybilnych blockchainach (EVM - Ethereum Virtual Machine). Jest podobny skladniowo do JavaScript/C++.

### Nasze kontrakty:

#### TreasuryFactory.sol (223 linie)
Kontrakt "fabryka" - tworzy nowe skarbce:
```solidity
// Solidity - tak wyglada tworzenie skarbca
function createTreasury(string memory childName, uint256 birthDate) external {
    TreasuryVault newVault = new TreasuryVault(childName, birthDate, msg.sender);
    // ... rejestracja skarbca
}
```

**Funkcje:**
- `createTreasury()` - tworzy nowy skarbiec (deploy nowego kontraktu)
- `getUserTreasuries()` - lista skarbcow uzytkownika
- `getTreasuryDetails()` - szczegoly skarbca
- `getFactoryStats()` - statystyki (ile skarbcow lacznie)

#### TreasuryVault.sol (374 linie)
Indywidualny skarbiec dla kazdego dziecka:

**Funkcje:**
- `depositETH()` - wplata ETH
- `depositToken()` - wplata tokenow ERC20
- `withdrawETH()` - wyplata ETH (tylko wlasciciel)
- `withdrawToken()` - wyplata tokenow
- `withdrawAllETH()` - wyplata calego salda
- `transferOwnership()` - przeniesienie wlasnosci

**Zabezpieczenia (OpenZeppelin 5.0.1):**
- `Ownable` - kontrola dostepu (tylko wlasciciel moze wyplacac)
- `ReentrancyGuard` - ochrona przed atakiem reentrancy
- `SafeERC20` - bezpieczne operacje na tokenach

### Jak dziala deploy smart kontraktu?

```
1. Piszesz kod Solidity (.sol)
2. Kompilujesz przez Hardhat -> generuje ABI + bytecode
3. Wysylasz transakcje na blockchain z bytecodem
4. Blockchain przypisuje adres kontraktowi (np. 0x7c038a...)
5. Kontrakt zyje na blockchainie na zawsze
```

---

## 4. Frontend (TypeScript + React) <a name="frontend"></a>

### Stack technologiczny:
- **Next.js 14.2.0** - framework fullstack (SSR + API routes)
- **React 18.3.0** - biblioteka UI
- **TypeScript 5.3** - typowany JavaScript
- **Tailwind CSS 3.4** - utility-first CSS
- **Wagmi 2.5.7** - React hooks do interakcji z Ethereum
- **Viem 2.7.15** - klient Ethereum (alternatywa dla ethers.js)

### Struktura frontendu:
```
app/
  page.tsx              - Landing page (strona glowna)
  layout.tsx            - Layout z providerami
  providers.tsx         - Privy + Wagmi + React Query
  (dashboard)/
    dashboard/page.tsx  - Panel glowny po zalogowaniu
  treasury/
    [address]/page.tsx  - Szczegoly skarbca (dynamiczny routing)
  auth/
    login/page.tsx      - Strona logowania
  api/                  - Endpointy API (backend)
```

### Design:
- Motyw cyberpunk/neon (ciemne tlo, cyan/purple/pink gradienty)
- Font monospace
- Responsywny design (mobile-first)

---

## 5. Backend / API (Next.js) <a name="backend"></a>

Backend jest czescia Next.js (API Routes). Endpointy:

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/treasury/create` | POST | Tworzenie skarbca przez relay wallet |
| `/api/treasury/verify-withdrawal` | POST | Weryfikacja hasla wyplaty |
| `/api/my-treasuries` | GET | Lista skarbcow uzytkownika |
| `/api/sync-wallet` | POST | Synchronizacja portfela + welcome ETH |
| `/api/relay-status` | POST | Status relay wallet |

### Relay Wallet - kluczowy mechanizm

Relay wallet to portfel backendowy, ktory placi za gas w imieniu uzytkownikow:

```
Uzytkownik klika "Utworz skarbiec"
    |
    v
Frontend -> POST /api/treasury/create
    |
    v
Backend: relay wallet wysyla TX na blockchain
    |   (relay placi za gas!)
    v
Smart kontrakt TreasuryFactory.createTreasury()
    |
    v
Nowy TreasuryVault zostaje wdrozony
    |
    v
Wlasnosc przenoszona na portfel uzytkownika
    |
    v
Dane zapisane w Supabase + haslo wyplaty wygenerowane
```

---

## 6. Baza danych (Supabase / PostgreSQL) <a name="baza-danych"></a>

### Czym jest Supabase?
Supabase to open-source'owa alternatywa Firebase. Oferuje:
- Baze danych PostgreSQL (hosted)
- Autentykacje (Google OAuth)
- Row Level Security (RLS)
- Real-time subscriptions
- Storage

### Glowne tabele:

**users** - profil uzytkownika:
- id, email, full_name, wallet_address

**treasuries** - skarbce:
- id, owner_user_id, contract_address, child_name
- child_birth_date, withdrawal_password_hash
- total_eth_balance, total_contributions_count

**notifications** - powiadomienia:
- user_id, type, title, message, metadata

### Bezpieczenstwo bazy:
- Row Level Security (RLS) - uzytkownik widzi tylko swoje dane
- Haslo wyplaty przechowywane jako hash bcrypt (NIE plaintext)

---

## 7. Blockchain - siec Base L2 <a name="blockchain"></a>

### Czym jest Base?

Base to **Layer 2 (L2)** siec Ethereum stworzona przez Coinbase. Dziala "na wierzchu" Ethereum L1 i oferuje:

| Cecha | Ethereum L1 | Base L2 |
|-------|------------|---------|
| Koszt transakcji | $0.30 - $50+ | ~$0.01 |
| Czas bloku | ~12 sekund | ~2 sekundy |
| Bezpieczenstwo | Natywne | Dziedziczone z L1 |
| Kompatybilnosc | EVM | Pelna kompatybilnosc EVM |
| Utrzymanie | Decentralizowane | Coinbase |

### Dlaczego Base?

1. **Tanie transakcje** - tworzenie skarbca kosztuje ~$0.01 vs $5+ na L1
2. **Szybkie potwierdzenia** - 2 sekundy vs 12 sekund
3. **Pelna kompatybilnosc EVM** - ten sam Solidity, te same narzedzia
4. **Coinbase ecosystem** - latwiejsze wejscie fiat-to-crypto
5. **Rosnacy ekosystem** - duzo DeFi, NFT, dAppow
6. **Potencjalna wspolpraca z Ramp Network** - on-ramp/off-ramp

### Nasze sieci:

| Siec | Chain ID | Uzycie | Adres kontraktu |
|------|----------|--------|-----------------|
| Hardhat (local) | 31337 | Development | `0x5FbDB231...` |
| Base Sepolia | 84532 | Testnet | `0x7c038a44...` |
| Base Mainnet | 8453 | Produkcja (przyszlosc) | Do wdrozenia |

---

## 8. Proces wdrazania smart kontraktow <a name="proces-wdrazania"></a>

### Narzedzie: Hardhat

Hardhat to framework do development smart kontraktow. Oferuje:
- Kompilacje Solidity
- Lokalna siec testowa
- Testy jednostkowe
- Skrypty wdrazania
- Weryfikacje na Basescan

### Komendy:

```bash
# 1. Kompilacja kontraktow
npm run compile
# Generuje: artifacts/ (ABI + bytecode) + typechain-types/ (typy TS)

# 2. Uruchomienie testow (56 testow)
npm run test:contracts
# Testy w TypeScript, uzycie Chai + Hardhat matchers

# 3. Deploy na testnet
npm run deploy:testnet
# Wysyla kontrakt na Base Sepolia

# 4. Deploy na mainnet (produkcja)
npm run deploy:mainnet
# Wysyla kontrakt na Base Mainnet
```

### Co sie dzieje podczas deploy:

```
1. Hardhat kompiluje TreasuryFactory.sol
       |
       v
2. Generuje ABI (interfejs) + bytecode (kod maszynowy EVM)
       |
       v
3. Skrypt deploy.ts tworzy transakcje z bytecodem
       |
       v
4. Transakcja wyslana do sieci Base Sepolia (RPC: https://sepolia.base.org)
       |
       v
5. Miner/validator przetwarza transakcje
       |
       v
6. Kontrakt otrzymuje adres (np. 0x7c038a44De3b8AD648856b64f605D82da462230f)
       |
       v
7. Adres zapisany w lib/contracts/addresses.ts
       |
       v
8. Frontend/Backend uzywa ABI + adres do interakcji z kontraktem
```

---

## 9. Portfele i autentykacja <a name="portfele"></a>

### 3 warstwy portfeli:

```
+----------------------------------------+
|  1. Privy Embedded Wallet              |
|  - Tworzone automatycznie              |
|  - Uzytkownik loguje sie Google        |
|  - Prywatny klucz bezpiecznie          |
|    przechowywany przez Privy           |
|  - Zabezpieczone 4-cyfrowym PIN       |
+----------------------------------------+
              |
              v
+----------------------------------------+
|  2. Relay Wallet (backend)             |
|  - Placi za gas w imieniu usera        |
|  - Klucz prywatny w .env              |
|  - Tworzy skarbce i transferuje        |
|    wlasnosc na portfel uzytkownika     |
|  - Wysyla welcome ETH (0.001 ETH)     |
+----------------------------------------+
              |
              v
+----------------------------------------+
|  3. Browser Wallets (opcjonalnie)      |
|  - MetaMask                            |
|  - Inne portfele injected              |
|  - Przez Wagmi hooks                   |
+----------------------------------------+
```

### Flow logowania:

```
Uzytkownik otwiera strone
    |
    v
Klika "Zaloguj przez Google"
    |
    v
Privy: Google OAuth -> tworzy embedded wallet
    |
    v
Supabase: Tworzy profil uzytkownika (auth.users + public.users)
    |
    v
/api/sync-wallet: Zapisuje adres portfela + wysyla 0.001 ETH welcome
    |
    v
Dashboard: Uzytkownik widzi panel z opcja tworzenia skarbca
```

---

## 10. Bezpieczenstwo <a name="bezpieczenstwo"></a>

### Smart kontrakty:
- OpenZeppelin audited libraries (Ownable, ReentrancyGuard, SafeERC20)
- 56 testow jednostkowych
- Tylko wlasciciel moze wyplacac

### Haslo wyplaty (2FA):
- 4-slowne haslo w jezyku polskim (np. "kot-dom-slonce-rower")
- Hash bcrypt (12 rund) przechowywany w bazie
- Haslo pokazywane TYLKO RAZ przy tworzeniu skarbca
- Weryfikacja przed kazda wyplata

### Relay wallet:
- Klucz prywatny tylko w zmiennych srodowiskowych serwera
- Nigdy nie eksponowany na frontend
- Rate limiting w API routes
- Sprawdzanie salda przed kazdym use

### Baza danych:
- Row Level Security (RLS) w Supabase
- Uzytkownik widzi tylko swoje dane
- Service role key tylko po stronie serwera

---

## 11. Zmiana sieci L2 <a name="zmiana-sieci"></a>

### Jak zmienic siec z Base na inna L2?

Poniewaz Base jest w pelni kompatybilna z EVM, smart kontrakty dzialaja na kazdej sieci L2 BEZ ZMIAN w kodzie Solidity. Wystarczy:

### Krok 1: Dodaj siec do hardhat.config.ts
```typescript
// Przyklad: dodanie Optimism
optimism: {
  url: 'https://mainnet.optimism.io',
  chainId: 10,
  accounts: [process.env.PRIVATE_KEY],
},
optimismSepolia: {
  url: 'https://sepolia.optimism.io',
  chainId: 11155420,
  accounts: [process.env.PRIVATE_KEY],
},
```

### Krok 2: Zmien zmienne srodowiskowe (.env.local)
```
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_CHAIN_ID=10
```

### Krok 3: Zaktualizuj konfiguracje Wagmi (lib/wagmi-config.ts)
```typescript
import { optimism } from 'wagmi/chains'
// zamiast baseSepolia
```

### Krok 4: Deploy na nowej sieci
```bash
npx hardhat run scripts/deploy.ts --network optimism
```

### Krok 5: Zaktualizuj adresy kontraktow (lib/contracts/addresses.ts)

### Popularne sieci L2 kompatybilne:

| Siec | Chain ID | Typ | Koszt TX | Uwagi |
|------|----------|-----|----------|-------|
| **Base** | 8453 | Optimistic Rollup | ~$0.01 | Coinbase, duzy ekosystem |
| **Optimism** | 10 | Optimistic Rollup | ~$0.01 | Pioner L2, dojrzaly |
| **Arbitrum** | 42161 | Optimistic Rollup | ~$0.01 | Najpopularniejszy L2 |
| **Polygon zkEVM** | 1101 | ZK Rollup | ~$0.01 | ZK technologia |
| **zkSync Era** | 324 | ZK Rollup | ~$0.01 | ZK, ale wymaga zmian w deploy |
| **Linea** | 59144 | ZK Rollup | ~$0.01 | Consensys (MetaMask) |

### Czy Base jest dobra siecia?

**Zalety Base:**
- Coinbase jako operator - zaufana marka
- Szybko rosnacy ekosystem DeFi/NFT
- Natywna integracja z Coinbase Wallet i exchange
- Coinbase Commerce i on-ramp (potencjal dla Ramp Network)
- Bardzo niskie koszty transakcji
- Aktywna spolecznosc developerow

**Potencjalne ryzyka:**
- Relatywnie mloda siec (2023)
- Coinbase jako jedyny sequencer (centralizacja)
- Mniejszy ekosystem niz Arbitrum/Optimism

**Wniosek:** Base to dobry wybor dla projektu SkarbiecDziecka, szczegolnie z uwagi na potencjalna integracje z Ramp Network (Coinbase ecosystem). Mozna latwo migrowac na inna L2 w przyszlosci.

---

## 12. Pelna lista zaleznosci <a name="zaleznosci"></a>

### Produkcyjne:
| Pakiet | Wersja | Cel |
|--------|--------|-----|
| next | 14.2.0 | Framework fullstack |
| react | 18.3.0 | Biblioteka UI |
| react-dom | 18.3.0 | Rendering DOM |
| typescript | 5.3.3 | System typow |
| @privy-io/react-auth | 3.9.1 | Social login + embedded wallets |
| wagmi | 2.5.7 | React hooks dla Ethereum |
| viem | 2.7.15 | Klient Ethereum |
| @tanstack/react-query | 5.28.0 | Server state management |
| @supabase/supabase-js | 2.89.0 | Klient bazy danych |
| @supabase/ssr | 0.8.0 | Server-side Supabase |
| bcryptjs | 3.0.3 | Hashowanie hasel |
| tailwindcss | 3.4.1 | Framework CSS |
| qrcode | 1.5.3 | Generowanie kodow QR |
| clsx | 2.1.0 | Utility CSS classes |
| ethers | 6.16.0 | Biblioteka Ethereum (relay) |

### Deweloperskie:
| Pakiet | Wersja | Cel |
|--------|--------|-----|
| hardhat | 2.19.5 | Framework smart kontraktow |
| @openzeppelin/contracts | 5.0.1 | Audytowane biblioteki Solidity |
| @nomicfoundation/hardhat-toolbox | 4.0.0 | Narzedzia Hardhat |
| chai | 4.4.1 | Asercje w testach |
| eslint | 8.57.0 | Linting kodu |

---

## Podsumowanie

Skarbiec Dziecka to kompletna aplikacja Web3 lacząca:

1. **Solidity** - smart kontrakty (logika on-chain)
2. **TypeScript** - frontend + backend + testy
3. **Next.js 14** - fullstack framework
4. **Base L2** - tani i szybki blockchain
5. **Supabase** - baza danych + auth
6. **Privy** - embedded wallets + social login
7. **Hardhat** - development smart kontraktow

Architektura pozwala na latwa migracje miedzy sieciami L2 oraz integracje z bramkami platniczymi (Ramp Network) dzieki standardowej kompatybilnosci EVM.
