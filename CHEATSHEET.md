# 📝 Ściągawka - Najważniejsze Komendy

Szybki przegląd wszystkich ważnych komend!

---

## 🚀 Uruchamianie

```bash
# Start lokalnego blockchain
npx hardhat node
# (zostaw to w osobnym terminalu)

# Kompilacja
npm run compile

# Testy
npm run test:contracts

# Demo
npx hardhat run scripts/demo.js --network localhost

# Deploy (prosty)
npx hardhat run scripts/deploy-simple.js --network localhost

# Console
npx hardhat console --network localhost
```

---

## 💻 W Hardhat Console

### **Setup**
```javascript
// Pobierz konta
const [owner, user1, user2] = await ethers.getSigners();

// Deploy factory
const Factory = await ethers.getContractFactory("TreasuryFactory");
const factory = await Factory.deploy();
await factory.waitForDeployment();
const factoryAddr = await factory.getAddress();

// Połącz z istniejącym factory
const factory = await ethers.getContractAt("TreasuryFactory", "ADRES");
```

---

### **Factory - Tworzenie skarbców**
```javascript
// Stwórz skarbiec
await factory.createTreasury("Zosia Kowalska", 1609459200);

// Moje skarbce
const myTreasuries = await factory.getUserTreasuries(owner.address);

// Wszystkie skarbce
const all = await factory.getAllTreasuries();

// Liczba skarbców
const count = await factory.getTotalTreasuries();

// Statystyki
const stats = await factory.getFactoryStats();
console.log("Skarbce:", stats.totalTreasuries.toString());
console.log("TVL:", ethers.formatEther(stats.totalValueLocked), "ETH");
```

---

### **Treasury - Operacje na skarbcu**
```javascript
// Połącz ze skarbcem
const treasury = await ethers.getContractAt("TreasuryVault", "ADRES_SKARBCA");

// === WPŁATY (każdy może) ===
await treasury.depositETH("Babcia Anna", {
  value: ethers.parseEther("0.5")
});

// Wpłata z innego konta
await treasury.connect(user1).depositETH("Wujek Tomasz", {
  value: ethers.parseEther("1.0")
});

// === WYPŁATY (tylko owner!) ===
await treasury.withdrawETH(ethers.parseEther("0.5"));
await treasury.withdrawAllETH();

// === SPRAWDZANIE ===
// Saldo
const balance = await treasury.getETHBalance();
console.log("Saldo:", ethers.formatEther(balance), "ETH");

// Owner
console.log("Owner:", await treasury.owner());

// Dziecko
console.log("Dziecko:", await treasury.childName());

// Liczba wpłat
const count = await treasury.getContributionsCount();
console.log("Wpłaty:", count.toString());

// Szczegóły wpłaty
const c = await treasury.getContribution(0); // pierwsza wpłata
console.log("Kto:", c.contributorName);
console.log("Ile:", ethers.formatEther(c.amount), "ETH");
console.log("Kiedy:", new Date(Number(c.timestamp) * 1000));

// Wszystkie wpłaty
const all = await treasury.getAllContributions();

// Ile wpłacił konkretny użytkownik
const total = await treasury.getTotalContributedBy(user1.address);
console.log("User1 wpłacił:", ethers.formatEther(total), "ETH");
```

---

## 🔢 Konwersje ETH

```javascript
// PLN/wei → ETH (czytelne)
ethers.formatEther(amount)
// Przykład: "1.5" ETH

// ETH (string) → wei (BigInt)
ethers.parseEther("1.0")
// Przykład: 1000000000000000000n

// Gwei → ETH
ethers.formatUnits(gasPrice, "gwei")

// Wei (mała jednostka)
1 ETH = 1,000,000,000,000,000,000 wei (10^18)
1 gwei = 1,000,000,000 wei (10^9)
```

---

## 👥 Konta

```javascript
// Wszystkie konta
const signers = await ethers.getSigners();

// Pierwsze konto
const [me] = await ethers.getSigners();

// Wiele kont
const [owner, user1, user2, user3] = await ethers.getSigners();

// Adres konta
me.address

// Saldo konta
const balance = await ethers.provider.getBalance(me.address);
console.log(ethers.formatEther(balance), "ETH");

// Użyj innego konta
await contract.connect(user1).someFunction();
```

---

## 📊 Transakcje

