/**
 * Layer 2 Configuration
 *
 * This configuration file defines the networks and settings for Layer 2 solutions
 * supported by our Web3 streaming platform. It includes RPC endpoints, contract addresses,
 * and network-specific parameters.
 */

module.exports = {
  // Default network to use when none is specified
  DEFAULT_NETWORK_ID: 137, // Polygon by default

  // Network names for UI display
  NETWORK_NAMES: {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    42161: 'Arbitrum One',
    10: 'Optimism',
    8453: 'Base',
    5: 'Ethereum Goerli (Testnet)',
    80001: 'Polygon Mumbai (Testnet)',
    421613: 'Arbitrum Goerli (Testnet)',
    420: 'Optimism Goerli (Testnet)',
    84531: 'Base Goerli (Testnet)'
  },

  // RPC endpoints for each network
  RPC_ENDPOINTS: {
    // Mainnet networks
    1: process.env.ETH_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    137: process.env.POLYGON_MAINNET_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
    42161: process.env.ARBITRUM_ONE_RPC || 'https://arb-mainnet.g.alchemy.com/v2/your-api-key',
    10: process.env.OPTIMISM_MAINNET_RPC || 'https://opt-mainnet.g.alchemy.com/v2/your-api-key',
    8453: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',

    // Testnet networks
    5: process.env.ETH_GOERLI_RPC || 'https://eth-goerli.g.alchemy.com/v2/your-api-key',
    80001: process.env.POLYGON_MUMBAI_RPC || 'https://polygon-mumbai.g.alchemy.com/v2/your-api-key',
    421613: process.env.ARBITRUM_GOERLI_RPC || 'https://arb-goerli.g.alchemy.com/v2/your-api-key',
    420: process.env.OPTIMISM_GOERLI_RPC || 'https://opt-goerli.g.alchemy.com/v2/your-api-key',
    84531: process.env.BASE_GOERLI_RPC || 'https://goerli.base.org'
  },

  // IPFS Gateway URLs
  IPFS_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://ipfs.infura.io/ipfs/'
  ],

  // Default IPFS Gateway to use
  DEFAULT_IPFS_GATEWAY: 'https://cloudflare-ipfs.com/ipfs/',

  // Gas savings compared to Ethereum Mainnet (approximate percentages)
  GAS_SAVINGS: {
    137: 99.9, // Polygon (99.9% cheaper than Ethereum)
    42161: 90, // Arbitrum One (90% cheaper for most transactions)
    10: 99, // Optimism (99% cheaper)
    8453: 99 // Base (99% cheaper)
  },

  // Contract addresses for each network
  CONTRACT_ADDRESSES: {
    // Mainnet contract addresses
    1: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },
    137: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },
    42161: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },
    10: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },
    8453: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },

    // Testnet contract addresses (useful for development and testing)
    5: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    },
    80001: {
      CONTENT_REGISTRY: '0x000000000000000000000000000000000000000', // placeholder
      STREAMING_ACCESS: '0x000000000000000000000000000000000000000', // placeholder
      TOKEN_GATEWAY: '0x000000000000000000000000000000000000000', // placeholder
      PROXY_ADMIN: '0x000000000000000000000000000000000000000' // placeholder
    }
  },

  // Transaction confirmation requirements for each network
  CONFIRMATIONS: {
    1: 2, // Ethereum Mainnet - wait for 2 confirmations
    137: 10, // Polygon - wait for 10 confirmations (~5 seconds)
    42161: 1, // Arbitrum One - 1 confirmation is sufficient
    10: 1, // Optimism - 1 confirmation is sufficient
    8453: 1, // Base - 1 confirmation is sufficient
    5: 1, // Goerli testnet
    80001: 5, // Mumbai testnet
    421613: 1, // Arbitrum Goerli
    420: 1, // Optimism Goerli
    84531: 1 // Base Goerli
  },

  // Whether network supports EIP-1559 gas model
  SUPPORTS_EIP1559: {
    1: true, // Ethereum Mainnet
    137: true, // Polygon
    42161: false, // Arbitrum has custom gas model
    10: false, // Optimism has custom gas model
    8453: false, // Base has custom gas model
    5: true, // Goerli testnet
    80001: true, // Mumbai testnet
    421613: false, // Arbitrum Goerli
    420: false, // Optimism Goerli
    84531: false // Base Goerli
  },

  // Network block times in seconds (approximate)
  BLOCK_TIMES: {
    1: 12, // Ethereum Mainnet ~12 seconds
    137: 2, // Polygon ~2 seconds
    42161: 0.25, // Arbitrum One ~250ms
    10: 2, // Optimism ~2 seconds
    8453: 2 // Base ~2 seconds
  },

  // Bridge information for moving assets between networks
  BRIDGES: {
    POLYGON: {
      URL: 'https://wallet.polygon.technology/bridge/',
      TOKEN_MAPPER: {
        // Maps Ethereum token addresses to their Polygon counterparts
        '0x0000000000000000000000000000000000000000': '0x0000000000000000000000000000000000001010' // MATIC
      }
    },
    ARBITRUM: {
      URL: 'https://bridge.arbitrum.io/',
      TOKEN_MAPPER: {}
    },
    OPTIMISM: {
      URL: 'https://app.optimism.io/bridge',
      TOKEN_MAPPER: {}
    },
    BASE: {
      URL: 'https://bridge.base.org',
      TOKEN_MAPPER: {}
    }
  },

  // Maximum batch sizes for different operations
  BATCH_LIMITS: {
    CONTENT_REGISTRATION: {
      1: 5, // Ethereum Mainnet - limit to 5 items per batch due to gas costs
      137: 50, // Polygon - can handle larger batches
      42161: 20, // Arbitrum One
      10: 50, // Optimism
      8453: 50 // Base
    },
    ACCESS_GRANTS: {
      1: 10, // Ethereum Mainnet
      137: 100, // Polygon
      42161: 50, // Arbitrum One
      10: 100, // Optimism
      8453: 100 // Base
    }
  }
};