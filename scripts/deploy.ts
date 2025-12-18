/**
 * Deployment Script for Skarbiec Dziecka Smart Contracts
 *
 * This script:
 * 1. Deploys TreasuryFactory to the selected network
 * 2. Optionally creates a test treasury (on testnet only)
 * 3. Verifies contracts on Basescan
 * 4. Saves deployment addresses to a file
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network baseSepolia (testnet)
 *   npx hardhat run scripts/deploy.ts --network base (mainnet)
 */

import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log("\n" + "=".repeat(60), colors.bright);
  log("  SKARBIEC DZIECKA - SMART CONTRACT DEPLOYMENT", colors.bright);
  log("=".repeat(60) + "\n", colors.bright);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  log(`Network: ${network.name}`, colors.blue);
  log(`Deployer: ${deployerAddress}`, colors.blue);
  log(`Balance: ${ethers.formatEther(balance)} ETH\n`, colors.blue);

  // Check if deployer has enough balance
  if (balance === 0n) {
    log("❌ Error: Deployer has no ETH balance!", colors.red);
    log(
      "Please fund your wallet before deploying.\n" +
        "Testnet faucet: https://www.alchemy.com/faucets/base-sepolia",
      colors.yellow
    );
    process.exit(1);
  }

  // Confirm deployment on mainnet
  if (network.name === "base") {
    log("⚠️  WARNING: You are deploying to MAINNET!", colors.yellow);
    log("This will use REAL ETH and cannot be undone.", colors.yellow);
    log("Make sure you have tested thoroughly on testnet first!\n", colors.yellow);

    // In a real scenario, you might want to add a confirmation prompt here
    // For now, we'll just add a delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    // ============================================
    // 1. DEPLOY TREASURY FACTORY
    // ============================================
    log("📦 Deploying TreasuryFactory...", colors.yellow);

    const TreasuryFactory = await ethers.getContractFactory("TreasuryFactory");
    const factory = await TreasuryFactory.deploy();
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    log(`✅ TreasuryFactory deployed to: ${factoryAddress}`, colors.green);

    // ============================================
    // 2. CREATE TEST TREASURY (testnet only)
    // ============================================
    let testTreasuryAddress = "";

    if (network.name === "baseSepolia" || network.name === "hardhat") {
      log("\n📦 Creating test treasury...", colors.yellow);

      const testChildName = "Test Child";
      const testBirthDate = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 1 year ago

      const tx = await factory.createTreasury(testChildName, testBirthDate);
      const receipt = await tx.wait();

      // Get the created treasury address from the event
      const event = receipt?.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "TreasuryCreated";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = factory.interface.parseLog(event);
        testTreasuryAddress = parsedEvent?.args[0];
        log(`✅ Test treasury created: ${testTreasuryAddress}`, colors.green);
      }
    }

    // ============================================
    // 3. SAVE DEPLOYMENT ADDRESSES
    // ============================================
    log("\n💾 Saving deployment addresses...", colors.yellow);

    const deploymentData = {
      network: network.name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: {
        TreasuryFactory: factoryAddress,
        ...(testTreasuryAddress && { TestTreasury: testTreasuryAddress }),
      },
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save to file
    const filename = `${network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

    // Also save as "latest"
    const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));

    log(`✅ Deployment saved to: ${filename}`, colors.green);

    // ============================================
    // 4. VERIFY CONTRACTS (if not local network)
    // ============================================
    if (network.name !== "hardhat" && network.name !== "localhost") {
      log("\n🔍 Verifying contracts on Basescan...", colors.yellow);
      log("This may take a minute...", colors.yellow);

      // Wait a bit for Basescan to index the contract
      await new Promise((resolve) => setTimeout(resolve, 30000));

      try {
        await run("verify:verify", {
          address: factoryAddress,
          constructorArguments: [],
        });
        log(`✅ TreasuryFactory verified on Basescan`, colors.green);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          log(`ℹ️  TreasuryFactory already verified`, colors.blue);
        } else {
          log(`⚠️  Verification failed: ${error.message}`, colors.yellow);
          log("You can verify manually later with:", colors.yellow);
          log(
            `npx hardhat verify --network ${network.name} ${factoryAddress}`,
            colors.yellow
          );
        }
      }
    }

    // ============================================
    // 5. SUMMARY
    // ============================================
    log("\n" + "=".repeat(60), colors.bright);
    log("  DEPLOYMENT SUMMARY", colors.bright);
    log("=".repeat(60), colors.bright);
    log(`Network:           ${network.name}`, colors.blue);
    log(`Factory Address:   ${factoryAddress}`, colors.green);
    if (testTreasuryAddress) {
      log(`Test Treasury:     ${testTreasuryAddress}`, colors.green);
    }
    log(
      `\nBasescan:          https://${
        network.name === "base" ? "" : "sepolia."
      }basescan.org/address/${factoryAddress}`,
      colors.blue
    );

    log("\n" + "=".repeat(60) + "\n", colors.bright);

    log("✅ Deployment complete!", colors.green);
    log("\nNext steps:", colors.yellow);
    log("1. Update .env.local with the factory address", colors.yellow);
    log("2. Update frontend to use the deployed contract", colors.yellow);
    log("3. Test creating a treasury from the frontend", colors.yellow);

    if (network.name === "baseSepolia") {
      log("\n💡 Testnet faucet: https://www.alchemy.com/faucets/base-sepolia", colors.blue);
    }

    log("");
  } catch (error) {
    log("\n❌ Deployment failed!", colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
