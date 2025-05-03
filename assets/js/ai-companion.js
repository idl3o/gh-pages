/**
 * AI Educational Companion
 * Web3 Educational Content Platform
 *
 * Provides educational support and content assistance for the Web3 education platform
 */

class AICompanion {
  constructor() {
    this.initialized = false;
    this.name = 'BlockchainAssistant';
    this.topics = [];
    this.conversationContext = [];
    this.contentSafety = window.contentSafety || window.contentModerator;
    this.expertiseAreas = [
      'blockchain fundamentals',
      'smart contracts',
      'web3 development',
      'defi protocols',
      'token economics',
      'ethereum',
      'solidity',
      'security best practices',
      'nfts',
      'decentralized applications'
    ];
  }

  /**
   * Initialize the AI companion
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} - Whether initialization succeeded
   */
  async initialize(options = {}) {
    if (this.initialized) return true;

    try {
      console.log(`Initializing ${this.name}...`);

      // Initialize content safety system if available
      if (this.contentSafety && !this.contentSafety.initialized) {
        await this.contentSafety.initialize();
      }

      // Load educational topic knowledge base
      await this.loadTopics();

      this.initialized = true;
      console.log(`${this.name} initialized successfully`);

      return true;
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Load educational topics and prepare knowledge base
   * @private
   */
  async loadTopics() {
    // In a production environment, these would be loaded from a database
    // For now, we'll use some predefined topics
    this.topics = [
      {
        id: 'blockchain-basics',
        name: 'Blockchain Fundamentals',
        keywords: ['blockchain', 'distributed ledger', 'decentralization', 'consensus']
      },
      {
        id: 'smart-contracts',
        name: 'Smart Contract Development',
        keywords: ['solidity', 'contract', 'function', 'compiler', 'ethereum']
      },
      {
        id: 'web3-dev',
        name: 'Web3 Development',
        keywords: ['web3.js', 'ethers.js', 'metamask', 'wallet', 'dapp']
      },
      {
        id: 'defi',
        name: 'DeFi Protocols',
        keywords: ['defi', 'lending', 'swap', 'liquidity', 'yield', 'staking']
      },
      {
        id: 'nft',
        name: 'NFT Development',
        keywords: ['nft', 'token', 'erc721', 'erc1155', 'metadata']
      }
    ];
  }

  /**
   * Process a user query and generate an educational response
   * @param {string} userQuery - The query or question from the user
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response object with answer and metadata
   */
  async processQuery(userQuery, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Default options
    const settings = {
      includeCode: options.includeCode !== false,
      contextSize: options.contextSize || 3,
      detailedExplanations: options.detailedExplanations !== false
    };

    try {
      // Apply content safety check if available
      let safeQuery = userQuery;

      if (this.contentSafety) {
        const safetyResult = await this.contentSafety.processContent(userQuery, {
          mode: 'flag',
          context: 'educational-query'
        });

        safeQuery = safetyResult.modifiedContent;

        // If severe safety issues, return generic response
        if (safetyResult.metadata && safetyResult.metadata.severity === 'critical') {
          return {
            answer:
              'I can only provide educational content related to blockchain and Web3 development. Please ask a relevant question.',
            topicMatches: [],
            confidence: 0.2,
            hasCode: false
          };
        }
      }

      // Update conversation context
      this.updateContext(safeQuery);

      // Analyze the query to determine the educational topic
      const topicMatches = this.analyzeQuery(safeQuery);

      // Generate a response based on identified topics
      const response = await this.generateResponse(safeQuery, topicMatches, settings);

      return {
        answer: response.answer,
        topicMatches: topicMatches.slice(0, 2), // Return top 2 matching topics
        confidence: response.confidence,
        hasCode: response.hasCode
      };
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        answer:
          'I apologize, but I encountered an error while processing your question. Please try rephrasing or ask another question about blockchain or Web3.',
        topicMatches: [],
        confidence: 0,
        error: true
      };
    }
  }

  /**
   * Analyze a user query and match to relevant educational topics
   * @param {string} query - User query to analyze
   * @returns {Array} - Matched topics with confidence scores
   * @private
   */
  analyzeQuery(query) {
    const normalizedQuery = query.toLowerCase();
    const topicMatches = [];

    // Match query against known educational topics
    for (const topic of this.topics) {
      let matchScore = 0;

      // Check for topic name in query
      if (normalizedQuery.includes(topic.name.toLowerCase())) {
        matchScore += 5;
      }

      // Check for keyword matches
      for (const keyword of topic.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          matchScore += 2;
        }
      }

      if (matchScore > 0) {
        topicMatches.push({
          id: topic.id,
          name: topic.name,
          confidence: Math.min(matchScore / 10, 1) // Normalize to 0-1
        });
      }
    }

    // Sort by confidence score
    topicMatches.sort((a, b) => b.confidence - a.confidence);

    // If no matches, return general blockchain topic with low confidence
    if (topicMatches.length === 0) {
      topicMatches.push({
        id: 'general',
        name: 'General Blockchain',
        confidence: 0.3
      });
    }

    return topicMatches;
  }

