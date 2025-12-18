// Deployment script dla Base Sepolia Testnet
const hre = require("hardhat");

async function main() {
  console.log("\n⚡ DEPLOYING TO BASE SEPOLIA TESTNET ⚡\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Check if we have enough balance
  if (balance < hre.ethers.parseEther("0.001")) {
    console.error("\n❌ ERROR: Insufficient balance for deployment!");
    console.error("   You need at least 0.001 ETH on Base Sepolia");
    console.error("   Use faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    process.exit(1);
  }

  console.log("\n🚀 Deploying TreasuryFactory contract...");

  // Deploy Factory
  const TreasuryFactory = await hre.ethers.getContractFactory("TreasuryFactory");
  const factory = await TreasuryFactory.deploy();

  console.log("⏳ Waiting for deployment...");
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 TreasuryFactory Address:", factoryAddress);
  console.log("🌐 Network: Base Sepolia Testnet");
  console.log("🔍 Explorer:", `https://sepolia.basescan.org/address/${factoryAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📝 NEXT STEPS:");
  console.log("1. Zaktualizuj adres w lib/contracts/addresses.ts");
  console.log("2. Uruchom aplikację: npm run dev");
  console.log("3. Połącz MetaMask z Base Sepolia");
  console.log("4. Utwórz pierwszy skarbiec!");

  console.log("\n🎉 Gotowe! Możesz teraz używać aplikacji na testnet!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });
