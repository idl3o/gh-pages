/**
 * Stream Cache Service
 *
 * This service provides off-chain caching and processing to optimize the StreamChain platform,
 * reducing the computational and gas burden on the blockchain.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const Web3 = require('web3');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const axios = require('axios');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Initialize Redis for high-performance caching
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize Supabase for structured data storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Web3 providers for multiple networks
const web3Providers = {
  1: new Web3(process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY),
  137: new Web3(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'),
  42161: new Web3(process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'),
  10: new Web3(process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io'),
  8453: new Web3(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
};

// Contract ABIs and addresses
const contractAddresses = {
  1: {
    streamToken: '0x4A8f5F96D5436e43112c87fec524BDCA68088D11',
    streamAMM: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    lazyContentMinter: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  },
  137: {
    streamToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    streamAMM: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    lazyContentMinter: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  },
  42161: {
    streamToken: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    streamAMM: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    lazyContentMinter: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
  },
  10: {
    streamToken: '0x4200000000000000000000000000000000000042',
    streamAMM: '0x4200000000000000000000000000000000000043',
    lazyContentMinter: '0x4200000000000000000000000000000000000044'
  },
  8453: {
    streamToken: '0x8544Fe9d190fD7EC52860abBf45088E81Ee24a93',
    streamAMM: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    lazyContentMinter: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  }
};

/**
 * Blockchain Data Cache Manager
 * Reduces RPC calls by providing a caching layer
 */
class BlockchainCache {
  constructor() {
    this.defaultTTL = 3600; // 1 hour default
    this.shortTTL = 300; // 5 minutes for volatile data
    this.longTTL = 86400; // 24 hours for stable data
  }

