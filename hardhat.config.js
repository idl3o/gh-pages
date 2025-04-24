require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load environment variables securely
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const OPTIMISM_API_KEY = process.env.OPTIMISM_API_KEY || "";
const ARBITRUM_API_KEY = process.env.ARBITRUM_API_KEY || "";
const BASE_API_KEY = process.env.BASE_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
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
      initialBaseFeePerGas: 0
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },

    // Production Layer 1 network (high gas fees)
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 1,
      gasMultiplier: 1.2 // Add buffer for gas price fluctuations
    },

    // Layer 2 networks (much lower gas fees)
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 50000000000, // 50 gwei default
      gasMultiplier: 1.2
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 42161
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 10
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 8453
    },

    // Test networks
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
      chainId: 5
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [PRIVATE_KEY] : [],
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
      base: BASE_API_KEY
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 50
  }
};
