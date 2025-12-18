// 🎓 DEMO: Jak działają smart kontrakty Skarbiec Dziecka
const hre = require("hardhat");

async function demo() {
  console.log("\n" + "=".repeat(60));
  console.log("🎓 LEKCJA: Smart Kontrakty Skarbiec Dziecka");
  console.log("=".repeat(60) + "\n");

  // ============================================
  // KROK 1: Pobierz konta (użytkownicy)
  // ============================================
  console.log("📝 KROK 1: Pobieramy konta testowe\n");

  const [mama, babcia, wujek, ciocia, obcy] = await hre.ethers.getSigners();

  console.log("👤 Mama (rodzic - owner):", mama.address);
  console.log("👵 Babcia (contributor):", babcia.address);
  console.log("👨 Wujek (contributor):", wujek.address);
  console.log("👩 Ciocia (contributor):", ciocia.address);
  console.log("🦹 Obcy (attacker):", obcy.address);

  console.log("\n💰 Każde konto ma:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(mama.address)), "ETH");

  await pause();

  // ============================================
  // KROK 2: Deploy Factory
  // ============================================
  console.log("\n📝 KROK 2: Deployujemy TreasuryFactory\n");
  console.log("Factory to 'fabryka' która tworzy nowe skarbce dla dzieci.");
  console.log("Dzięki temu każdy rodzic może łatwo utworzyć skarbiec.\n");

  const TreasuryFactory = await hre.ethers.getContractFactory("TreasuryFactory");
  const factory = await TreasuryFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory zdeployowane na:", factoryAddress);

  await pause();

  // ============================================
  // KROK 3: Mama tworzy skarbiec dla córki
  // ============================================
  console.log("\n📝 KROK 3: Mama tworzy skarbiec dla Zosi (3 lata)\n");

  const childName = "Zosia Kowalska";
  const birthDate = Math.floor(Date.now() / 1000) - 3 * 365 * 24 * 60 * 60; // 3 lata temu

  console.log("Mama wywołuje: factory.createTreasury('Zosia Kowalska', birthDate)");

  const tx = await factory.connect(mama).createTreasury(childName, birthDate);
  const receipt = await tx.wait();

  // Pobierz adres skarbca z eventu
  const event = receipt.logs.find((log) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "TreasuryCreated";
    } catch {
      return false;
    }
  });

  const treasuryAddress = factory.interface.parseLog(event).args[0];
  console.log("\n✅ Skarbiec utworzony na:", treasuryAddress);
  console.log("   Ten adres jest unikalny i będzie działał zawsze!");

  await pause();

  // ============================================
  // KROK 4: Sprawdź szczegóły skarbca
  // ============================================
  console.log("\n📝 KROK 4: Sprawdzamy szczegóły skarbca\n");

  const treasury = await hre.ethers.getContractAt("TreasuryVault", treasuryAddress);

  console.log("📊 Informacje o skarbcu:");
  console.log("   Dziecko:", await treasury.childName());
  console.log("   Owner (mama):", await treasury.owner());
  console.log("   Saldo ETH:", hre.ethers.formatEther(await treasury.getETHBalance()), "ETH");
  console.log("   Liczba wpłat:", (await treasury.getContributionsCount()).toString());

  await pause();

  // ============================================
  // KROK 5: Babcia wpłaca na urodziny
  // ============================================
  console.log("\n📝 KROK 5: Babcia wpłaca 0.5 ETH na urodziny 🎂\n");

  console.log("👵 Babcia wywołuje:");
  console.log("   treasury.depositETH('Babcia Anna', { value: 0.5 ETH })\n");

  const deposit1 = await treasury.connect(babcia).depositETH("Babcia Anna", {
    value: hre.ethers.parseEther("0.5")
  });
  await deposit1.wait();

  console.log("✅ Wpłata zaakceptowana!");
  console.log("   Nowe saldo:", hre.ethers.formatEther(await treasury.getETHBalance()), "ETH");
  console.log("   Liczba wpłat:", (await treasury.getContributionsCount()).toString());

  await pause();

  // ============================================
  // KROK 6: Wujek i Ciocia też wpłacają
  // ============================================
  console.log("\n📝 KROK 6: Wujek i Ciocia też wpłacają na Boże Narodzenie 🎄\n");

  console.log("👨 Wujek wpłaca 1 ETH...");
  await treasury.connect(wujek).depositETH("Wujek Tomasz", {
    value: hre.ethers.parseEther("1.0")
  });

  console.log("👩 Ciocia wpłaca 0.75 ETH...");
  await treasury.connect(ciocia).depositETH("Ciocia Ewa", {
    value: hre.ethers.parseEther("0.75")
  });

  console.log("\n✅ Obie wpłaty zaakceptowane!");
  console.log("   Nowe saldo:", hre.ethers.formatEther(await treasury.getETHBalance()), "ETH");
  console.log("   Liczba wpłat:", (await treasury.getContributionsCount()).toString());

  await pause();

  // ============================================
  // KROK 7: Zobacz wszystkie wpłaty
  // ============================================
  console.log("\n📝 KROK 7: Zobacz listę wszystkich wpłat\n");

  const count = await treasury.getContributionsCount();
  console.log("📋 Historia wpłat:");

  for (let i = 0; i < count; i++) {
    const contribution = await treasury.getContribution(i);
    console.log(`\n   Wpłata #${i + 1}:`);
    console.log(`   👤 Od: ${contribution.contributorName}`);
    console.log(`   💰 Kwota: ${hre.ethers.formatEther(contribution.amount)} ETH`);
    console.log(`   📅 Data: ${new Date(Number(contribution.timestamp) * 1000).toLocaleString('pl-PL')}`);
  }

  await pause();

  // ============================================
  // KROK 8: Mama wypłaca część (np. na studia)
  // ============================================
  console.log("\n📝 KROK 8: 18 lat później... Zosia idzie na studia!\n");
  console.log("Mama (owner) może wypłacić środki dla Zosi.\n");

  const withdrawAmount = hre.ethers.parseEther("1.0");
  console.log("👤 Mama wypłaca:", hre.ethers.formatEther(withdrawAmount), "ETH");

  const balanceBefore = await hre.ethers.provider.getBalance(mama.address);

  const withdrawTx = await treasury.connect(mama).withdrawETH(withdrawAmount);
  await withdrawTx.wait();

  const balanceAfter = await hre.ethers.provider.getBalance(mama.address);

  console.log("\n✅ Wypłata udana!");
  console.log("   Saldo skarbca:", hre.ethers.formatEther(await treasury.getETHBalance()), "ETH");
  console.log("   Mama otrzymała:", hre.ethers.formatEther(balanceAfter - balanceBefore + withdrawAmount), "ETH (minus gas)");

  await pause();

  // ============================================
  // KROK 9: Obcy próbuje ukraść (FAIL!)
  // ============================================
  console.log("\n📝 KROK 9: Co jeśli ktoś obcy próbuje wypłacić? 🔒\n");
  console.log("🦹 Obcy próbuje wypłacić 0.1 ETH...\n");

  try {
    await treasury.connect(obcy).withdrawETH(hre.ethers.parseEther("0.1"));
    console.log("❌ To nie powinno się udać!");
  } catch (error) {
    console.log("✅ ODRZUCONE! Smart kontrakt chronił środki!");
    console.log("   Błąd:", error.message.split('\n')[0]);
    console.log("\n   💡 Tylko owner (mama) może wypłacać środki!");
  }

  await pause();

  // ============================================
  // KROK 10: Statystyki platformy
  // ============================================
  console.log("\n📝 KROK 10: Statystyki całej platformy\n");

  const stats = await factory.getFactoryStats();
  console.log("📊 Platforma Skarbiec Dziecka:");
  console.log("   Utworzonych skarbców:", stats.totalTreasuries.toString());
  console.log("   Całkowita wartość (TVL):", hre.ethers.formatEther(stats.totalValueLocked), "ETH");

  // Utwórz jeszcze jeden skarbiec dla demonstracji
  console.log("\nTworzę jeszcze jeden skarbiec dla 'Janek Nowak'...");
  await factory.connect(wujek).createTreasury("Janek Nowak", birthDate);

  const stats2 = await factory.getFactoryStats();
  console.log("\n📊 Po utworzeniu drugiego skarbca:");
  console.log("   Utworzonych skarbców:", stats2.totalTreasuries.toString());

  await pause();

  // ============================================
  // PODSUMOWANIE
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 KONIEC LEKCJI - CO SIĘ NAUCZYŁEŚ:");
  console.log("=".repeat(60));
  console.log(`
✅ Factory tworzy nowe skarbce dla dzieci
✅ Każdy może wpłacić (depositETH)
✅ Tylko owner może wypłacić (withdrawETH)
✅ Wszystkie wpłaty są zapisane na blockchainie
✅ Smart kontrakt chroni środki (access control)
✅ Możesz sprawdzić historię wszystkich wpłat
✅ Dane są publiczne i nie można ich zmienić

🔐 BEZPIECZEŃSTWO:
- Mama ma klucz prywatny = kontroluje skarbiec
- Nikt inny nie może wypłacić
- Blockchain gwarantuje niezmienność
- OpenZeppelin (audited) chroni przed atakami

💡 W PRAWDZIWYM ŚWIECIE:
- ETH zamieniasz na WBTC/USDC (przez Ramp Network)
- Wartość może rosnąć przez lata
- Rodzice wypłacają gdy dziecko dorośnie
- Frontend (Week 3) ułatwi to wszystko
  `);

  console.log("\n🎓 Gratulacje! Teraz rozumiesz jak działają Twoje smart kontrakty!\n");
}

async function pause() {
  console.log("\n⏸️  (Naciśnij Enter aby kontynuować...)");
  // W rzeczywistości nie czekamy na input w skrypcie, ale symulujemy pauzę
  await new Promise(resolve => setTimeout(resolve, 2000));
}

demo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