  /**
   * Generate an educational response based on the query and matched topics
   * @param {string} query - User query
   * @param {Array} topicMatches - Matched educational topics
   * @param {Object} settings - Response settings
   * @returns {Promise<Object>} - Generated response
   * @private
   */
  async generateResponse(query, topicMatches, settings) {
    // In a production environment, this would use an actual AI model or API
    // For this demo, we'll use predefined responses based on topic matching

    // Get primary topic
    const primaryTopic = topicMatches[0] ? topicMatches[0].id : 'general';
    const confidence = topicMatches[0] ? topicMatches[0].confidence : 0.3;

    let answer = '';
    let hasCode = false;

    // Educational content responses based on topic
    switch (primaryTopic) {
      case 'blockchain-basics':
        answer = this.getBlockchainBasicsResponse(query, settings);
        break;

      case 'smart-contracts':
        answer = this.getSmartContractResponse(query, settings);
        hasCode = settings.includeCode;
        break;

      case 'web3-dev':
        answer = this.getWeb3DevResponse(query, settings);
        hasCode = settings.includeCode;
        break;

      case 'defi':
        answer = this.getDefiResponse(query, settings);
        hasCode = query.toLowerCase().includes('code') && settings.includeCode;
        break;

      case 'nft':
        answer = this.getNftResponse(query, settings);
        hasCode = query.toLowerCase().includes('code') && settings.includeCode;
        break;

      default:
        answer =
          "Blockchain technology is a distributed ledger system that enables secure, transparent, and decentralized record-keeping. The core innovation is the ability to establish trust without requiring a central authority. Is there a specific aspect of blockchain or Web3 you'd like to learn about?";
    }

    // Include a learning suggestion from Dr. Blockchain
    if (Math.random() > 0.7) {
      // 30% chance to include a suggestion
      answer += `\n\nDr. Blockchain's tip: ${this.getDrBlockchainTip(primaryTopic)}`;
    }

    return {
      answer,
      confidence,
      hasCode
    };
  }

  /**
   * Get a response for blockchain basics queries
   * @param {string} query - User query
   * @param {Object} settings - Response settings
   * @returns {string} - Educational response
   * @private
   */
  getBlockchainBasicsResponse(query, settings) {
    const q = query.toLowerCase();

    if (q.includes('what is') && q.includes('blockchain')) {
      return 'A blockchain is a distributed digital ledger that records transactions across many computers in a way that ensures security, transparency, and immutability. Each block contains a cryptographic hash of the previous block, transaction data, and a timestamp, creating a secure chain of information that is resistant to modification.';
    }

    if (q.includes('consensus')) {
      return "Consensus mechanisms are protocols that ensure all nodes in a blockchain network agree on the validity of transactions. Common consensus mechanisms include:\n\n1. Proof of Work (PoW): Miners solve complex mathematical puzzles to validate transactions and create new blocks. Used by Bitcoin.\n\n2. Proof of Stake (PoS): Validators are chosen to create blocks based on how many coins they hold and are willing to 'stake' as collateral. Used by Ethereum 2.0.\n\n3. Delegated Proof of Stake (DPoS): Token holders vote for 'delegates' who validate transactions. Used by EOS.";
    }

    if (q.includes('decentralization') || q.includes('decentralized')) {
      return 'Decentralization in blockchain refers to the distribution of power and control away from a central authority. Three key types of decentralization are:\n\n1. Architectural decentralization: The physical infrastructure is distributed (many computers)\n2. Political decentralization: No single entity controls the system\n3. Logical decentralization: The interface and data structures appear to each user as if they were only interacting with their own system\n\nDecentralization provides benefits like censorship resistance, increased security through redundancy, and reduced vulnerability to single points of failure.';
    }

    // Default response for blockchain basics
    return 'Blockchain technology creates a secure, immutable record of transactions through distributed consensus. Each block contains transaction data and a reference to the previous block, forming a chain. This design ensures data integrity without requiring a trusted central authority. The technology enables applications beyond cryptocurrency, including smart contracts, decentralized finance, and secure supply chain tracking.';
  }

