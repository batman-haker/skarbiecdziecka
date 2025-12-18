// 🎯 DEMO: Heniek tworzy skarbiec dla syna Olafa
const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🎁 HENIEK TWORZY SKARBIEC DLA OLAFA");
  console.log("=".repeat(60) + "\n");

  // Pobierz konta
  const [heniek, babcia, wujek] = await hre.ethers.getSigners();

  console.log("👤 Heniek (tata):", heniek.address);
  console.log("👵 Babcia:", babcia.address);
  console.log("👨 Wujek:", wujek.address);
  console.log("");

  // Połącz z Factory
  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factory = await hre.ethers.getContractAt("TreasuryFactory", factoryAddress);

  console.log("📦 Factory:", factoryAddress);
  console.log("");

  // KROK 1: Heniek tworzy skarbiec dla Olafa (5 lat)
  console.log("━".repeat(60));
  console.log("KROK 1: Heniek tworzy skarbiec dla syna Olafa (5 lat)");
  console.log("━".repeat(60) + "\n");

  const childName = "Olaf";
  const childAge = 5;
  const birthDate = Math.floor(Date.now() / 1000) - childAge * 365 * 24 * 60 * 60;

  console.log("Tworzę skarbiec...");
  const tx = await factory.connect(heniek).createTreasury(childName, birthDate);
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

  console.log("✅ Skarbiec utworzony!");
  console.log(`   Adres: ${treasuryAddress}`);
  console.log(`   Owner: ${heniek.address} (Heniek)`);
  console.log("");

  // Połącz ze skarbcem
  const treasury = await hre.ethers.getContractAt("TreasuryVault", treasuryAddress);

  // KROK 2: Sprawdź szczegóły
  console.log("━".repeat(60));
  console.log("KROK 2: Szczegóły skarbca");
  console.log("━".repeat(60) + "\n");

  console.log("📊 Informacje:");
  console.log(`   Dziecko: ${await treasury.childName()}`);
  console.log(`   Owner: ${await treasury.owner()}`);
  console.log(`   Saldo: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log(`   Wpłaty: ${await treasury.getContributionsCount()}`);
  console.log("");

  // KROK 3: Babcia wpłaca na urodziny
  console.log("━".repeat(60));
  console.log("KROK 3: Babcia wpłaca 0.5 ETH na urodziny 🎂");
  console.log("━".repeat(60) + "\n");

  console.log("👵 Babcia wpłaca 0.5 ETH...");
  await treasury.connect(babcia).depositETH("Babcia Maria", {
    value: hre.ethers.parseEther("0.5")
  });

  console.log("✅ Wpłata zaakceptowana!");
  console.log(`   Nowe saldo: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  // KROK 4: Wujek wpłaca na święta
  console.log("━".repeat(60));
  console.log("KROK 4: Wujek wpłaca 1.0 ETH na Boże Narodzenie 🎄");
  console.log("━".repeat(60) + "\n");

  console.log("👨 Wujek wpłaca 1.0 ETH...");
  await treasury.connect(wujek).depositETH("Wujek Tomasz", {
    value: hre.ethers.parseEther("1.0")
  });

  console.log("✅ Wpłata zaakceptowana!");
  console.log(`   Nowe saldo: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  // KROK 5: Historia wpłat
  console.log("━".repeat(60));
  console.log("KROK 5: Historia wszystkich wpłat");
  console.log("━".repeat(60) + "\n");

  const count = await treasury.getContributionsCount();
  console.log(`📋 Liczba wpłat: ${count}\n`);

  for (let i = 0; i < count; i++) {
    const c = await treasury.getContribution(i);
    console.log(`Wpłata #${i + 1}:`);
    console.log(`  👤 Od: ${c.contributorName}`);
    console.log(`  💰 Kwota: ${hre.ethers.formatEther(c.amount)} ETH`);
    console.log(`  📅 Data: ${new Date(Number(c.timestamp) * 1000).toLocaleString('pl-PL')}`);
    console.log("");
  }

  // KROK 6: Heniek wypłaca część (np. na studia)
  console.log("━".repeat(60));
  console.log("KROK 6: Heniek wypłaca 0.5 ETH (Olaf idzie na studia)");
  console.log("━".repeat(60) + "\n");

  const withdrawAmount = hre.ethers.parseEther("0.5");
  console.log(`👤 Heniek wypłaca ${hre.ethers.formatEther(withdrawAmount)} ETH...`);

  await treasury.connect(heniek).withdrawETH(withdrawAmount);

  console.log("✅ Wypłata udana!");
  console.log(`   Pozostało w skarbcu: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  // PODSUMOWANIE
  console.log("━".repeat(60));
  console.log("🎉 PODSUMOWANIE");
  console.log("━".repeat(60) + "\n");

  console.log("✅ Heniek utworzył skarbiec dla Olafa");
  console.log("✅ Babcia wpłaciła 0.5 ETH");
  console.log("✅ Wujek wpłacił 1.0 ETH");
  console.log("✅ Heniek wypłacił 0.5 ETH");
  console.log(`✅ Pozostaje: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  console.log("📍 ADRESY (zapisz sobie!):");
  console.log(`   Factory: ${factoryAddress}`);
  console.log(`   Skarbiec Olafa: ${treasuryAddress}`);
  console.log("");

  console.log("💡 CO MOŻESZ TERAZ ZROBIĆ:");
  console.log("   1. Otwórz Hardhat console: npx hardhat console --network localhost");
  console.log(`   2. Połącz ze skarbcem: const treasury = await ethers.getContractAt("TreasuryVault", "${treasuryAddress}")`);
  console.log("   3. Sprawdź saldo: await treasury.getETHBalance()");
  console.log("   4. Wpłać więcej: await treasury.depositETH('Ciocia Ewa', { value: ethers.parseEther('0.3') })");
  console.log("");

  console.log("🎓 GRATULACJE! Właśnie stworzyłeś prawdziwy skarbiec na blockchainie!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
