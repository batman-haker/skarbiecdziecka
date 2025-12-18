# 🎯 Ćwiczenia Praktyczne - Skarbiec Dziecka

Wykonaj te zadania żeby lepiej zrozumieć jak działają smart kontrakty!

---

## 🚀 Zanim zaczniesz

Upewnij się że:
1. ✅ Hardhat node działa w osobnym terminalu: `npx hardhat node`
2. ✅ Masz `.env.local` skonfigurowane
3. ✅ Wiesz jak uruchomić console: `npx hardhat console --network localhost`

---

## 📚 POZIOM 1: Podstawy

### **Ćwiczenie 1.1: Poznaj konta**

Otwórz Hardhat console i wykonaj:

```javascript
// Pobierz listę dostępnych kont
const signers = await ethers.getSigners();

// Wyświetl pierwsze 5 kont
for (let i = 0; i < 5; i++) {
  console.log(`Konto #${i}: ${signers[i].address}`);
}

// Sprawdź saldo pierwszego konta
const balance = await ethers.provider.getBalance(signers[0].address);
console.log("Saldo:", ethers.formatEther(balance), "ETH");
```

**Pytania:**
- Ile masz kont dostępnych?
- Ile ETH ma każde konto?
- Co to znaczy `ethers.formatEther()`?

---

### **Ćwiczenie 1.2: Deploy Factory**

```javascript
// Pobierz factory contract z kodu
const TreasuryFactory = await ethers.getContractFactory("TreasuryFactory");

// Zadeploy
const factory = await TreasuryFactory.deploy();
await factory.waitForDeployment();

// Zapisz adres (będziesz go potrzebował!)
const factoryAddress = await factory.getAddress();
console.log("Factory:", factoryAddress);

// Sprawdź ile jest skarbców (na początku = 0)
const count = await factory.getTotalTreasuries();
console.log("Liczba skarbców:", count.toString());
```

**Pytania:**
- Dlaczego używamy `await`?
- Czym jest `waitForDeployment()`?
- Czy możesz zadeploy jeszcze raz? Co się stanie?

---

### **Ćwiczenie 1.3: Stwórz swój pierwszy skarbiec**

```javascript
// Użyj factory z poprzedniego ćwiczenia
// Jeśli zamknąłeś console, podłącz się ponownie:
// const factory = await ethers.getContractAt("TreasuryFactory", "TWÓJ_ADRES_FACTORY");

const [me] = await ethers.getSigners();

// Stwórz skarbiec dla siebie!
const childName = "Twoje Imię";
const birthDate = Math.floor(Date.now() / 1000) - 25 * 365 * 24 * 60 * 60; // 25 lat temu

const tx = await factory.createTreasury(childName, birthDate);
const receipt = await tx.wait();

// Zobacz swoje skarbce
const myTreasuries = await factory.getUserTreasuries(me.address);
console.log("Moje skarbce:", myTreasuries);
```

**Pytania:**
- Ile skarbców możesz utworzyć? (podpowiedź: nielimitowane!)
- Co zwraca `getUserTreasuries()`?
- Czy ktoś inny widzi Twoje skarbce?

---

## 📚 POZIOM 2: Interakcja z kontraktami

### **Ćwiczenie 2.1: Wpłać ETH**

```javascript
// Podłącz się do swojego skarbca
const treasuryAddress = myTreasuries[0]; // pierwszy skarbiec
const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

// Sprawdź saldo PRZED
const balanceBefore = await treasury.getETHBalance();
console.log("Saldo przed:", ethers.formatEther(balanceBefore), "ETH");

// Wpłać 0.1 ETH
await treasury.depositETH("Testowa wpłata", {
  value: ethers.parseEther("0.1")
});

