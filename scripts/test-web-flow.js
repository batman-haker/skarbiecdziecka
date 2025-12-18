// 🧪 Test skryptu demonstracyjnego dla aplikacji webowej
// Symuluje tworzenie skarbca i wpłaty, które będą widoczne w interfejsie

const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST: Tworzenie danych demonstracyjnych dla aplikacji webowej");
  console.log("=".repeat(70) + "\n");

  // Pobierz konta
  const [deployer, heniek, ciocia, dziadek] = await hre.ethers.getSigners();

  console.log("👥 Konta testowe:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Heniek (rodzic): ${heniek.address}`);
  console.log(`   Ciocia Ewa: ${ciocia.address}`);
  console.log(`   Dziadek Jan: ${dziadek.address}`);
  console.log("");

  // Połącz z Factory
  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factory = await hre.ethers.getContractAt("TreasuryFactory", factoryAddress);

  console.log("📦 Factory:", factoryAddress);
  console.log("");

  // KROK 1: Heniek tworzy skarbiec dla Zosi (3 lata)
  console.log("━".repeat(70));
  console.log("KROK 1: Heniek tworzy skarbiec dla córki Zosi (3 lata)");
  console.log("━".repeat(70) + "\n");

  const childName = "Zosia";
  const childAge = 3;
  const birthDate = Math.floor(Date.now() / 1000) - childAge * 365 * 24 * 60 * 60;

  console.log("🔨 Tworzę skarbiec...");
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

  // KROK 2: Ciocia Ewa wpłaca na imieniny
  console.log("━".repeat(70));
  console.log("KROK 2: Ciocia Ewa wpłaca 0.3 ETH na imieniny 🎉");
  console.log("━".repeat(70) + "\n");

  console.log("👩 Ciocia Ewa wpłaca 0.3 ETH...");
  await treasury.connect(ciocia).depositETH("Ciocia Ewa", {
    value: hre.ethers.parseEther("0.3")
  });

  console.log("✅ Wpłata zaakceptowana!");
  console.log(`   Saldo skarbca: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  // KROK 3: Dziadek Jan wpłaca na święta
  console.log("━".repeat(70));
  console.log("KROK 3: Dziadek Jan wpłaca 0.7 ETH na święta 🎄");
  console.log("━".repeat(70) + "\n");

  console.log("👴 Dziadek Jan wpłaca 0.7 ETH...");
  await treasury.connect(dziadek).depositETH("Dziadek Jan", {
    value: hre.ethers.parseEther("0.7")
  });

  console.log("✅ Wpłata zaakceptowana!");
  console.log(`   Saldo skarbca: ${hre.ethers.formatEther(await treasury.getETHBalance())} ETH`);
  console.log("");

  // PODSUMOWANIE
  console.log("━".repeat(70));
  console.log("🎉 PODSUMOWANIE");
  console.log("━".repeat(70) + "\n");

  const finalBalance = await treasury.getETHBalance();
  const contributionsCount = await treasury.getContributionsCount();

  console.log(`✅ Skarbiec dla ${childName} (${childAge} lata) utworzony`);
  console.log(`✅ Liczba wpłat: ${contributionsCount}`);
  console.log(`✅ Całkowite saldo: ${hre.ethers.formatEther(finalBalance)} ETH`);
  console.log("");

  console.log("📍 DANE DO APLIKACJI WEBOWEJ:");
  console.log(`   Adres skarbca: ${treasuryAddress}`);
  console.log("");

  console.log("🌐 OTWÓRZ W PRZEGLĄDARCE:");
  console.log(`   http://localhost:3000/treasury?address=${treasuryAddress}`);
  console.log("");

  console.log("💡 MOŻESZ TEŻ:");
  console.log("   1. Otworzyć http://localhost:3000 i stworzyć własny skarbiec");
  console.log("   2. Wpłacić więcej środków przez interfejs webowy");
  console.log("   3. Zobacz skarbiec Olafa: http://localhost:3000/treasury");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