  /**
   * Get a response for smart contract queries
   * @param {string} query - User query
   * @param {Object} settings - Response settings
   * @returns {string} - Educational response with code examples
   * @private
   */
  getSmartContractResponse(query, settings) {
    const q = query.toLowerCase();
    let response = '';

    if (q.includes('what is') && q.includes('smart contract')) {
      response =
        "A smart contract is a self-executing program stored on a blockchain that runs automatically when predetermined conditions are met. Smart contracts automate agreements so that all participants can be immediately certain of the outcome, without any intermediary's involvement. They typically have the following characteristics:\n\n1. Autonomy: Once deployed, they execute automatically\n2. Transparency: All parties can see the contract code\n3. Immutability: Once deployed, they cannot be altered\n4. Efficiency: They automate processes and remove intermediaries";
    } else if (q.includes('solidity')) {
      response =
        "Solidity is the primary programming language for writing smart contracts on Ethereum and EVM-compatible blockchains. It's a statically typed language designed to target the Ethereum Virtual Machine (EVM).";

      if (settings.includeCode) {
        response +=
          "\n\nHere's a simple Solidity smart contract example:\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract SimpleStorage {\n    uint256 private storedData;\n    \n    function set(uint256 x) public {\n        storedData = x;\n    }\n    \n    function get() public view returns (uint256) {\n        return storedData;\n    }\n}\n```\n\nThis contract allows storing and retrieving a single unsigned integer value.";
      }
    } else if (q.includes('function') && q.includes('modifier')) {
      response =
        'Function modifiers in Solidity allow you to change the behavior of functions in a declarative way. They can be used to automatically check conditions before a function is executed.';

      if (settings.includeCode) {
        response +=
          '\n\nHere\'s an example of a function modifier:\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Owned {\n    address public owner;\n    \n    constructor() {\n        owner = msg.sender;\n    }\n    \n    // Modifier to check if caller is owner\n    modifier onlyOwner() {\n        require(msg.sender == owner, "Not the contract owner");\n        _; // This underscore represents where the modified function code is inserted\n    }\n    \n    // Function that uses the modifier\n    function transferOwnership(address newOwner) public onlyOwner {\n        owner = newOwner;\n    }\n}\n```';
      }
    } else {
      response =
        'Smart contracts are self-executing programs stored on a blockchain that run when predetermined conditions are met. They enforce agreements automatically without third parties.';

      if (settings.includeCode) {
        response +=
          '\n\nBasic smart contract structure in Solidity:\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // State variables\n    address public owner;\n    uint public value;\n    \n    // Events\n    event ValueChanged(uint newValue);\n    \n    // Constructor\n    constructor() {\n        owner = msg.sender;\n    }\n    \n    // Function to update value\n    function updateValue(uint newValue) public {\n        value = newValue;\n        emit ValueChanged(newValue);\n    }\n}\n```';
      }
    }

    return response;
  }

