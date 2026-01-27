const { ethers } = require("hardhat");

async function main() {
  const treasuryAddress = "0xe7B7de9059A3201A7ba86276758c6A6C967e47e1";

  console.log("Checking treasury at:", treasuryAddress);

  // Check if contract exists
  const code = await ethers.provider.getCode(treasuryAddress);
  console.log("Contract code exists:", code !== "0x");
  console.log("Code length:", code.length);

  if (code === "0x") {
    console.log("❌ No contract at this address!");
    return;
  }

  // Try to call the contract
  const TreasuryVault = await ethers.getContractAt("TreasuryVault", treasuryAddress);

  try {
    const childName = await TreasuryVault.childName();
    console.log("✅ Child name:", childName);

    const owner = await TreasuryVault.owner();
    console.log("✅ Owner:", owner);

    const balance = await TreasuryVault.getETHBalance();
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");
  } catch (error) {
    console.log("❌ Error calling contract:", error.message);
  }
}

main().catch(console.error);
