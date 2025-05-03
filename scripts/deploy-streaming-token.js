// Script to deploy the StreamingToken contract to a network
const hre = require('hardhat');

async function main() {
  console.log('Deploying StreamingToken contract...');

  // Get the contract factory
  const StreamingToken = await hre.ethers.getContractFactory('StreamingToken');

  // Deploy the contract
  const streamingToken = await StreamingToken.deploy();
  await streamingToken.deployed();

  console.log(`StreamingToken deployed to: ${streamingToken.address}`);
  console.log(`Transaction hash: ${streamingToken.deployTransaction.hash}`);
  console.log('Deployment successful!');

  // Wait for some blocks to be mined to ensure the contract is deployed
  console.log('Waiting for contract to be mined...');
  await streamingToken.deployTransaction.wait(5); // Wait for 5 confirmations
  console.log('Contract confirmed with 5 blocks!');

  // Log the contract information for verification
  console.log(`\nContract deployment information for verification on Etherscan:`);
  console.log(`Contract Address: ${streamingToken.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`\nTo verify on Etherscan, run:`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${streamingToken.address}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