  /**
   * Get a response for Web3 development queries
   * @param {string} query - User query
   * @param {Object} settings - Response settings
   * @returns {string} - Educational response with code examples
   * @private
   */
  getWeb3DevResponse(query, settings) {
    const q = query.toLowerCase();
    let response = '';

    if (q.includes('web3.js')) {
      response =
        "Web3.js is a collection of libraries that allow you to interact with a local or remote Ethereum node using HTTP, IPC, or WebSocket. It's the primary JavaScript library for interacting with the Ethereum blockchain.";

      if (settings.includeCode) {
        response +=
          "\n\nHere's how to connect to an Ethereum node and check an account balance:\n\n```javascript\n// Connect to an Ethereum node\nconst Web3 = require('web3');\nconst web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');\n\n// Check account balance\nasync function getBalance(address) {\n  try {\n    const balanceWei = await web3.eth.getBalance(address);\n    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');\n    console.log(`Balance: ${balanceEth} ETH`);\n    return balanceEth;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}\n\ngetBalance('0xYourEthereumAddress');\n```";
      }
    } else if (q.includes('ethers.js')) {
      response =
        'ethers.js is a complete, compact library for interacting with the Ethereum blockchain and its ecosystem. Many developers prefer it over Web3.js for its smaller size and more intuitive API.';

      if (settings.includeCode) {
        response +=
          "\n\nHere's how to connect to Ethereum and interact with a contract using ethers.js:\n\n```javascript\n// Import ethers\nconst { ethers } = require('ethers');\n\n// Connect to the Ethereum network\nconst provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');\n\n// Contract ABI and address\nconst abi = [ /* Contract ABI */ ];\nconst contractAddress = '0xContractAddress';\n\n// Create contract instance\nconst contract = new ethers.Contract(contractAddress, abi, provider);\n\n// Read data from the contract\nasync function readContract() {\n  try {\n    const result = await contract.someMethod();\n    console.log('Result:', result);\n    return result;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}\n\nreadContract();\n```";
      }
    } else if (q.includes('metamask')) {
      response =
        'MetaMask is a popular browser extension and mobile app that serves as an Ethereum wallet and allows users to interact with decentralized applications (dApps). It injects a Web3 instance into the browser, giving websites access to the Ethereum blockchain.';

      if (settings.includeCode) {
        response +=
          "\n\nHere's a basic example of connecting a web application to MetaMask:\n\n```javascript\n// Check if MetaMask is installed\nif (typeof window.ethereum !== 'undefined') {\n  console.log('MetaMask is installed!');\n  \n  // Request account access\n  document.getElementById('connectButton').addEventListener('click', async () => {\n    try {\n      // Request account access\n      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });\n      \n      // Get the connected account\n      const account = accounts[0];\n      console.log('Connected account:', account);\n      \n      // Update UI to show connected account\n      document.getElementById('accountDisplay').textContent = account;\n    } catch (error) {\n      console.error('Error connecting to MetaMask:', error);\n    }\n  });\n} else {\n  console.log('MetaMask is not installed');\n  alert('Please install MetaMask to use this dApp!');  \n}\n```";
      }
    } else {
      response =
        'Web3 development involves building applications that interact with blockchains. Unlike traditional web applications that connect to a centralized database, Web3 applications (dApps) connect to a blockchain network through libraries like Web3.js or ethers.js.';

      if (settings.includeCode) {
        response +=
          "\n\nHere's a simple example of creating a dApp that connects to Ethereum using ethers.js:\n\n```javascript\n// Basic dApp setup with ethers.js\n// 1. Connect to provider\nconst provider = new ethers.providers.Web3Provider(window.ethereum);\n\n// 2. Connect wallet\nasync function connectWallet() {\n  // Request user's permission to connect\n  await provider.send(\"eth_requestAccounts\", []);\n  const signer = provider.getSigner();\n  const address = await signer.getAddress();\n  document.getElementById('wallet-address').textContent = address;\n  return signer;\n}\n\n// 3. Interact with a smart contract\nfunction getContract(contractAddress, abi, signer) {\n  return new ethers.Contract(contractAddress, abi, signer);\n}\n\n// 4. Call a contract function\nasync function readContractData(contract) {\n  const result = await contract.someFunction();\n  document.getElementById('result').textContent = result;\n}\n\n```";
      }
    }

    return response;
  }

