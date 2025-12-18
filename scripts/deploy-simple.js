// Prosty deployment script dla lokalnej sieci Hardhat
const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying TreasuryFactory...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Factory
  const TreasuryFactory = await hre.ethers.getContractFactory("TreasuryFactory");
  const factory = await TreasuryFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ TreasuryFactory deployed to:", factoryAddress);

  // Create test treasury
  console.log("\n📦 Creating test treasury...");
  const childName = "Zosia Testowa";
  const birthDate = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 1 year ago

  const tx = await factory.createTreasury(childName, birthDate);
  const receipt = await tx.wait();

  // Get treasury address from event
  const event = receipt.logs.find((log) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "TreasuryCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = factory.interface.parseLog(event);
    const treasuryAddress = parsedEvent.args[0];
    console.log("✅ Test treasury created:", treasuryAddress);

    // Interact with treasury
    const Treasury = await hre.ethers.getContractAt("TreasuryVault", treasuryAddress);

    console.log("\n📊 Treasury details:");
    console.log("  Child name:", await Treasury.childName());
    console.log("  Owner:", await Treasury.owner());
    console.log("  Balance:", hre.ethers.formatEther(await Treasury.getETHBalance()), "ETH");

    // Make a test deposit
    console.log("\n💰 Making test deposit of 1 ETH...");
    const depositTx = await Treasury.depositETH("Babcia Anna", {
      value: hre.ethers.parseEther("1.0")
    });
    await depositTx.wait();

    console.log("✅ Deposit successful!");
    console.log("  New balance:", hre.ethers.formatEther(await Treasury.getETHBalance()), "ETH");
    console.log("  Total contributions:", (await Treasury.getContributionsCount()).toString());
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Summary:");
  console.log("  Factory:", factoryAddress);
  console.log("  Network: localhost (Hardhat)");
  console.log("\nTwoje kontrakty działają! 🚀\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