// Sprawdź saldo PO
const balanceAfter = await treasury.getETHBalance();
console.log("Saldo po:", ethers.formatEther(balanceAfter), "ETH");
```

**Zadania:**
1. Wpłać 0.5 ETH
2. Wpłać 1 ETH
3. Sprawdź ile jest wpłat: `await treasury.getContributionsCount()`

**Pytania:**
- Co to `msg.value`?
- Gdzie te ETH faktycznie są?
- Czy możesz wpłacić 0 ETH? (spróbuj!)

---

### **Ćwiczenie 2.2: Wpłaty z różnych kont**

```javascript
// Pobierz 3 różne konta
const [owner, babcia, wujek] = await ethers.getSigners();

// Babcia wpłaca
await treasury.connect(babcia).depositETH("Babcia Maria", {
  value: ethers.parseEther("0.3")
});

// Wujek wpłaca
await treasury.connect(wujek).depositETH("Wujek Jan", {
  value: ethers.parseEther("0.7")
});

// Zobacz wszystkie wpłaty
const count = await treasury.getContributionsCount();
console.log("Liczba wpłat:", count.toString());

// Wyświetl szczegóły każdej wpłaty
for (let i = 0; i < count; i++) {
  const c = await treasury.getContribution(i);
  console.log(`\nWpłata #${i + 1}:`);
  console.log("  Kto:", c.contributorName);
  console.log("  Ile:", ethers.formatEther(c.amount), "ETH");
  console.log("  Kiedy:", new Date(Number(c.timestamp) * 1000).toLocaleString());
}
```

**Pytania:**
- Co robi `.connect(babcia)`?
- Czy babcia widzi swoje wpłaty? (hint: tak, wszystko publiczne!)
- Ile w sumie jest ETH w skarbcu?

---

### **Ćwiczenie 2.3: Wypłata (tylko owner!)**

```javascript
// Ty jesteś ownerem (stworzyłeś skarbiec)
const [me] = await ethers.getSigners();

// Sprawdź czy jesteś ownerem
const owner = await treasury.owner();
console.log("Owner:", owner);
console.log("Ja:", me.address);
console.log("Czy jestem ownerem?", owner === me.address);

// Wypłać 0.5 ETH
const withdrawAmount = ethers.parseEther("0.5");
await treasury.withdrawETH(withdrawAmount);

console.log("Wypłacono! Nowe saldo:");
console.log(ethers.formatEther(await treasury.getETHBalance()), "ETH");
```

**Zadania:**
1. Wypłać całe saldo: `await treasury.withdrawAllETH()`
2. Wpłać ponownie trochę ETH
3. Spróbuj wypłacić więcej niż masz (co się stanie?)

---

## 📚 POZIOM 3: Testowanie bezpieczeństwa

### **Ćwiczenie 3.1: Atak - obcy próbuje wypłacić**

```javascript
// Użyj konta które NIE jest ownerem
const [owner, babcia, wujek, OBCY] = await ethers.getSigners();

console.log("Obcy próbuje wypłacić...");

try {
  // To POWINNO failnąć!
  await treasury.connect(OBCY).withdrawETH(ethers.parseEther("0.1"));
  console.log("❌ UPS! Atak się udał! (to źle)");
} catch (error) {
  console.log("✅ ODRZUCONE! Kontrakt chroni środki!");
  console.log("Błąd:", error.message.split('\n')[0]);
}
```

**Pytania:**
- Dlaczego to nie działa?
- Co by się stało gdyby nie było `onlyOwner`?
- Jak możesz sprawdzić kod który to blokuje? (hint: zobacz TreasuryVault.sol)

---

### **Ćwiczenie 3.2: Transfer ownership**

```javascript
// Możesz przekazać skarbiec komuś innemu!
const [owner, nowyOwner] = await ethers.getSigners();

console.log("Obecny owner:", await treasury.owner());

// Przekaż ownership
await treasury.transferOwnership(nowyOwner.address);

console.log("Nowy owner:", await treasury.owner());

// Teraz TYLKO nowyOwner może wypłacać!
// Spróbuj:
try {
  await treasury.connect(owner).withdrawETH(ethers.parseEther("0.1"));
  console.log("❌ Stary owner dalej może wypłacać? (źle!)");
} catch (error) {
  console.log("✅ Stary owner nie może już wypłacać!");
}

// Ale nowy owner może:
await treasury.connect(nowyOwner).withdrawETH(ethers.parseEther("0.1"));
console.log("✅ Nowy owner może wypłacać!");
```

**Use case:**
Rodzic przekazuje skarbiec dziecku gdy dorośnie!

---

### **Ćwiczenie 3.3: Wpłata 0 ETH - co się stanie?**

```javascript
try {
  await treasury.depositETH("Test", { value: 0 });
  console.log("❌ Można wpłacić 0 ETH? (źle!)");
} catch (error) {
  console.log("✅ Nie można wpłacić 0 ETH!");
  console.log("Błąd:", error.message);
}
```

**Pytania:**
- Dlaczego to jest zablokowane?
- Zobacz kod: gdzie jest ten check? (hint: `require(msg.value > 0)`)

---

## 📚 POZIOM 4: Statystyki i analiza

### **Ćwiczenie 4.1: Oblicz całkowitą wartość (TVL)**

```javascript
// Total Value Locked = suma wszystkich ETH w skarbcach

const stats = await factory.getFactoryStats();
console.log("Statystyki platformy:");
console.log("  Liczba skarbców:", stats.totalTreasuries.toString());
console.log("  TVL:", ethers.formatEther(stats.totalValueLocked), "ETH");

// Oblicz średnią wartość na skarbiec
const avgPerTreasury = stats.totalValueLocked / stats.totalTreasuries;
console.log("  Średnia na skarbiec:", ethers.formatEther(avgPerTreasury), "ETH");
```

---

### **Ćwiczenie 4.2: Najwięksi darczyńcy**

```javascript
// Kto wpłacił najwięcej?

const [owner, babcia, wujek, ciocia] = await ethers.getSigners();

// Sprawdź ile każdy wpłacił
const babciaTotal = await treasury.getTotalContributedBy(babcia.address);
const wujekTotal = await treasury.getTotalContributedBy(wujek.address);
const ciociaTotal = await treasury.getTotalContributedBy(ciocia.address);

console.log("Ranking darczyńców:");
console.log("1. Babcia:", ethers.formatEther(babciaTotal), "ETH");
console.log("2. Wujek:", ethers.formatEther(wujekTotal), "ETH");
console.log("3. Ciocia:", ethers.formatEther(ciociaTotal), "ETH");
```

---

### **Ćwiczenie 4.3: Historia wpłat**

```javascript
// Wyświetl pełną historię

const count = await treasury.getContributionsCount();
console.log(`\nHistoria ${count} wpłat:\n`);

let total = 0n;

for (let i = 0; i < count; i++) {
  const c = await treasury.getContribution(i);
  total += c.amount;

  console.log(`${i + 1}. ${c.contributorName}`);
  console.log(`   Kwota: ${ethers.formatEther(c.amount)} ETH`);
  console.log(`   Data: ${new Date(Number(c.timestamp) * 1000).toLocaleDateString('pl-PL')}`);
  console.log(`   Razem do tej pory: ${ethers.formatEther(total)} ETH\n`);
}
```

---

## 📚 POZIOM 5: Zaawansowane

### **Ćwiczenie 5.1: Gas tracking**

```javascript
// Ile kosztuje wpłata?

const balanceBefore = await ethers.provider.getBalance(babcia.address);

const tx = await treasury.connect(babcia).depositETH("Test Gas", {
  value: ethers.parseEther("1.0")
});
const receipt = await tx.wait();

const balanceAfter = await ethers.provider.getBalance(babcia.address);

const gasUsed = receipt.gasUsed;
const gasPrice = receipt.gasPrice;
const gasCost = gasUsed * gasPrice;