  /**
   * Get a response for DeFi-related queries
   * @param {string} query - User query
   * @param {Object} settings - Response settings
   * @returns {string} - Educational response
   * @private
   */
  getDefiResponse(query, settings) {
    const q = query.toLowerCase();

    if (q.includes('what is') && q.includes('defi')) {
      return 'DeFi (Decentralized Finance) refers to financial applications built on blockchain technology that aim to recreate and improve upon traditional financial systems in a decentralized manner, without relying on central authorities or intermediaries. Key components of DeFi include:\n\n1. Lending and borrowing platforms\n2. Decentralized exchanges (DEXes)\n3. Stablecoins\n4. Yield farming\n5. Liquidity mining\n6. Synthetic assets\n7. Insurance protocols\n\nDeFi applications are typically built using smart contracts, primarily on the Ethereum blockchain, although other blockchain platforms have emerging DeFi ecosystems as well.';
    }

    if (q.includes('liquidity') && (q.includes('pool') || q.includes('providing'))) {
      let response =
        'Liquidity pools are a fundamental DeFi concept where users deposit pairs of tokens into a smart contract to facilitate trading on decentralized exchanges. Liquidity providers (LPs) earn fees from trades that occur through these pools.';

      if (settings.includeCode && q.includes('code')) {
        response +=
          "\n\nHere's a simplified example of interacting with a Uniswap V2 liquidity pool:\n\n```javascript\n// Using ethers.js to interact with Uniswap V2 pool\nconst { ethers } = require('ethers');\n\n// Connect to provider\nconst provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');\n\n// Uniswap V2 Pair ABI (simplified)\nconst pairAbi = [\n  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',\n  'function token0() external view returns (address)',\n  'function token1() external view returns (address)'\n];\n\n// ETH-USDC pair on Uniswap V2\nconst pairAddress = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc';\n\n// Create contract instance\nconst pair = new ethers.Contract(pairAddress, pairAbi, provider);\n\nasync function getPoolInfo() {\n  // Get token addresses\n  const token0Address = await pair.token0();\n  const token1Address = await pair.token1();\n  \n  // Get reserves\n  const reserves = await pair.getReserves();\n  \n  console.log(`Token0: ${token0Address}\\nToken1: ${token1Address}`);\n  console.log(`Reserve0: ${reserves.reserve0}\\nReserve1: ${reserves.reserve1}`);\n}\n\ngetPoolInfo();\n```";
      }

      return response;
    }

    if (q.includes('yield') && q.includes('farming')) {
      return "Yield farming is a practice where users provide liquidity to DeFi protocols in exchange for rewards, typically in the form of the protocol's governance tokens. This incentivizes users to contribute liquidity while gaining exposure to potentially valuable governance tokens.\n\nYield farming strategies can be complex and may involve:\n\n1. Providing liquidity to DEXes like Uniswap or SushiSwap\n2. Lending assets on platforms like Aave or Compound\n3. Staking LP tokens in yield optimizers\n4. Moving assets between protocols to maximize returns\n\nIt's important to note that yield farming carries significant risks, including smart contract vulnerabilities, impermanent loss, and token value volatility.";
    }

    return "Decentralized Finance (DeFi) uses blockchain technology to recreate traditional financial systems without intermediaries. DeFi applications enable lending, borrowing, trading, and earning interest in a permissionless way. These protocols are composable, meaning they can be combined like 'money legos' to create complex financial products. Popular DeFi categories include decentralized exchanges (DEXes), lending platforms, derivatives, insurance, and yield optimization protocols.";
  }

  /**
   * Get a response for NFT-related queries
   * @param {string} query - User query
   * @param {Object} settings - Response settings
   * @returns {string} - Educational response
   * @private
   */
  getNftResponse(query, settings) {
    const q = query.toLowerCase();

    if (q.includes('what is') && q.includes('nft')) {
      return 'NFT stands for Non-Fungible Token. Unlike cryptocurrencies such as Bitcoin or Ethereum, which are fungible (each unit is identical to every other unit), NFTs are unique digital assets with distinct values. Key characteristics of NFTs include:\n\n1. Uniqueness: Each NFT has unique properties and identifiers\n2. Indivisibility: NFTs generally cannot be divided into smaller units\n3. Provable scarcity: The blockchain verifies the limited supply\n4. Provenance: Ownership history is permanently recorded\n\nNFTs are commonly used for digital art, collectibles, gaming items, virtual real estate, event tickets, and increasingly for representing real-world assets.';
    }

    if ((q.includes('erc721') || q.includes('erc-721')) && q.includes('standard')) {
      let response =
        'ERC-721 is the standard interface for non-fungible tokens on Ethereum. It defines the minimum interface a smart contract must implement to allow unique tokens to be managed, owned, and traded. Each ERC-721 token has a unique tokenId, even within the same smart contract.';

      if (settings.includeCode && q.includes('code')) {
        response +=
          '\n\nHere\'s a simple ERC-721 implementation:\n\n```solidity\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\nimport "@openzeppelin/contracts/token/ERC721/ERC721.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\n\ncontract MyNFT is ERC721, Ownable {\n    uint256 private _tokenIdCounter;\n    \n    // Base URI for metadata\n    string private _baseTokenURI;\n    \n    constructor(string memory name, string memory symbol, string memory baseURI) \n        ERC721(name, symbol) \n    {\n        _baseTokenURI = baseURI;\n    }\n    \n    function mint(address to) public onlyOwner {\n        _safeMint(to, _tokenIdCounter);\n        _tokenIdCounter++;\n    }\n    \n    function _baseURI() internal view override returns (string memory) {\n        return _baseTokenURI;\n    }\n    \n    function setBaseURI(string memory baseURI) public onlyOwner {\n        _baseTokenURI = baseURI;\n    }\n}\n```';
      }

      return response;
    }

    if (q.includes('metadata')) {
      return "NFT metadata is the descriptive information associated with an NFT that defines its properties, appearance, and functionality. Metadata typically includes:\n\n1. Name: The title of the NFT\n2. Description: Details about what the NFT represents\n3. Image: A URL pointing to the visual representation\n4. Attributes/Traits: Properties that define the NFT's characteristics\n\nMetadata is usually stored using one of these methods:\n\n1. On-chain: Directly in the blockchain (expensive but most durable)\n2. IPFS: A decentralized file system (good balance of durability and cost)\n3. Centralized storage: Standard web servers (least durable but cheapest)\n\nThe metadata standard for ERC-721 tokens typically follows the structure defined in EIP-721, with a URI pointing to a JSON file containing the metadata.";
    }

    return "Non-Fungible Tokens (NFTs) are unique digital assets verified using blockchain technology. Unlike cryptocurrencies, each NFT has distinct properties that make it non-interchangeable. NFTs typically follow the ERC-721 or ERC-1155 standards on Ethereum, and similar standards on other blockchains. They've gained popularity for digital art, collectibles, gaming items, and representing ownership rights to both digital and physical assets.";
  }

