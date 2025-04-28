const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleTokenChain", function () {
  let SimpleTokenChain;
  let simpleTokenChain;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    SimpleTokenChain = await ethers.getContractFactory("SimpleTokenChain");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    simpleTokenChain = await SimpleTokenChain.deploy("SimpleToken", "STK", ethers.utils.parseEther("0.01"));
    await simpleTokenChain.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simpleTokenChain.owner()).to.equal(owner.address);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await simpleTokenChain.name()).to.equal("SimpleToken");
      expect(await simpleTokenChain.symbol()).to.equal("STK");
    });

    it("Should create a genesis block", async function () {
      expect(await simpleTokenChain.blockCount()).to.equal(1);
      const genesisBlock = await simpleTokenChain.getBlock(0);
      expect(genesisBlock.blockNumber).to.equal(0);
      expect(genesisBlock.minter).to.equal("0x0000000000000000000000000000000000000000");
      expect(genesisBlock.tokenMetadata).to.equal("Genesis Block");
    });
  });

  describe("Minting", function () {
    it("Should mint a token and create a new block", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      await simpleTokenChain.connect(addr1).mint("Test Token 1", { value: mintPrice });
      
      // Check token was minted
      expect(await simpleTokenChain.totalSupply()).to.equal(1);
      expect(await simpleTokenChain.balanceOf(addr1.address)).to.equal(1);
      
      // Check block was created
      expect(await simpleTokenChain.blockCount()).to.equal(2);
      const block = await simpleTokenChain.getBlock(1);
      expect(block.blockNumber).to.equal(1);
      expect(block.minter).to.equal(addr1.address);
      expect(block.tokenMetadata).to.equal("Test Token 1");
    });

    it("Should fail if sending insufficient ETH", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      const insufficientAmount = mintPrice.sub(1);
      
      await expect(
        simpleTokenChain.connect(addr1).mint("Test Token", { value: insufficientAmount })
      ).to.be.revertedWith("Insufficient payment");
    });
    
    it("Should allow minting multiple tokens", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      
      await simpleTokenChain.connect(addr1).mint("Token 1", { value: mintPrice });
      await simpleTokenChain.connect(addr2).mint("Token 2", { value: mintPrice });
      await simpleTokenChain.connect(addr1).mint("Token 3", { value: mintPrice });
      
      expect(await simpleTokenChain.totalSupply()).to.equal(3);
      expect(await simpleTokenChain.balanceOf(addr1.address)).to.equal(2);
      expect(await simpleTokenChain.balanceOf(addr2.address)).to.equal(1);
      expect(await simpleTokenChain.blockCount()).to.equal(4); // Genesis + 3 tokens
    });
  });

  describe("Blockchain Verification", function () {
    it("Should verify the blockchain integrity", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      
      // Mint a few tokens
      await simpleTokenChain.connect(addr1).mint("Token 1", { value: mintPrice });
      await simpleTokenChain.connect(addr2).mint("Token 2", { value: mintPrice });
      
      // Verify chain
      expect(await simpleTokenChain.verifyChain()).to.be.true;
    });
  });

  describe("Token Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      
      // Mint a token
      await simpleTokenChain.connect(addr1).mint("Transferable Token", { value: mintPrice });
      
      // Check initial ownership
      expect(await simpleTokenChain.tokenOwner(0)).to.equal(addr1.address);
      
      // Transfer token
      await simpleTokenChain.connect(addr1).transfer(addr2.address, 0);
      
      // Check new ownership
      expect(await simpleTokenChain.tokenOwner(0)).to.equal(addr2.address);
      expect(await simpleTokenChain.balanceOf(addr1.address)).to.equal(0);
      expect(await simpleTokenChain.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should fail if transferring a token that is not owned", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      
      // Mint a token owned by addr1
      await simpleTokenChain.connect(addr1).mint("Owned Token", { value: mintPrice });
      
      // Attempt to transfer from addr2 who doesn't own it
      await expect(
        simpleTokenChain.connect(addr2).transfer(owner.address, 0)
      ).to.be.revertedWith("You don't own this token");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to toggle minting", async function () {
      // Initially enabled
      expect(await simpleTokenChain.mintingEnabled()).to.be.true;
      
      // Toggle off
      await simpleTokenChain.connect(owner).toggleMinting();
      expect(await simpleTokenChain.mintingEnabled()).to.be.false;
      
      // Toggle back on
      await simpleTokenChain.connect(owner).toggleMinting();
      expect(await simpleTokenChain.mintingEnabled()).to.be.true;
    });

    it("Should allow owner to set mint price", async function () {
      const newMintPrice = ethers.utils.parseEther("0.05");
      await simpleTokenChain.connect(owner).setMintPrice(newMintPrice);
      expect(await simpleTokenChain.mintPrice()).to.equal(newMintPrice);
    });

    it("Should allow owner to withdraw funds", async function () {
      const mintPrice = await simpleTokenChain.mintPrice();
      
      // Mint tokens to generate some ETH in the contract
      await simpleTokenChain.connect(addr1).mint("Token 1", { value: mintPrice });
      await simpleTokenChain.connect(addr2).mint("Token 2", { value: mintPrice });
      
      // Check contract balance
      const contractBalance = await ethers.provider.getBalance(simpleTokenChain.address);
      expect(contractBalance).to.equal(mintPrice.mul(2));
      
      // Get owner balance before withdrawal
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Withdraw funds
      const tx = await simpleTokenChain.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Check owner received the funds (minus gas costs)
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(contractBalance).sub(gasUsed)
      );
      
      // Contract should be empty
      expect(await ethers.provider.getBalance(simpleTokenChain.address)).to.equal(0);
    });
  });
});