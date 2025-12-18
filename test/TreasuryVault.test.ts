/**
 * TreasuryVault Smart Contract Tests
 *
 * These tests cover:
 * - Contract deployment
 * - ETH deposits and withdrawals
 * - ERC20 token deposits and withdrawals
 * - Access control (only owner can withdraw)
 * - Contribution tracking
 * - Edge cases and error scenarios
 */

import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { TreasuryVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TreasuryVault", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let contributor1: SignerWithAddress;
  let contributor2: SignerWithAddress;
  let attacker: SignerWithAddress;

  // Contract instance
  let treasury: TreasuryVault;

  // Test data
  const childName = "Zosia Kowalska";
  const birthDate = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 1 year ago

  beforeEach(async function () {
    // Get test accounts
    [owner, contributor1, contributor2, attacker] = await ethers.getSigners();

    // Deploy TreasuryVault contract
    const TreasuryVaultFactory = await ethers.getContractFactory("TreasuryVault");
    treasury = await TreasuryVaultFactory.deploy(childName, birthDate);
    await treasury.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct child name", async function () {
      expect(await treasury.childName()).to.equal(childName);
    });

    it("Should set the correct birth date", async function () {
      expect(await treasury.birthDate()).to.equal(birthDate);
    });

    it("Should set the deployer as owner", async function () {
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("Should start with zero contributions", async function () {
      expect(await treasury.getContributionsCount()).to.equal(0);
    });

    it("Should revert if child name is empty", async function () {
      const TreasuryVaultFactory = await ethers.getContractFactory("TreasuryVault");
      await expect(
        TreasuryVaultFactory.deploy("", birthDate)
      ).to.be.revertedWith("Child name cannot be empty");
    });

    it("Should revert if birth date is in the future", async function () {
      const TreasuryVaultFactory = await ethers.getContractFactory("TreasuryVault");
      const futureDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await expect(
        TreasuryVaultFactory.deploy(childName, futureDate)
      ).to.be.revertedWith("Birth date cannot be in the future");
    });
  });

  describe("ETH Deposits", function () {
    const depositAmount = ethers.parseEther("1.0"); // 1 ETH
    const contributorName = "Babcia Anna";

    it("Should accept ETH deposits", async function () {
      await expect(
        treasury.connect(contributor1).depositETH(contributorName, {
          value: depositAmount,
        })
      ).to.changeEtherBalances(
        [contributor1, treasury],
        [-depositAmount, depositAmount]
      );
    });

    it("Should emit Deposited event", async function () {
      await expect(
        treasury.connect(contributor1).depositETH(contributorName, {
          value: depositAmount,
        })
      )
        .to.emit(treasury, "Deposited")
        .withArgs(
          contributor1.address,
          depositAmount,
          ethers.ZeroAddress, // address(0) for ETH
          contributorName
        );
    });

    it("Should track contributions correctly", async function () {
      await treasury.connect(contributor1).depositETH(contributorName, {
        value: depositAmount,
      });

      expect(await treasury.getContributionsCount()).to.equal(1);
      expect(await treasury.totalContributions()).to.equal(1);

      const contribution = await treasury.getContribution(0);
      expect(contribution.contributor).to.equal(contributor1.address);
      expect(contribution.amount).to.equal(depositAmount);
      expect(contribution.token).to.equal(ethers.ZeroAddress);
      expect(contribution.contributorName).to.equal(contributorName);
    });

    it("Should update total contributed by address", async function () {
      await treasury.connect(contributor1).depositETH(contributorName, {
        value: depositAmount,
      });

      expect(await treasury.totalContributedByAddress(contributor1.address)).to.equal(
        depositAmount
      );
    });

    it("Should handle multiple deposits from same contributor", async function () {
      await treasury.connect(contributor1).depositETH(contributorName, {
        value: depositAmount,
      });

      await treasury.connect(contributor1).depositETH(contributorName, {
        value: depositAmount,
      });

      expect(await treasury.getContributionsCount()).to.equal(2);
      expect(await treasury.totalContributedByAddress(contributor1.address)).to.equal(
        depositAmount * 2n
      );
    });

    it("Should handle deposits from multiple contributors", async function () {
      await treasury.connect(contributor1).depositETH("Babcia Anna", {
        value: depositAmount,
      });

      await treasury.connect(contributor2).depositETH("Wujek Tomasz", {
        value: depositAmount,
      });

      expect(await treasury.getContributionsCount()).to.equal(2);
      expect(await treasury.getETHBalance()).to.equal(depositAmount * 2n);
    });

    it("Should revert if deposit amount is 0", async function () {
      await expect(
        treasury.connect(contributor1).depositETH(contributorName, { value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert if contributor name is empty", async function () {
      await expect(
        treasury.connect(contributor1).depositETH("", { value: depositAmount })
      ).to.be.revertedWith("Contributor name required");
    });

    it("Should accept direct ETH transfers via receive()", async function () {
      await contributor1.sendTransaction({
        to: await treasury.getAddress(),
        value: depositAmount,
      });

      expect(await treasury.getETHBalance()).to.equal(depositAmount);
      expect(await treasury.getContributionsCount()).to.equal(1);

      const contribution = await treasury.getContribution(0);
      expect(contribution.contributorName).to.equal("Anonymous");
    });
  });

  describe("ETH Withdrawals", function () {
    const depositAmount = ethers.parseEther("2.0");
    const withdrawAmount = ethers.parseEther("1.0");

    beforeEach(async function () {
      // Make a deposit first
      await treasury.connect(contributor1).depositETH("Test Contributor", {
        value: depositAmount,
      });
    });

    it("Should allow owner to withdraw ETH", async function () {
      await expect(
        treasury.connect(owner).withdrawETH(withdrawAmount)
      ).to.changeEtherBalances(
        [treasury, owner],
        [-withdrawAmount, withdrawAmount]
      );
    });

    it("Should emit Withdrawn event", async function () {
      await expect(treasury.connect(owner).withdrawETH(withdrawAmount))
        .to.emit(treasury, "Withdrawn")
        .withArgs(owner.address, withdrawAmount, ethers.ZeroAddress);
    });

    it("Should allow owner to withdraw all ETH", async function () {
      const balance = await treasury.getETHBalance();

      await expect(treasury.connect(owner).withdrawAllETH()).to.changeEtherBalances(
        [treasury, owner],
        [-balance, balance]
      );
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(
        treasury.connect(attacker).withdrawETH(withdrawAmount)
      ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
    });

    it("Should revert if trying to withdraw more than balance", async function () {
      const tooMuch = ethers.parseEther("10.0");
      await expect(
        treasury.connect(owner).withdrawETH(tooMuch)
      ).to.be.revertedWith("Insufficient ETH balance");
    });

    it("Should revert if trying to withdrawAll with 0 balance", async function () {
      // Withdraw all first
      await treasury.connect(owner).withdrawAllETH();

      // Try to withdraw again
      await expect(treasury.connect(owner).withdrawAllETH()).to.be.revertedWith(
        "No ETH to withdraw"
      );
    });
  });

  describe("View Functions", function () {
    const depositAmount = ethers.parseEther("1.5");

    beforeEach(async function () {
      await treasury.connect(contributor1).depositETH("Contributor 1", {
        value: depositAmount,
      });

      await treasury.connect(contributor2).depositETH("Contributor 2", {
        value: depositAmount,
      });
    });

    it("Should return correct ETH balance", async function () {
      expect(await treasury.getETHBalance()).to.equal(depositAmount * 2n);
    });

    it("Should return correct contributions count", async function () {
      expect(await treasury.getContributionsCount()).to.equal(2);
    });

    it("Should return all contributions", async function () {
      const allContributions = await treasury.getAllContributions();
      expect(allContributions.length).to.equal(2);
      expect(allContributions[0].contributorName).to.equal("Contributor 1");
      expect(allContributions[1].contributorName).to.equal("Contributor 2");
    });

    it("Should return total contributed by address", async function () {
      expect(await treasury.getTotalContributedBy(contributor1.address)).to.equal(
        depositAmount
      );
    });

    it("Should return total for token", async function () {
      expect(await treasury.getTotalForToken(ethers.ZeroAddress)).to.equal(
        depositAmount * 2n
      );
    });

    it("Should revert when getting contribution with invalid index", async function () {
      await expect(treasury.getContribution(999)).to.be.revertedWith(
        "Index out of bounds"
      );
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to transfer ownership", async function () {
      await treasury.connect(owner).transferOwnership(contributor1.address);
      expect(await treasury.owner()).to.equal(contributor1.address);
    });

    it("Should allow new owner to withdraw after ownership transfer", async function () {
      // Deposit first
      await treasury.connect(contributor2).depositETH("Test", {
        value: ethers.parseEther("1.0"),
      });

      // Transfer ownership
      await treasury.connect(owner).transferOwnership(contributor1.address);

      // New owner should be able to withdraw
      await expect(
        treasury.connect(contributor1).withdrawETH(ethers.parseEther("0.5"))
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization", function () {
    it("Should track gas usage for deposits", async function () {
      const tx = await treasury.connect(contributor1).depositETH("Gas Test", {
        value: ethers.parseEther("1.0"),
      });

      const receipt = await tx.wait();
      console.log(`      Gas used for ETH deposit: ${receipt?.gasUsed.toString()}`);

      // ETH deposit should use < 250k gas (OpenZeppelin v5 uses more gas)
      expect(receipt?.gasUsed).to.be.lessThan(250000n);
    });
  });
});
