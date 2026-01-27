/**
 * Fund a treasury with test ETH from relay wallet
 * Usage: npx hardhat run scripts/fund-treasury.js --network baseSepolia
 */

const { ethers } = require("hardhat");

async function main() {
  // Treasury to fund
  const treasuryAddress = "0x4125014B0bc0B6e12E38E5bf6387547609670170"; // hel
  const amountToSend = "0.001"; // 0.001 ETH for testing

  // Get relay wallet
  const privateKey = process.env.RELAY_WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No private key found in environment");
  }

  const wallet = new ethers.Wallet(privateKey, ethers.provider);

  console.log("=== Fund Treasury Script ===");
  console.log("Treasury:", treasuryAddress);
  console.log("Amount:", amountToSend, "ETH");
  console.log("From wallet:", wallet.address);

  // Check wallet balance
  const balance = await ethers.provider.getBalance(wallet.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  // Check treasury balance before
  const treasuryBalanceBefore = await ethers.provider.getBalance(treasuryAddress);
  console.log("Treasury balance before:", ethers.formatEther(treasuryBalanceBefore), "ETH");

  // Send ETH to treasury
  console.log("\nSending", amountToSend, "ETH to treasury...");

  const tx = await wallet.sendTransaction({
    to: treasuryAddress,
    value: ethers.parseEther(amountToSend),
  });

  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  // Check treasury balance after
  const treasuryBalanceAfter = await ethers.provider.getBalance(treasuryAddress);
  console.log("\nTreasury balance after:", ethers.formatEther(treasuryBalanceAfter), "ETH");
  console.log("✅ Done! Refresh the treasury page to see the balance.");
}

main().catch(console.error);