```javascript
// Wyślij transakcję
const tx = await contract.someFunction();

// Czekaj na potwierdzenie
const receipt = await tx.wait();

// Gas użyty
console.log("Gas:", receipt.gasUsed.toString());

// Hash transakcji
console.log("TX hash:", receipt.hash);

// Blok
console.log("Block:", receipt.blockNumber);
```

---

## 🎯 Eventy

```javascript
// Nasłuchuj na event
treasury.on("Deposited", (contributor, amount, token, name) => {
  console.log(`${name} wpłacił ${ethers.formatEther(amount)} ETH`);
});

// Przeszłe eventy
const filter = treasury.filters.Deposited();
const events = await treasury.queryFilter(filter);

for (const event of events) {
  console.log(event.args);
}
```

---

## 🔧 Debugging

```javascript
// Sprawdź typ kontraktu
console.log(await treasury.childName()); // jeśli działa = treasury OK

// Czy adres to kontrakt?
const code = await ethers.provider.getCode(address);
console.log(code === "0x" ? "EOA (konto)" : "Kontrakt");

// Aktualna data (Unix timestamp)
const now = Math.floor(Date.now() / 1000);

// Convert timestamp → data
const date = new Date(timestamp * 1000);
console.log(date.toLocaleString('pl-PL'));
```

---

## ⚡ Pomocne Skróty

```javascript
// Formatowanie
const fmt = (wei) => ethers.formatEther(wei) + " ETH";
console.log(fmt(await treasury.getETHBalance()));

// Pętla przez wszystkie wpłaty
const count = await treasury.getContributionsCount();
for (let i = 0; i < count; i++) {
  const c = await treasury.getContribution(i);
  console.log(`${c.contributorName}: ${fmt(c.amount)}`);
}

// Promise.all dla wielu wywołań naraz
const [bal, count, owner] = await Promise.all([
  treasury.getETHBalance(),
  treasury.getContributionsCount(),
  treasury.owner()
]);
```

---

## 🚨 Częste Błędy

```javascript
// ❌ Zapomnienie await
const balance = treasury.getETHBalance(); // WRONG! To jest Promise
const balance = await treasury.getETHBalance(); // ✅ GOOD

// ❌ Użycie zwykłego number zamiast BigInt
await treasury.depositETH("Test", { value: 1000000 }); // TOO SMALL!
await treasury.depositETH("Test", { value: ethers.parseEther("1.0") }); // ✅

// ❌ Zapomnienie connect()
await treasury.depositETH(...); // jako pierwszy user
await treasury.connect(user2).depositETH(...); // ✅ jako user2

// ❌ Próba operacji na wrong network
// Sprawdź czy hardhat node działa!
// Sprawdź czy używasz --network localhost
```

---

## 📁 Pliki Projektu

```
Dokumentacja:
├── README.md              - Overview
├── QUICKSTART.md          - Quick start
├── SMART_CONTRACTS_GUIDE.md - Pełny guide
├── NAUKA.md              - Teoria (ten dokument!)
├── CWICZENIA.md          - Praktyka
└── CHEATSHEET.md         - Ściąga (ten plik)

Kody:
├── contracts/            - Smart kontrakty (.sol)
├── test/                - Testy (.test.ts)
├── scripts/             - Skrypty (demo, deploy)
└── app/                 - Frontend (Week 3+)

Generowane:
├── artifacts/           - Skompilowane kontrakty
├── cache/              - Cache Hardhat
├── typechain-types/    - TypeScript typy
└── node_modules/       - Zależności
```

---

## 🎯 Quick Reference - Addresses

Zapisz sobie adresy po deploymencie!

```
Factory: 0x_____________________
Treasury #1: 0x_____________________
Treasury #2: 0x_____________________

Konta (local):
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
User1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
User2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

---

## 🔗 Linki

**Dokumentacja:**
- Hardhat: https://hardhat.org/docs
- Ethers.js: https://docs.ethers.org/
- OpenZeppelin: https://docs.openzeppelin.com/
- Solidity: https://docs.soliditylang.org/

**Nauka:**
- CryptoZombies: https://cryptozombies.io/
- Solidity by Example: https://solidity-by-example.org/
- Ethereum.org: https://ethereum.org/pl/developers/

**Narzędzia:**
- Remix IDE: https://remix.ethereum.org/
- Base Docs: https://docs.base.org/

---

**Drukuj i miej pod ręką! 📄**

_Wersja: 1.0 | Data: 2025-12-18_
