const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreamingToken", function () {
  let StreamingToken;
  let streamingToken;
  let owner;
  let treasury;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get Signers
    [owner, treasury, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy StreamingToken
    StreamingToken = await ethers.getContractFactory("StreamingToken");
    streamingToken = await StreamingToken.deploy(treasury.address);
    await streamingToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await streamingToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await streamingToken.balanceOf(owner.address);
      expect(await streamingToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the treasury address correctly", async function () {
      expect(await streamingToken.treasuryAddress()).to.equal(treasury.address);
    });
  });

  describe("Transactions", function () {
    it("Should allow users to purchase credits", async function () {
      // Purchase credits with 0.1 ETH
      const ethAmount = ethers.parseEther("0.1");
      const expectedCredits = ethAmount * BigInt(100);  // 100 STRM per 1 ETH

      await expect(streamingToken.connect(addr1).purchaseCredits({ value: ethAmount }))
        .to.emit(streamingToken, "CreditsPurchased")
        .withArgs(addr1.address, expectedCredits, ethAmount);

      // Check the balance
      const balance = await streamingToken.balanceOf(addr1.address);
      expect(balance).to.equal(expectedCredits);
    });

    it("Should not allow purchasing with 0 ETH", async function () {
      await expect(streamingToken.connect(addr1).purchaseCredits({ value: 0 }))
        .to.be.revertedWith("Must send ETH to purchase credits");
    });
  });

  describe("Streaming Access", function () {
    beforeEach(async function () {
      // Purchase credits for addr1
      const ethAmount = ethers.parseEther("0.1");
      await streamingToken.connect(addr1).purchaseCredits({ value: ethAmount });
    });

    it("Should start a stream by spending 1 token", async function () {
      const contentId = "content_001";

      // Register content
      await streamingToken.connect(addr2).registerContent(contentId);

      const initialBalance = await streamingToken.balanceOf(addr1.address);

      await expect(streamingToken.connect(addr1).startStream(contentId))
        .to.emit(streamingToken, "StreamStarted");

      // Check the balance after streaming (should be 1 token less)
      const finalBalance = await streamingToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - BigInt(10**18)); // 1 STRM = 10^18

      // Check streaming access
      expect(await streamingToken.canStream(addr1.address, contentId)).to.equal(true);
    });

    it("Should not allow streaming with insufficient balance", async function () {
      // Burn all tokens from addr1
      const balance = await streamingToken.balanceOf(addr1.address);
      await streamingToken.connect(addr1).transfer(treasury.address, balance);

      await expect(streamingToken.connect(addr1).startStream("content_001"))
        .to.be.revertedWith("Insufficient credits");
    });

    it("Should correctly check streaming access", async function () {
      const contentId = "content_001";

      // Initially no access
      expect(await streamingToken.canStream(addr1.address, contentId)).to.equal(false);

      // Start stream
      await streamingToken.connect(addr1).startStream(contentId);

      // Now should have access
      expect(await streamingToken.canStream(addr1.address, contentId)).to.equal(true);
    });
  });

  describe("Content Registration", function () {
    it("Should allow registering content", async function () {
      const contentId = "content_001";

      await expect(streamingToken.connect(addr1).registerContent(contentId))
        .to.emit(streamingToken, "ContentRegistered")
        .withArgs(contentId, addr1.address);

      // Check content creator
      expect(await streamingToken.contentCreators(contentId)).to.equal(addr1.address);
    });
  });
});