  /**
   * Gets contract data with caching
   */
  async getContractData(networkId, contractType, method, args = [], ttl = this.defaultTTL) {
    try {
      const cacheKey = `contract:${networkId}:${contractType}:${method}:${JSON.stringify(args)}`;

      // Try to get from cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cachedData);
      }

      // Not in cache, fetch from blockchain
      console.log(`Cache miss for ${cacheKey}, fetching from chain`);

      // Select correct Web3 provider for the network
      const web3 = web3Providers[networkId];
      if (!web3) {
        throw new Error(`Unsupported network ID: ${networkId}`);
      }

      // Get contract address
      const contractAddress = contractAddresses[networkId][contractType];
      if (!contractAddress) {
        throw new Error(`Contract address not found for ${contractType} on network ${networkId}`);
      }

      // Load contract ABI (simplified here, would need full ABI in production)
      const contractABI = await this._getContractABI(contractType);

      // Create contract instance
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      // Call contract method
      const result = await contract.methods[method](...args).call();

      // Store in cache
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', ttl);

      return result;
    } catch (error) {
      console.error(`Error fetching contract data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets gas price with short TTL caching
   */
  async getGasPriceEstimate(networkId) {
    try {
      const cacheKey = `gas:${networkId}`;

      // Try to get from cache first (short TTL for gas prices)
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Not in cache, fetch current gas price
      const web3 = web3Providers[networkId];
      if (!web3) {
        throw new Error(`Unsupported network ID: ${networkId}`);
      }

      // Get gas price and block details for congestion estimation
      const [gasPrice, block] = await Promise.all([
        web3.eth.getGasPrice(),
        web3.eth.getBlock('latest')
      ]);

      // Calculate congestion level
      const congestion = block.gasUsed / block.gasLimit;

      const result = {
        gasPrice,
        congestion,
        timestamp: Date.now(),
        blockNumber: block.number
      };

      // Store in cache with short TTL
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', this.shortTTL);

      return result;
    } catch (error) {
      console.error(`Error fetching gas price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets content metadata from IPFS with long TTL caching
   */
  async getContentMetadata(ipfsHash) {
    try {
      const cacheKey = `ipfs:${ipfsHash}`;

      // Try to get from cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Not in cache, fetch from IPFS
      const ipfsGateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
      const response = await axios.get(`${ipfsGateway}${ipfsHash}`);

      if (response.status !== 200) {
        throw new Error(`IPFS fetch failed with status: ${response.status}`);
      }

      // Store in cache with long TTL (content metadata rarely changes)
      await redisClient.set(cacheKey, JSON.stringify(response.data), 'EX', this.longTTL);

      return response.data;
    } catch (error) {
      console.error(`Error fetching IPFS data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets contract ABI - would normally load from a file or database
   */
  async _getContractABI(contractType) {
    // Simplified - in production, would load complete ABIs
    const basicABIs = {
      streamToken: [
        { name: "balanceOf", type: "function", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }
      ],
      streamAMM: [
        { name: "getSwapQuote", type: "function", inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }, { type: "uint256" }] }
      ],
      lazyContentMinter: [
        { name: "isContentMinted", type: "function", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }] }
      ]
    };

    return basicABIs[contractType] || [];
  }
}

// Initialize blockchain cache
const blockchainCache = new BlockchainCache();

/**
 * State Channel Manager
 * Handles off-chain micropayments to reduce on-chain transactions
 */
class StateChannelManager {
  constructor() {
    this.channels = {};
  }

  /**
   * Opens a new payment channel
   */
  async openChannel(userId, contentId, receiverId, deposit) {
    try {
      const channelId = `${userId}-${contentId}-${Date.now()}`;

      // Create channel data
      const channel = {
        id: channelId,
        sender: userId,
        receiver: receiverId,
        contentId,
        deposit,
        balance: deposit,
        payments: [],
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        status: 'open'
      };

      // Store in Supabase
      const { data, error } = await supabase
        .from('payment_channels')
        .insert([channel]);

      if (error) {
        throw new Error(`Failed to create payment channel: ${error.message}`);
      }

      // Also cache in Redis for quick access
      await redisClient.set(`channel:${channelId}`, JSON.stringify(channel));

      return channel;
    } catch (error) {
      console.error(`Error opening channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Records a micropayment in the state channel
   */
  async addPayment(channelId, amount, signature) {
    try {
      // Get current channel state
      let channel = await this.getChannel(channelId);

      if (!channel || channel.status !== 'open') {
        throw new Error(`Channel ${channelId} is not open`);
      }

      // Verify signature (simplified, would need actual verification)
      // const isValid = this.verifySignature(channel, amount, signature);
      // if (!isValid) throw new Error('Invalid payment signature');

      // Update channel state
      channel.balance -= amount;
      channel.lastUpdated = Date.now();

      const payment = {
        amount,
        signature,
        timestamp: Date.now()
      };

      channel.payments.push(payment);

      // Update in Supabase
      const { data, error } = await supabase
        .from('payment_channels')
        .update(channel)
        .eq('id', channelId);

      if (error) {
        throw new Error(`Failed to update payment channel: ${error.message}`);
      }

      // Update Redis cache
      await redisClient.set(`channel:${channelId}`, JSON.stringify(channel));

      return channel;
    } catch (error) {
      console.error(`Error adding payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Closes a payment channel
   */
  async closeChannel(channelId, finalSignature) {
    try {
      // Get current channel state
      let channel = await this.getChannel(channelId);

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // Mark channel as closed
      channel.status = 'closed';
      channel.finalSignature = finalSignature;
      channel.closedAt = Date.now();

      // Update in Supabase
      const { data, error } = await supabase
        .from('payment_channels')
        .update(channel)
        .eq('id', channelId);

      if (error) {
        throw new Error(`Failed to close payment channel: ${error.message}`);
      }

      // Update Redis cache
      await redisClient.set(`channel:${channelId}`, JSON.stringify(channel));

      // In production, would trigger on-chain settlement

      return channel;
    } catch (error) {
      console.error(`Error closing channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets channel data
   */
  async getChannel(channelId) {
    try {
      // Try to get from Redis first
      const cachedChannel = await redisClient.get(`channel:${channelId}`);
      if (cachedChannel) {
        return JSON.parse(cachedChannel);
      }

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('payment_channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch payment channel: ${error.message}`);
      }

      if (data) {
        // Cache in Redis
        await redisClient.set(`channel:${channelId}`, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error(`Error getting channel: ${error.message}`);
      throw error;
    }
  }
}

// Initialize state channel manager
const stateChannelManager = new StateChannelManager();

/**
 * Event Aggregator
 * Processes and aggregates blockchain events to reduce query load
 */
class EventAggregator {
  constructor() {
    this.syncStatus = {};
  }

  /**
   * Syncs events for a given contract
   */
  async syncEvents(networkId, contractType, fromBlock = 0) {
    try {
      const cacheKey = `events:${networkId}:${contractType}:lastBlock`;

      // Get last synced block from cache
      let lastSyncedBlock = parseInt(await redisClient.get(cacheKey) || '0');

      // Use the higher of fromBlock or lastSyncedBlock
      fromBlock = Math.max(fromBlock, lastSyncedBlock);

      // Get Web3 instance
      const web3 = web3Providers[networkId];
      if (!web3) {
        throw new Error(`Unsupported network ID: ${networkId}`);
      }

      // Get current block
      const currentBlock = await web3.eth.getBlockNumber();

      // If we're already up to date, do nothing
      if (fromBlock >= currentBlock) {
        console.log(`Events already in sync for ${contractType} on network ${networkId}`);
        return { fromBlock, toBlock: fromBlock, eventCount: 0 };
      }

      // Limit block range to prevent timeout (process in chunks)
      const MAX_BLOCKS = 10000;
      const toBlock = Math.min(currentBlock, fromBlock + MAX_BLOCKS);

      // Get contract address
      const contractAddress = contractAddresses[networkId][contractType];
      if (!contractAddress) {
        throw new Error(`Contract address not found for ${contractType} on network ${networkId}`);
      }

      // Get contract ABI
      const contractABI = await blockchainCache._getContractABI(contractType);

      // Create contract instance
      const contract = new web3.eth.Contract(contractABI, contractAddress);

      // Get events
      // In production, would need specific event handlers for each event type
      const events = await contract.getPastEvents('allEvents', {
        fromBlock,
        toBlock
      });

      console.log(`Synced ${events.length} events for ${contractType} on network ${networkId}`);

      // Process events
      for (const event of events) {
        await this._processEvent(networkId, contractType, event);
      }

      // Update last synced block
      await redisClient.set(cacheKey, toBlock.toString());

      // If there are more blocks to sync, schedule next batch
      if (toBlock < currentBlock) {
        // In production, would use a proper job queue
        console.log(`Scheduling next batch of events for ${contractType} from block ${toBlock + 1}`);
      }

      return { fromBlock, toBlock, eventCount: events.length };
    } catch (error) {
      console.error(`Error syncing events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processes a single event
   */
  async _processEvent(networkId, contractType, event) {
    try {
      // Get event type
      const eventName = event.event;

      // Log event
      console.log(`Processing ${eventName} event on ${contractType} (${networkId}): ${event.transactionHash}`);

      // Store event in Supabase
      const { data, error } = await supabase
        .from('blockchain_events')
        .insert([{
          network_id: networkId,
          contract_type: contractType,
          event_name: eventName,
          transaction_hash: event.transactionHash,
          block_number: event.blockNumber,
          log_index: event.logIndex,
          return_values: event.returnValues,
          timestamp: Date.now()
        }]);

      if (error) {
        console.error(`Error storing event: ${error.message}`);
      }

      // Special handling for specific events (simplified)
      if (contractType === 'lazyContentMinter') {
        if (eventName === 'ContentRegistered' || eventName === 'ContentMinted') {
          await this._handleContentEvent(networkId, event);
        }
      }
      else if (contractType === 'streamAMM') {
        if (eventName === 'LiquidityAdded' || eventName === 'TokenSwapped') {
          await this._handleAMMEvent(networkId, event);
        }
      }
    } catch (error) {
      console.error(`Error processing event: ${error.message}`);
    }
  }

  /**
   * Handles content-related events
   */
  async _handleContentEvent(networkId, event) {
    // Implementation would depend on specific events and data schema
    console.log(`Handling content event: ${event.event}`);

    // For example, we might index the content for searching
    // or trigger notifications to interested users
  }

  /**
   * Handles AMM-related events
   */
  async _handleAMMEvent(networkId, event) {
    // Implementation would depend on specific events and data schema
    console.log(`Handling AMM event: ${event.event}`);

    // For example, we might update price feeds or liquidity stats
  }
}

// Initialize event aggregator
const eventAggregator = new EventAggregator();

// API Routes
// =========================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Get content metadata
 */
app.get('/api/content/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    const metadata = await blockchainCache.getContentMetadata(ipfsHash);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get gas price estimate
 */
app.get('/api/gas/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    const gasData = await blockchainCache.getGasPriceEstimate(parseInt(networkId));
    res.json(gasData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get contract data
 */
app.get('/api/contract/:networkId/:contractType/:method', async (req, res) => {
  try {
    const { networkId, contractType, method } = req.params;
    const args = req.query.args ? JSON.parse(req.query.args) : [];
    const data = await blockchainCache.getContractData(
      parseInt(networkId),
      contractType,
      method,
      args
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * State channel endpoints
 */
app.post('/api/channels', async (req, res) => {
  try {
    const { userId, contentId, receiverId, deposit } = req.body;
    const channel = await stateChannelManager.openChannel(
      userId,
      contentId,
      receiverId,
      deposit
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels/:channelId/payments', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { amount, signature } = req.body;
    const channel = await stateChannelManager.addPayment(
      channelId,
      amount,
      signature
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels/:channelId/close', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { finalSignature } = req.body;
    const channel = await stateChannelManager.closeChannel(
      channelId,
      finalSignature
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await stateChannelManager.getChannel(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Event sync endpoint
 */
app.post('/api/events/sync', async (req, res) => {
  try {
    const { networkId, contractType, fromBlock } = req.body;
    const result = await eventAggregator.syncEvents(
      parseInt(networkId),
      contractType,
      fromBlock
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stream Cache Service listening on port ${PORT}`);
});

module.exports = app;