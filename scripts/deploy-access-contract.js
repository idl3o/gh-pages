// @ts-check
const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('Deploying StreamAccess contracts...');

  // Deploy the StreamAccessDeployer
  const StreamAccessDeployer = await ethers.getContractFactory('StreamAccessDeployer');
  const deployer = await StreamAccessDeployer.deploy();
  await deployer.deployed();
  console.log(`StreamAccessDeployer deployed at: ${deployer.address}`);

  // Use the deployer to deploy the full setup
  const tokenName = 'StreamAccess';
  const tokenSymbol = 'STRAC';

  const deployTx = await deployer.deploy(tokenName, tokenSymbol);
  const receipt = await deployTx.wait();

  // Get the deployed event
  const deployedEvent = receipt.events.find(event => event.event === 'Deployed');
  const { accessContract, proxyAdmin, proxy } = deployedEvent.args;

  console.log(`Implementation deployed at: ${accessContract}`);
  console.log(`ProxyAdmin deployed at: ${proxyAdmin}`);
  console.log(`Proxy deployed at: ${proxy}`);

  // Get the StreamAccessContract instance at the proxy address
  const StreamAccessContract = await ethers.getContractFactory('StreamAccessContract');
  const streamAccess = StreamAccessContract.attach(proxy);

  // Verify setup
  console.log(`StreamAccess name: ${await streamAccess.name()}`);
  console.log(`StreamAccess symbol: ${await streamAccess.symbol()}`);

  console.log('Deployment complete!');
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
