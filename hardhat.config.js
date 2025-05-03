require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

// Provide better error handling for missing environment variables
const getEnvVariable = (key, defaultValue = '', required = false) => {
  const value = process.env[key] || defaultValue;
  if (required && (!value || value === defaultValue)) {
    console.warn(`
⚠️ Environment variable ${key} is not set!
   This is required for deployment to work correctly.
   Please set this variable in your .env file.
`);
  }
  return value;
};

// Load environment variables securely
const PRIVATE_KEY = getEnvVariable(
  'PRIVATE_KEY',
  '0x0000000000000000000000000000000000000000000000000000000000000000'
);
const INFURA_API_KEY = getEnvVariable('INFURA_API_KEY', '');
const ETHERSCAN_API_KEY = getEnvVariable('ETHERSCAN_API_KEY', '');
const POLYGONSCAN_API_KEY = getEnvVariable('POLYGONSCAN_API_KEY', '');
const OPTIMISM_API_KEY = getEnvVariable('OPTIMISM_API_KEY', '');
const ARBITRUM_API_KEY = getEnvVariable('ARBITRUM_API_KEY', '');
const BASE_API_KEY = getEnvVariable('BASE_API_KEY', '');

// Check if we're in a deployment environment and warn about missing keys
const isDeployment = process.argv.some(
  arg =>
    arg.includes('deploy') ||
    arg.includes('verify') ||
    (arg.includes('network') && !arg.includes('localhost'))
);

if (isDeployment) {
  if (PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error('❌ ERROR: PRIVATE_KEY not set in .env file. Required for deployment.');
  }
  if (!INFURA_API_KEY) {
    console.warn('⚠️ WARNING: INFURA_API_KEY not set. Some networks may not work correctly.');
  }
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
