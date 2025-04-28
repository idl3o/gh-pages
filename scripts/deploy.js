// Script to deploy the PRXTokenChain contract

const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PRXTokenChain contract...");

  // Token configuration
  const name = "PRXToken";
  const symbol = "PRX";
  const mintPrice = ethers.utils.parseEther("0.01"); // 0.01 ETH
  
  // Get the contract factory
  const PRXTokenChain = await ethers.getContractFactory("PRXTokenChain");
  
  // Deploy the contract
  const prxTokenChain = await PRXTokenChain.deploy(name, symbol, mintPrice);
  await prxTokenChain.deployed();
  
  console.log(`PRXTokenChain deployed to: ${prxTokenChain.address}`);
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);
  console.log(`Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`);
  console.log("Genesis Block created automatically");
  
  // Log the transaction hash for verification
  console.log(`Transaction Hash: ${prxTokenChain.deployTransaction.hash}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