  /**
   * Get an expert tip from Dr. Blockchain
   * @param {string} topic - The educational topic
   * @returns {string} - Expert tip
   * @private
   */
  getDrBlockchainTip(topic) {
    const tips = {
      'blockchain-basics': [
        'Always remember that blockchains prioritize different properties—decentralization, security, and scalability—and there are inherent tradeoffs between them.',
        'When evaluating a blockchain project, first understand its consensus mechanism, as this defines its security model and throughput capabilities.',
        "The immutability of blockchain means code and transactions can't be easily changed once deployed—think carefully before executing transactions."
      ],
      'smart-contracts': [
        'Test your smart contracts extensively before deployment. Once deployed, they cannot be easily modified due to blockchain immutability.',
        'Always include proper error handling and input validation in your smart contracts to prevent unexpected behavior.',
        'Consider gas optimization from the beginning of your smart contract development process to make your contracts more efficient and cost-effective.'
      ],
      'web3-dev': [
        'Always handle promises properly when interacting with blockchain via JavaScript libraries like ethers.js or web3.js.',
        'Consider implementing retry logic when sending transactions, as network congestion can cause delays or failures.',
        'Keep your users informed about the state of blockchain transactions with clear UI feedback during the confirmation process.'
      ],
      defi: [
        'Always research the security history and audit status of DeFi protocols before committing significant funds.',
        'Understand impermanent loss before providing liquidity to AMMs (Automated Market Makers).',
        'Be aware that high yields in DeFi often come with correspondingly high risks; there are no guaranteed returns.'
      ],
      nft: [
        'When developing NFT projects, consider where and how metadata will be stored for long-term durability.',
        'Gas optimization is particularly important for NFT projects that involve minting multiple tokens.',
        'Consider implementing lazy minting if you expect high demand to improve user experience and reduce failed transactions.'
      ],
      general: [
        'The best way to learn blockchain development is by building small projects and gradually increasing complexity.',
        'Keep up with the latest security best practices, as the blockchain space evolves rapidly.',
        'Join developer communities to share knowledge and stay updated on the latest developments in the ecosystem.'
      ]
    };

    const topicTips = tips[topic] || tips.general;
    return topicTips[Math.floor(Math.random() * topicTips.length)];
  }

  /**
   * Update the conversation context with a new query
   * @param {string} query - User query to add to context
   * @private
   */
  updateContext(query) {
    // Keep a limited context window
    if (this.conversationContext.length >= 5) {
      this.conversationContext.shift(); // Remove oldest query
    }

    this.conversationContext.push({
      query,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if the AI companion is knowledgeable about a specific topic
   * @param {string} topic - Topic to check
   * @returns {boolean} - Whether the topic is in the expertise areas
   */
  hasExpertiseIn(topic) {
    return this.expertiseAreas.some(area => topic.toLowerCase().includes(area.toLowerCase()));
  }
}

// Create global singleton instance
window.aiCompanion = new AICompanion();

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.aiCompanion.initialize();
});
