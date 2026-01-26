/**
 * TreasuryFactory Smart Contract Tests
 *
 * These tests cover:
 * - Factory deployment
 * - Creating new treasuries
 * - Tracking user treasuries
 * - Factory statistics
 * - Edge cases and error scenarios
 */

import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { TreasuryFactory, TreasuryVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TreasuryFactory", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let parent1: SignerWithAddress;
  let parent2: SignerWithAddress;
  let contributor: SignerWithAddress;

  // Contract instance
  let factory: TreasuryFactory;

  // Test data
  const childName1 = "Zosia Kowalska";
  const childName2 = "Janek Nowak";
  const birthDate = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 1 year ago

  beforeEach(async function () {
    // Get test accounts
    [owner, parent1, parent2, contributor] = await ethers.getSigners();

    // Deploy TreasuryFactory contract
    const TreasuryFactoryFactory = await ethers.getContractFactory("TreasuryFactory");
    factory = await TreasuryFactoryFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await factory.getAddress()).to.be.properAddress;
    });

    it("Should start with zero treasuries", async function () {
      expect(await factory.totalTreasuriesCreated()).to.equal(0n);
      expect(await factory.getTotalTreasuries()).to.equal(0n);
    });
  });

  describe("Creating Treasuries", function () {
    it("Should create a new treasury", async function () {
      const tx = await factory.connect(parent1).createTreasury(childName1, birthDate);
      const receipt = await tx.wait();

      expect(await factory.totalTreasuriesCreated()).to.equal(1n);
    });

    it("Should emit TreasuryCreated event", async function () {
      const tx = await factory.connect(parent1).createTreasury(childName1, birthDate);
      const receipt = await tx.wait();

      // Check that TreasuryCreated event was emitted
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "TreasuryCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should set the creator as owner of the treasury", async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);

      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

      expect(await treasury.owner()).to.equal(parent1.address);
    });

    it("Should set correct child name and birth date", async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);

      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

      expect(await treasury.childName()).to.equal(childName1);
      expect(await treasury.birthDate()).to.equal(BigInt(birthDate));
    });

    it("Should track treasury in factory", async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);

      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      expect(await factory.isFromThisFactory(treasuryAddress)).to.be.true;
    });

    it("Should allow creating multiple treasuries by same parent", async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      await factory.connect(parent1).createTreasury(childName2, birthDate);

      expect(await factory.getUserTreasuriesCount(parent1.address)).to.equal(2n);
      expect(await factory.totalTreasuriesCreated()).to.equal(2n);
    });

    it("Should track treasuries per user correctly", async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      await factory.connect(parent2).createTreasury(childName2, birthDate);

      expect(await factory.getUserTreasuriesCount(parent1.address)).to.equal(1n);
      expect(await factory.getUserTreasuriesCount(parent2.address)).to.equal(1n);
      expect(await factory.totalTreasuriesCreated()).to.equal(2n);
    });

    it("Should revert if child name is empty", async function () {
      await expect(
        factory.connect(parent1).createTreasury("", birthDate)
      ).to.be.revertedWith("Child name cannot be empty");
    });

    it("Should revert if birth date is in the future", async function () {
      const futureDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await expect(
        factory.connect(parent1).createTreasury(childName1, futureDate)
      ).to.be.revertedWith("Birth date cannot be in the future");
    });
  });

  describe("Retrieving Treasuries", function () {
    beforeEach(async function () {
      // Create some test treasuries
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      await factory.connect(parent1).createTreasury(childName2, birthDate);
      await factory.connect(parent2).createTreasury(childName1, birthDate);
    });

    it("Should return all user treasuries", async function () {
      const parent1Treasuries = await factory.getUserTreasuries(parent1.address);
      const parent2Treasuries = await factory.getUserTreasuries(parent2.address);

      expect(parent1Treasuries.length).to.equal(2);
      expect(parent2Treasuries.length).to.equal(1);
    });

    it("Should return correct treasury count per user", async function () {
      expect(await factory.getUserTreasuriesCount(parent1.address)).to.equal(2n);
      expect(await factory.getUserTreasuriesCount(parent2.address)).to.equal(1n);
    });

    it("Should return all treasuries", async function () {
      const allTreasuries = await factory.getAllTreasuries();
      expect(allTreasuries.length).to.equal(3);
    });

    it("Should return correct total count", async function () {
      expect(await factory.getTotalTreasuries()).to.equal(3n);
      expect(await factory.totalTreasuriesCreated()).to.equal(3n);
    });

    it("Should get treasury by index", async function () {
      const treasury0 = await factory.getTreasuryAtIndex(0);
      const treasury1 = await factory.getTreasuryAtIndex(1);

      expect(treasury0).to.be.properAddress;
      expect(treasury1).to.be.properAddress;
      expect(treasury0).to.not.equal(treasury1);
    });

    it("Should revert when getting treasury with invalid index", async function () {
      await expect(factory.getTreasuryAtIndex(999)).to.be.revertedWith(
        "Index out of bounds"
      );
    });

    it("Should verify if treasury is from factory", async function () {
      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      expect(await factory.isFromThisFactory(treasuryAddress)).to.be.true;

      // Random address should not be from factory
      expect(await factory.isFromThisFactory(parent1.address)).to.be.false;
    });
  });

  describe("Treasury Details", function () {
    let treasuryAddress: string;

    beforeEach(async function () {
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];

      // Add some ETH to the treasury
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);
      await treasury.connect(contributor).depositETH("Test Contributor", {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should get treasury details", async function () {
      const details = await factory.getTreasuryDetails(treasuryAddress);

      expect(details.childName).to.equal(childName1);
      expect(details.birthDate).to.equal(BigInt(birthDate));
      expect(details.owner).to.equal(parent1.address);
      expect(details.ethBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should revert when getting details for non-factory treasury", async function () {
      await expect(
        factory.getTreasuryDetails(parent1.address)
      ).to.be.revertedWith("Treasury not from this factory");
    });
  });

  describe("Factory Statistics", function () {
    it("Should return correct stats with no treasuries", async function () {
      const stats = await factory.getFactoryStats();
      expect(stats.totalTreasuries).to.equal(0n);
      expect(stats.totalValueLocked).to.equal(0n);
    });

    it("Should calculate total value locked correctly", async function () {
      // Create two treasuries
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      await factory.connect(parent2).createTreasury(childName2, birthDate);

      const treasury1Address = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury2Address = (await factory.getUserTreasuries(parent2.address))[0];

      const treasury1 = await ethers.getContractAt("TreasuryVault", treasury1Address);
      const treasury2 = await ethers.getContractAt("TreasuryVault", treasury2Address);

      // Add ETH to both treasuries
      await treasury1.connect(contributor).depositETH("Contributor 1", {
        value: ethers.parseEther("1.0"),
      });

      await treasury2.connect(contributor).depositETH("Contributor 2", {
        value: ethers.parseEther("2.0"),
      });

      // Check stats
      const stats = await factory.getFactoryStats();
      expect(stats.totalTreasuries).to.equal(2n);
      expect(stats.totalValueLocked).to.equal(ethers.parseEther("3.0"));
    });
  });

  describe("Integration Tests", function () {
    it("Should allow full lifecycle: create, deposit, withdraw", async function () {
      // 1. Parent creates treasury
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

      // 2. Contributor deposits ETH
      await treasury.connect(contributor).depositETH("Babcia Anna", {
        value: ethers.parseEther("2.0"),
      });

      expect(await treasury.getETHBalance()).to.equal(ethers.parseEther("2.0"));

      // 3. Parent withdraws
      await expect(
        treasury.connect(parent1).withdrawETH(ethers.parseEther("1.0"))
      ).to.changeEtherBalance(parent1, ethers.parseEther("1.0"));

      expect(await treasury.getETHBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should prevent non-owners from withdrawing", async function () {
      // Create treasury
      await factory.connect(parent1).createTreasury(childName1, birthDate);
      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

      // Deposit
      await treasury.connect(contributor).depositETH("Test", {
        value: ethers.parseEther("1.0"),
      });

      // Attacker tries to withdraw (should fail)
      await expect(
        treasury.connect(parent2).withdrawETH(ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });
  });

  describe("Gas Optimization", function () {
    it("Should track gas usage for creating treasury", async function () {
      const tx = await factory.connect(parent1).createTreasury(childName1, birthDate);
      const receipt = await tx.wait();

      console.log(`      Gas used for creating treasury: ${receipt?.gasUsed.toString()}`);

      // Treasury creation should use < 2M gas (OpenZeppelin v5 uses more gas)
      expect(receipt?.gasUsed).to.be.lessThan(2000000n);
    });

    it("Should track gas for multiple operations", async function () {
      // Create treasury
      const createTx = await factory
        .connect(parent1)
        .createTreasury(childName1, birthDate);
      const createReceipt = await createTx.wait();

      // Get treasury and deposit
      const treasuryAddress = (await factory.getUserTreasuries(parent1.address))[0];
      const treasury = await ethers.getContractAt("TreasuryVault", treasuryAddress);

      const depositTx = await treasury.connect(contributor).depositETH("Test", {
        value: ethers.parseEther("1.0"),
      });
      const depositReceipt = await depositTx.wait();

      console.log(
        `      Total gas (create + deposit): ${(
          (createReceipt?.gasUsed || 0n) + (depositReceipt?.gasUsed || 0n)
        ).toString()}`
      );
    });
  });
});
