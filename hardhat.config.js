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

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // Use the new IR-based code generator for better optimization
    }
  },
  networks: {
    // Development networks
    hardhat: {
      chainId: 31337,
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      mining: {
        auto: true,
        interval: 5000 // Mine a block every 5 seconds
      }
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },

    // Production Layer 1 network (high gas fees)
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 1,
      gasMultiplier: 1.2, // Add buffer for gas price fluctuations
      verify: {
        etherscan: {
          apiKey: ETHERSCAN_API_KEY
        }
      }
    },

    // Layer 2 networks (much lower gas fees)
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 137,
      gasPrice: 50000000000, // 50 gwei default
      gasMultiplier: 1.2
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 42161
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 10
    },
    base: {
      url: 'https://mainnet.base.org',
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 8453
    },

    // Test networks
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 11155111
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
      accounts:
        PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          ? [PRIVATE_KEY]
          : [],
      chainId: 80001,
      gasPrice: 35000000000 // 35 gwei
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      optimisticEthereum: OPTIMISM_API_KEY,
      arbitrumOne: ARBITRUM_API_KEY,
      base: BASE_API_KEY,
      sepolia: ETHERSCAN_API_KEY
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 50,
    outputFile: process.env.CI ? 'gas-report.txt' : undefined,
    noColors: process.env.CI ? true : false
  },
  mocha: {
    timeout: 60000 // Increase timeout for tests to 60 seconds
  }
};