console.log("Statystyki transakcji:");
console.log("  Gas used:", gasUsed.toString());
console.log("  Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
console.log("  Koszt gasu:", ethers.formatEther(gasCost), "ETH");
console.log("  Całkowity koszt:", ethers.formatEther(gasCost + ethers.parseEther("1.0")), "ETH");
```

**Pytania:**
- Ile kosztuje wpłata w ETH?
- Ile to byłoby w PLN? (zakładając 1 ETH = 10,000 PLN)
- Czy to drogo czy tanio?

---

### **Ćwiczenie 5.2: Event listening**

```javascript
// Nasłuchuj na wszystkie wpłaty

console.log("Nasłuchuję na wpłaty... (zrób wpłatę w innym terminalu)\n");

treasury.on("Deposited", (contributor, amount, token, name) => {
  console.log("🎉 NOWA WPŁATA!");
  console.log("  Od:", name);
  console.log("  Kwota:", ethers.formatEther(amount), "ETH");
  console.log("  Adres:", contributor);
  console.log("");
});

// Teraz w innym terminalu uruchom:
// await treasury.connect(babcia).depositETH("Test Event", { value: ethers.parseEther("0.1") });
```

---

### **Ćwiczenie 5.3: Batch operations**

```javascript
// Wiele operacji naraz

const [owner, p1, p2, p3, p4, p5] = await ethers.getSigners();

console.log("5 osób wpłaca jednocześnie...\n");

// Przygotuj wszystkie transakcje
const promises = [
  treasury.connect(p1).depositETH("Person 1", { value: ethers.parseEther("0.1") }),
  treasury.connect(p2).depositETH("Person 2", { value: ethers.parseEther("0.2") }),
  treasury.connect(p3).depositETH("Person 3", { value: ethers.parseEther("0.3") }),
  treasury.connect(p4).depositETH("Person 4", { value: ethers.parseEther("0.4") }),
  treasury.connect(p5).depositETH("Person 5", { value: ethers.parseEther("0.5") }),
];

// Wyślij wszystkie naraz i czekaj
await Promise.all(promises);

console.log("✅ Wszystkie 5 wpłat zakończone!");
console.log("Nowe saldo:", ethers.formatEther(await treasury.getETHBalance()), "ETH");
```

---

## 🏆 CHALLENGE: Mini Projekt

Stwórz skrypt który:

1. ✅ Tworzy 3 skarbce (dla różnych dzieci)
2. ✅ Symuluje 10 losowych wpłat (różne kwoty, różni ludzie)
3. ✅ Wyświetla ranking skarbców (który ma najwięcej)
4. ✅ Wyświetla ranking darczyńców (kto wpłacił najwięcej w sumie)
5. ✅ Oblicza średnią wpłatę
6. ✅ Pokazuje która rodzina/dziecko dostało najwięcej wsparcia

**Podpowiedź:**
Zacznij od tego:

```javascript
async function challenge() {
  // Deploy factory
  const factory = await (await ethers.getContractFactory("TreasuryFactory")).deploy();
  await factory.waitForDeployment();

  // Stwórz 3 skarbce
  const children = ["Zosia", "Janek", "Ania"];
  const treasuries = [];

  for (const child of children) {
    // ... stwórz skarbiec
  }

  // TODO: reszta zadania!
}

challenge();
```

---

## 🎯 Podsumowanie

Po ukończeniu tych ćwiczeń powinieneś umieć:

✅ Deployować kontrakty
✅ Tworzyć skarbce
✅ Wpłacać i wypłacać ETH
✅ Sprawdzać stan skarbca
✅ Testować bezpieczeństwo
✅ Analizować dane z blockchain
✅ Nasłuchiwać na eventy
✅ Mierzyć koszty gasu

**Gratulacje! Jesteś teraz Blockchain Developer! 🎉**

---

## 📞 Utknąłeś?

- Przeczytaj NAUKA.md
- Uruchom demo: `npx hardhat run scripts/demo.js --network localhost`
- Zobacz przykłady w testach: `test/TreasuryVault.test.ts`
- Pytaj! 😊

**Powodzenia!** 🚀
