// Script to deploy the streaming platform contracts

const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Get initial balance
  const initialBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(initialBalance)} ETH`);

  // Deploy StreamingToken contract
  console.log("Deploying StreamingToken...");
  const treasuryAddress = deployer.address; // Using deployer as treasury for now
  const StreamingToken = await hre.ethers.getContractFactory("StreamingToken");
  const streamingToken = await StreamingToken.deploy(treasuryAddress);
  await streamingToken.waitForDeployment();
  const streamingTokenAddress = await streamingToken.getAddress();
  console.log(`StreamingToken deployed to: ${streamingTokenAddress}`);

  // Deploy ContentRegistry contract
  console.log("Deploying ContentRegistry...");
  const ContentRegistry = await hre.ethers.getContractFactory("ContentRegistry");
  const contentRegistry = await ContentRegistry.deploy(streamingTokenAddress);
  await contentRegistry.waitForDeployment();
  const contentRegistryAddress = await contentRegistry.getAddress();
  console.log(`ContentRegistry deployed to: ${contentRegistryAddress}`);

  // Get final balance
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployment cost: ${hre.ethers.formatEther(initialBalance - finalBalance)} ETH`);

  // Print summary
  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log(`Network: ${hre.network.name}`);
  console.log(`StreamingToken: ${streamingTokenAddress}`);
  console.log(`ContentRegistry: ${contentRegistryAddress}`);
  console.log("===================");

  // Wait for block explorers to index the contracts if on a testnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block explorer to index the contracts...");
    console.log("This may take a few minutes.");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    console.log("\nVerifying contracts on block explorer...");
    try {
      // Verify StreamingToken
      await hre.run("verify:verify", {
        address: streamingTokenAddress,
        constructorArguments: [treasuryAddress],
        contract: "contracts/StreamingToken.sol:StreamingToken"
      });
      console.log("StreamingToken verified successfully");
    } catch (error) {
      console.error("Error verifying StreamingToken:", error);
    }

    try {
      // Verify ContentRegistry
      await hre.run("verify:verify", {
        address: contentRegistryAddress,
        constructorArguments: [streamingTokenAddress],
        contract: "contracts/ContentRegistry.sol:ContentRegistry"
      });
      console.log("ContentRegistry verified successfully");
    } catch (error) {
      console.error("Error verifying ContentRegistry:", error);
    }
  }

  // Save contract addresses to a file for frontend reference
  const fs = require("fs");
  const contractAddresses = {
    streamingToken: streamingTokenAddress,
    contentRegistry: contentRegistryAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deploymentTimestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "contract-addresses.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("\nContract addresses saved to contract-addresses.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
