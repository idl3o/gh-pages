/**
 * Creator Studio for Web3 Educational Platform
 *
 * Enables AI-assisted content creation and stream scheduling for the Web3 educational platform
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const templateItems = document.querySelectorAll('.template-item');
  const projectItems = document.querySelectorAll('.project-item');
  const projectTitle = document.getElementById('project-title');
  const projectType = document.getElementById('project-type');
  const projectDate = document.getElementById('project-date');
  const promptEditor = document.getElementById('prompt-editor');
  const generateContentBtn = document.getElementById('generate-content-btn');
  const aiOutput = document.getElementById('ai-output');
  const newProjectBtn = document.getElementById('new-ai-project');

  // New Studio UI elements
  const studioTabs = document.querySelectorAll('.studio-tab');
  const contentSection = document.getElementById('content-creation-section');
  const streamingSection = document.getElementById('streaming-section');
  const analyticsSection = document.getElementById('analytics-section');
  const scheduleStreamBtn = document.getElementById('schedule-stream-btn');
  const streamScheduleForm = document.getElementById('stream-schedule-form');
  const scheduledStreamsList = document.getElementById('scheduled-streams-list');
  const analyticsChartContainer = document.getElementById('analytics-chart-container');

  // Template data structure
  const templates = {
    tutorial: {
      title: 'Web3 Tutorial',
      description: 'Step-by-step guide explaining a specific Web3 concept or task',
      promptTemplate:
        'Create a comprehensive tutorial on [TOPIC] that includes: \n' +
        '1. Introduction to the concept\n' +
        '2. Prerequisites and setup\n' +
        '3. Step-by-step instructions\n' +
        '4. Code examples with explanations\n' +
        '5. Common pitfalls and troubleshooting\n' +
        '6. Best practices\n' +
        '7. Summary and next steps'
    },
    course: {
      title: 'Course Module',
      description: 'Structured learning module with multiple lessons',
      promptTemplate:
        'Create a course module outline on [TOPIC] with: \n' +
        '1. Learning objectives\n' +
        '2. Module structure (5-7 lessons)\n' +
        '3. Key concepts for each lesson\n' +
        '4. Suggested exercises\n' +
        '5. Assessment questions\n' +
        '6. Additional resources'
    },
    quiz: {
      title: 'Knowledge Assessment',
      description: 'Quiz questions to test understanding of Web3 concepts',
      promptTemplate:
        'Create a comprehensive assessment for [TOPIC] including: \n' +
        '1. Multiple choice questions (5-7)\n' +
        '2. Short answer questions (3-5)\n' +
        '3. Scenario-based questions (2-3)\n' +
        '4. Code analysis questions (if applicable)\n' +
        '5. Answer key with explanations'
    },
    glossary: {
      title: 'Web3 Glossary',
      description: 'Definitions and explanations of key terms',
      promptTemplate:
        'Create a glossary of essential terms related to [TOPIC] with: \n' +
        '1. Term name\n' +
        '2. Concise definition (1-2 sentences)\n' +
        '3. Expanded explanation (1-2 paragraphs)\n' +
        '4. Usage examples\n' +
        '5. Related terms'
    },
    'code-example': {
      title: 'Code Example',
      description: 'Practical code examples with explanations',
      promptTemplate:
        'Create annotated code examples for [TOPIC] including: \n' +
        '1. Introduction to what the code demonstrates\n' +
        '2. Prerequisites and environment setup\n' +
        '3. Complete code with syntax highlighting\n' +
        '4. Line-by-line explanation of key parts\n' +
        '5. Variations for different use cases\n' +
        '6. Best practices and optimization tips'
    },
    'stream-script': {
      title: 'Live Stream Script',
      description: 'Detailed script for educational live streams',
      promptTemplate:
        'Create a detailed live stream script for a [DURATION] minute educational session on [TOPIC] that includes: \n' +
        '1. Opening hook and introduction (2-3 minutes)\n' +
        '2. Topic overview and learning objectives\n' +
        '3. Main content sections with key talking points\n' +
        '4. Visual aid suggestions and demo instructions\n' +
        '5. Interactive elements (polls, questions for audience)\n' +
        '6. Closing summary and call to action\n' +
        '7. Q&A preparation with anticipated questions'
    }
  };

  // Stream categories
  const streamCategories = [
    'Blockchain Basics',
    'Smart Contract Development',
    'DeFi Protocols',
    'NFT Creation & Trading',
    'Web3 UX Design',
    'Crypto Economics',
    'DAO Governance',
    'Metaverse Development',
    'Zero Knowledge Proofs',
    'Layer 2 Solutions'
  ];

  // State
  let currentTemplate = null;
  let generating = false;
  let streamingService = null;
  let currentTab = 'content'; // Default tab
  let analyticsData = {};
  let analyticsChart = null;

  // Initialize StreamingService when available
  function initStreamingService() {
    if (window.StreamingService) {
      streamingService = new window.StreamingService();
      console.log('Streaming service initialized');

      // Load scheduled streams if user is connected
      if (streamingService.currentAccount) {
        loadScheduledStreams();
        loadStreamAnalytics();
      }

      // Listen for wallet connection events
      streamingService.on('walletConnected', (account) => {
        console.log('Wallet connected:', account);
        loadScheduledStreams();
        loadStreamAnalytics();
        updateUIForConnectedWallet(account);
      });

      // Listen for stream scheduling events
      streamingService.on('streamScheduled', (streamInfo) => {
        console.log('Stream scheduled:', streamInfo);
        addScheduledStreamToUI(streamInfo);
      });
    } else {
      console.warn('Streaming service not available');
      // Disable streaming features if service not available
      if (streamingSection) {
        streamingSection.innerHTML = `
          <div class="feature-unavailable">
            <i class="ri-signal-wifi-error-line"></i>
            <p>Streaming service is currently unavailable</p>
            <p class="subtext">Please check your connection or try again later</p>
          </div>
        `;
      }
    }
  }

  // Event listeners
  templateItems.forEach(item => {
    item.addEventListener('click', () => selectTemplate(item));
  });

  projectItems.forEach(item => {
    item.addEventListener('click', () => loadProject(item));
  });

  if (generateContentBtn) {
    generateContentBtn.addEventListener('click', generateContent);
  }

  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', createNewProject);
  }

  // Tab navigation listeners
  if (studioTabs) {
    studioTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        switchTab(tabId);
      });
    });
  }

  // Stream scheduling listeners
  if (scheduleStreamBtn) {
    scheduleStreamBtn.addEventListener('click', () => {
      showStreamScheduleModal();
    });
  }

  if (streamScheduleForm) {
    streamScheduleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      scheduleNewStream();
    });
  }

  // Initialize studio
  function initStudio() {
    // Check if AI companion is available
    if (window.contentSafety) {
      console.log('Content safety module detected');
    } else {
      console.warn('Content safety module not loaded');
    }

    // Initialize streaming service
    initStreamingService();

    // Set up the studio UI
    setupStudioUI();

    // Initialize charts
    if (analyticsSection && typeof Chart !== 'undefined') {
      setupAnalyticsCharts();
    }
  }

  /**
   * Set up initial studio UI
   */
  function setupStudioUI() {
    // Set up stream categories in form if element exists
    const categorySelect = document.getElementById('stream-category');
    if (categorySelect) {
      streamCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase().replace(/\s+/g, '-');
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }

    // Initialize date-time pickers if available
    if (typeof flatpickr !== 'undefined') {
      flatpickr('#stream-date', {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true
      });
    }

    // Show content tab by default
    switchTab('content');
  }

  /**
   * Switch between studio tabs
   */
  function switchTab(tabId) {
    // Update tab state
    currentTab = tabId;

    // Update active tab indicator
    if (studioTabs) {
      studioTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }

    // Show appropriate section
    if (contentSection) contentSection.style.display = tabId === 'content' ? 'block' : 'none';
    if (streamingSection) streamingSection.style.display = tabId === 'streaming' ? 'block' : 'none';
    if (analyticsSection) analyticsSection.style.display = tabId === 'analytics' ? 'block' : 'none';

    // Load data for the active tab if needed
    if (tabId === 'streaming' && streamingService) {
      loadScheduledStreams();
    } else if (tabId === 'analytics' && streamingService) {
      loadStreamAnalytics();
    }
  }

  /**
   * Select a content template
   */
  function selectTemplate(templateElement) {
    // Clear previous selection
    templateItems.forEach(item => item.classList.remove('active'));

    // Set new selection
    templateElement.classList.add('active');
    currentTemplate = templateElement.getAttribute('data-template');

    // Update UI
    updateTemplateUI(currentTemplate);
  }

  /**
   * Update UI based on selected template
   */
  function updateTemplateUI(templateKey) {
    if (!templates[templateKey]) return;

    const template = templates[templateKey];
    projectTitle.textContent = template.title;
    projectType.textContent = template.title;
    promptEditor.value = template.promptTemplate;

    // Reset output
    aiOutput.innerHTML = `
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i class="ri-robot-line"></i>
        </div>
        <p>Your AI-generated ${template.title.toLowerCase()} will appear here.</p>
        <p>Customize the prompt template and click "Generate Content".</p>
      </div>
    `;
  }

  /**
   * Generate content from prompt
   */
  async function generateContent() {
    if (generating || !promptEditor.value.trim()) return;

    generating = true;
    generateContentBtn.disabled = true;
    generateContentBtn.innerHTML = '<i class="ri-loader-4-line"></i> Generating...';

    // Show generating indicator
    aiOutput.innerHTML = `
      <div class="generating-indicator">
        <div class="spinner"></div>
        <p>Generating educational content...</p>
        <p class="subtext">This may take a minute</p>
      </div>
    `;

    try {
      // In a production app, this would be an API call to an AI service
      // For demonstration, we'll use simulated responses
      const content = await simulateAIGeneration(currentTemplate, promptEditor.value);

      // Apply content safety check if available
      let safeContent = content;
      if (window.contentSafety) {
        try {
          const result = await window.contentSafety.processContent(content, {
            mode: 'check',
            context: 'educational-content'
          });

          if (!result.safe) {
            // Handle unsafe content
            throw new Error('Generated content contains potentially inappropriate material');
          }
        } catch (error) {
          console.error('Content safety error:', error);
        }
      }

      // Display content
      displayGeneratedContent(safeContent);
    } catch (error) {
      console.error('Generation error:', error);
      aiOutput.innerHTML = `
        <div class="error-message">
          <i class="ri-error-warning-line"></i>
          <p>Error generating content: ${error.message}</p>
          <button class="btn-secondary btn-sm retry-btn">Try Again</button>
        </div>
      `;

      // Add retry functionality
      document.querySelector('.retry-btn')?.addEventListener('click', generateContent);
    } finally {
      generating = false;
      generateContentBtn.disabled = false;
      generateContentBtn.innerHTML = '<i class="ri-robot-line"></i> Generate Content';
    }
  }

  /**
   * Display generated content in the UI
   */
  function displayGeneratedContent(content) {
    // Parse markdown to HTML for display
    const formattedContent = parseMarkdown(content);

    // Update output area
    aiOutput.innerHTML = `
      <div class="generated-content">
        ${formattedContent}
      </div>
    `;
  }

  /**
   * Load a saved project
   */
  function loadProject(projectElement) {
    const title = projectElement.querySelector('.project-title').textContent;
    const date = projectElement.querySelector('.project-date').textContent;

    // Update project info
    projectTitle.textContent = title;
    projectDate.textContent = date;

    // For demo purposes, load some placeholder content
    switch (title) {
      case 'Smart Contract Security':
        promptEditor.value =
          'Create a comprehensive tutorial on smart contract security vulnerabilities and best practices...';
        projectType.textContent = 'Tutorial';
        aiOutput.innerHTML =
          '<div class="generated-content"><h1>Smart Contract Security: A Comprehensive Guide</h1><p>This tutorial covers essential security considerations when developing smart contracts...</p></div>';
        break;
      case 'DeFi Fundamentals':
        promptEditor.value = 'Create a course module outline on key DeFi concepts and protocols...';
        projectType.textContent = 'Course Module';
        aiOutput.innerHTML =
          '<div class="generated-content"><h1>DeFi Fundamentals Course Module</h1><p>This course module provides a structured introduction to decentralized finance...</p></div>';
        break;
      case 'NFT Creation Guide':
        promptEditor.value = 'Create a step-by-step tutorial on NFT creation with code examples...';
        projectType.textContent = 'Tutorial';
        aiOutput.innerHTML =
          '<div class="generated-content"><h1>NFT Creation Guide</h1><p>In this tutorial, you\'ll learn how to create, deploy, and mint your own NFTs...</p></div>';
        break;
      default:
        break;
    }

    // Reset template selection
    templateItems.forEach(item => item.classList.remove('active'));
  }

  /**
   * Create a new project
   */
  function createNewProject() {
    // Reset UI
    projectTitle.textContent = 'Create New AI-Assisted Content';
    projectType.textContent = 'No template selected';
    projectDate.textContent = getCurrentDate();
    promptEditor.value = '';

    aiOutput.innerHTML = `
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i class="ri-robot-line"></i>
        </div>
        <p>Your AI-generated content will appear here.</p>
        <p>Select a template and enter a prompt to begin.</p>
      </div>
    `;

    // Reset template selection
    templateItems.forEach(item => item.classList.remove('active'));
  }

  /**
   * Simulate AI content generation
   * In a real app, this would be an API call to an AI service
   */
  async function simulateAIGeneration(template, prompt) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sample responses based on template type
    const responses = {
      tutorial: `# Understanding Blockchain Consensus Mechanisms

## Introduction to Consensus Mechanisms

Consensus mechanisms are the protocols that ensure all nodes in a blockchain network agree on the current state of the blockchain. They are fundamental to solving the Byzantine Generals' Problem in distributed computing, allowing decentralized systems to reach agreement without requiring trust between participants.

## Prerequisites and Setup

Before diving into different consensus mechanisms, ensure you understand:
- Basic blockchain structure (blocks, transactions, hashes)
- Public-private key cryptography
- Distributed networks

No specific setup is required to understand this tutorial, but having a blockchain development environment (like Ganache or a test network) can help in visualizing concepts.

## Core Consensus Mechanisms

### Proof of Work (PoW)

The original consensus mechanism introduced by Bitcoin. In PoW:

\`\`\`
function proofOfWork(block, difficulty) {
  block.nonce = 0;

  while (!isValidHash(calculateHash(block), difficulty)) {
    block.nonce++;
  }

  return block;
}

function isValidHash(hash, difficulty) {
  // Check if hash has required number of leading zeros
  const requiredPrefix = '0'.repeat(difficulty);
  return hash.startsWith(requiredPrefix);
}
\`\`\`

Key characteristics:
- Energy-intensive computation
- Security based on computational power (51% attack resistance)
- Higher latency, typically minutes between blocks

### Proof of Stake (PoS)

A more energy-efficient alternative where validators are selected based on their stake in the network.

\`\`\`
function selectValidator(validators, blockNumber) {
  // Pseudocode for validator selection
  const seed = generateRandomSeed(blockNumber);
  const totalStake = calculateTotalStake(validators);

  let cumulativeWeight = 0;
  const randomPoint = seed % totalStake;

  for (const validator of validators) {
    cumulativeWeight += validator.stake;
    if (cumulativeWeight > randomPoint) {
      return validator;
    }
  }
}
\`\`\`

Key characteristics:
- Energy efficient
- Security based on economic stake
- Potential centralization concerns
- Faster finality than PoW

## Common Pitfalls and Troubleshooting

### Proof of Work Challenges:
- 51% attacks if network hashpower is concentrated
- Energy consumption concerns
- Mining centralization through specialized hardware

### Proof of Stake Challenges:
- Nothing-at-stake problem
- Initial distribution concerns
- Long-range attacks

## Best Practices

1. **Consider Your Use Case**: Private blockchains may benefit from BFT-based consensus, while public networks might require PoW or PoS.

2. **Security Budget**: Ensure your consensus mechanism has adequate security incentives.

3. **Economic Design**: Carefully model economic incentives to prevent gaming the system.

4. **Hybrid Approaches**: Consider combining mechanisms to leverage advantages of each.

5. **Testing**: Thoroughly test consensus mechanisms under realistic network conditions.

## Summary and Next Steps

Understanding consensus mechanisms is crucial for blockchain developers and architects. Each approach makes different tradeoffs between security, decentralization, and scalability.

To deepen your knowledge:
1. Study the Ethereum consensus mechanism transition from PoW to PoS
2. Explore emerging consensus mechanisms like Avalanche or Algorand's Pure PoS
3. Experiment with implementing a simple consensus mechanism yourself
4. Consider how layer 2 solutions interact with base layer consensus`,

      quiz: `# Blockchain Consensus Mechanisms Assessment

## Multiple Choice Questions

1. **What is the primary purpose of a consensus mechanism in blockchain?**
   a) To encrypt transaction data
   b) To enable peer-to-peer transactions without intermediaries
   c) To reach agreement on the state of the blockchain across all nodes
   d) To mine new cryptocurrency coins

2. **Which consensus mechanism does Bitcoin use?**
   a) Proof of Stake
   b) Proof of Work
   c) Proof of Authority
   d) Delegated Proof of Stake

3. **In Proof of Stake, how are validators typically selected to create new blocks?**
   a) Based on computing power
   b) Based on reputation
   c) Based on random selection weighted by their staked tokens
   d) Based on their mining hardware

4. **Which of these is NOT an advantage of Proof of Stake over Proof of Work?**
   a) Energy efficiency
   b) Lower barrier to entry
   c) Established security record
   d) Faster transaction finality

5. **What is the "nothing-at-stake" problem in Proof of Stake systems?**
   a) Validators having no incentive to act honestly
   b) Validators can vote for multiple blockchain histories without cost
   c) New participants cannot join the network
   d) Transaction fees becoming too low to incentivize validators

6. **Which consensus mechanism typically provides the fastest transaction finality?**
   a) Proof of Work
   b) Proof of Stake
   c) Practical Byzantine Fault Tolerance (PBFT)
   d) Proof of Authority

## Short Answer Questions

1. **Explain the difference between probabilistic and deterministic finality in blockchain consensus mechanisms.**

2. **Describe the economic security model of Proof of Work and how it prevents attacks.**

3. **How does Delegated Proof of Stake (DPoS) differ from standard Proof of Stake, and what tradeoffs does it make?**

## Scenario-based Questions

1. **You are designing a private blockchain for a consortium of 15 financial institutions. Which consensus mechanism would be most appropriate and why?**

2. **A blockchain using Proof of Work has recently seen one mining pool grow to control 45% of the network's hash power. What concerns does this raise, and what options does the community have to address this situation?**

## Code Analysis Questions

1. **Review the following simplified Proof of Stake validator selection algorithm. What potential vulnerability does it have?**

\`\`\`javascript
function selectValidator(validators, blockHeight) {
  const seed = hash(blockHeight.toString());
  const index = parseInt(seed.substring(0, 8), 16) % validators.length;
  return validators[index];
}
\`\`\`

2. **Examine this simplified implementation of a mining function. What is its time complexity, and how would it respond to changes in the difficulty parameter?**

\`\`\`javascript
function mine(blockData, difficulty) {
  let nonce = 0;
  let hash;

  do {
    nonce++;
    hash = calculateHash(blockData + nonce);
  } while (!hash.startsWith('0'.repeat(difficulty)));

  return { nonce, hash };
}
\`\`\`

## Answer Key

### Multiple Choice
1. c) To reach agreement on the state of the blockchain across all nodes
2. b) Proof of Work
3. c) Based on random selection weighted by their staked tokens
4. c) Established security record
5. b) Validators can vote for multiple blockchain histories without cost
6. c) Practical Byzantine Fault Tolerance (PBFT)

### Short Answer
1. Probabilistic finality (used in PoW) means transactions become increasingly secure over time but are never 100% final. Deterministic finality (used in BFT-based systems) means once confirmed, transactions cannot be reversed under any circumstances.

2. PoW security is based on the economic cost of acquiring and operating mining hardware. Attacks require controlling 51% of network hash power, making attacks prohibitively expensive. The cost of attacking increases with network size.

3. DPoS uses token holders to elect a small number of validators rather than using direct staking. This increases throughput and reduces resource requirements but introduces more centralization compared to PoS.`,

      course: `# Web3 Development with React Course Module

## Learning Objectives

By the end of this module, students will be able to:
- Set up a Web3-enabled React application from scratch
- Connect to blockchain networks and providers like MetaMask
- Read from and write to smart contracts using ethers.js
- Implement proper error handling and transaction state management
- Build responsive UIs that provide real-time feedback on blockchain interactions
- Apply best practices for Web3 frontend development

## Module Structure

### Lesson 1: Environment Setup & Web3 React Foundations
**Key Concepts:**
- React development environment setup
- Introduction to Web3 libraries (ethers.js, web3.js, wagmi)
- Setting up a project with Create React App and Web3 dependencies
- Overview of Web3 React component architecture

**Coding Focus:**
Setting up the development environment and creating a basic Web3-ready React project

### Lesson 2: Wallet Connection & Authentication
**Key Concepts:**
- Implementing wallet connect functionality
- Managing blockchain accounts and network switching
- User authentication via wallet signatures
- Persistence of connection state

**Coding Focus:**
Building a responsive wallet connection component with network detection

### Lesson 3: Reading Blockchain Data
**Key Concepts:**
- Understanding ABIs and contract interfaces
- Setting up contract instances in React
- Reading on-chain data (balances, state variables)
- Implementing data caching strategies

**Coding Focus:**
Creating components to display token balances and smart contract data

### Lesson 4: Executing Blockchain Transactions
**Key Concepts:**
- Transaction lifecycle in Web3 applications
- Gas estimation and optimization
- Handling transaction confirmations
- Error handling for failed transactions

**Coding Focus:**
Implementing transaction forms with proper loading states and confirmations

### Lesson 5: Building a Complete dApp Interface
**Key Concepts:**
- State management with React Context or Redux
- Creating a unified transaction history view
- Implementing responsive notification systems
- Optimistic UI updates for pending transactions

**Coding Focus:**
Combining previous concepts into a complete application interface

### Lesson 6: Advanced Web3 UX Patterns
**Key Concepts:**
- Transaction batching and gas optimization
- Handling wallet switching and disconnects
- Implementing webhook notifications
- Cross-chain compatibility considerations

**Coding Focus:**
Enhancing the application with advanced features and error handling

### Lesson 7: Testing & Deployment
**Key Concepts:**
- Testing Web3 React components
- Mocking blockchain interactions
- Deploying to decentralized hosting (IPFS/Filecoin)
- CI/CD for Web3 applications

**Coding Focus:**
Writing tests and preparing the application for production deployment

## Suggested Exercises

1. **Wallet Connector:** Create a wallet connection component that supports multiple providers (MetaMask, WalletConnect, Coinbase Wallet)

2. **Token Dashboard:** Build a dashboard that displays ERC-20 token balances with auto-refresh capabilities

3. **NFT Gallery:** Create a gallery component that fetches and displays NFTs owned by the connected address

4. **DEX Interface:** Implement a simple swap interface that connects to a decentralized exchange protocol

5. **Transaction Monitor:** Build a transaction history component with filtering and status tracking

## Assessment Questions

1. What is the difference between web3.js and ethers.js, and what are the advantages of each?

2. Explain the process of connecting to MetaMask from a React application, including error handling.

3. How would you implement real-time updates when blockchain state changes affect your UI?

4. What are the best practices for managing transaction state in a Web3 React application?

5. Describe the process of handling network switching in a multi-chain Web3 application.

6. How would you test a component that interacts with a smart contract?

7. What security considerations should be taken into account when building Web3 frontends?

## Additional Resources

- [Official ethers.js Documentation](https://docs.ethers.io/)
- [wagmi React Hooks Library](https://wagmi.sh/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Web3 UX Design Principles](https://www.web3uxdesign.org/)
- [MetaMask API Documentation](https://docs.metamask.io/)
- [Testing React Components with Jest](https://jestjs.io/docs/tutorial-react)`,

      'code-example': `# ERC-721 NFT Smart Contract Implementation Guide

## Introduction

This code example demonstrates how to create a basic ERC-721 NFT (Non-Fungible Token) smart contract on Ethereum. This implementation includes standard functionality plus metadata handling, minting functions, and royalty support.

## Prerequisites and Environment Setup

To work with this code, you'll need:

- Node.js v14+ and npm/yarn
- Hardhat development environment
- OpenZeppelin Contracts library
- MetaMask or another Ethereum wallet

First, set up your environment:

\`\`\`bash
mkdir nft-project
cd nft-project
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai ethers @openzeppelin/contracts
npx hardhat
\`\`\`

## Complete ERC-721 Contract

Here's our full NFT smart contract implementation:

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract MyNFTCollection is ERC721, ERC721Enumerable, ERC721URIStorage, IERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    string public baseURI;
    address public royaltyRecipient;
    uint256 public royaltyPercentage;
    uint256 public mintPrice = 0.05 ether;
    uint256 public maxSupply = 10000;
    bool public mintingEnabled = false;

    mapping(address => uint256) public mintedPerWallet;
    uint256 public maxMintPerWallet = 5;

    event Minted(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _royaltyRecipient,
        uint256 _royaltyPercentage
    ) ERC721(_name, _symbol) {
        baseURI = _baseURI;
        royaltyRecipient = _royaltyRecipient;
        royaltyPercentage = _royaltyPercentage;
    }

    // Public mint function
    function mint(uint256 quantity) public payable {
        require(mintingEnabled, "Minting is not enabled");
        require(quantity > 0, "Quantity must be greater than 0");
        require(
            mintedPerWallet[msg.sender] + quantity <= maxMintPerWallet,
            "Exceeds max mint per wallet"
        );
        require(
            _tokenIdCounter.current() + quantity <= maxSupply,
            "Would exceed max supply"
        );
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            emit Minted(msg.sender, tokenId);
        }
    }

    // Admin mint function for giveaways, team allocation, etc.
    function adminMint(address to, uint256 quantity) public onlyOwner {
        require(quantity > 0, "Quantity must be greater than 0");
        require(
            _tokenIdCounter.current() + quantity <= maxSupply,
            "Would exceed max supply"
        );

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
            emit Minted(to, tokenId);
        }
    }

    // Set token URI for individual token
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
        _setTokenURI(tokenId, _tokenURI);
    }

    // Toggle minting state
    function toggleMinting() public onlyOwner {
        mintingEnabled = !mintingEnabled;
    }

    // Update mint price
    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    // Update max supply
    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= _tokenIdCounter.current(), "Cannot reduce max supply below current supply");
        maxSupply = _maxSupply;
    }

    // Update max mint per wallet
    function setMaxMintPerWallet(uint256 _maxMintPerWallet) public onlyOwner {
        maxMintPerWallet = _maxMintPerWallet;
    }

    // Update royalty settings
    function setRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyPercentage) public onlyOwner {
        require(_royaltyPercentage <= 10000, "Royalty too high");
        royaltyRecipient = _royaltyRecipient;
        royaltyPercentage = _royaltyPercentage;
    }

    // Withdraw contract balance
    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    // Royalty info implementation (ERC-2981)
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override returns (address, uint256) {
        return (royaltyRecipient, (_salePrice * royaltyPercentage) / 10000);
    }

    // Base URI for computing {tokenURI}
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // Update base URI
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    // Required overrides for inherited contracts
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
\`\`\`

## Line-by-Line Explanation of Key Parts

Let's break down the most important elements:

### Inheritance and Imports

\`\`\`solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// ...

contract MyNFTCollection is ERC721, ERC721Enumerable, ERC721URIStorage, IERC2981, Ownable {
\`\`\`

Our contract inherits from multiple OpenZeppelin contracts:
- **ERC721**: The base NFT standard implementation
- **ERC721Enumerable**: Adds enumeration functions (useful for marketplaces)
- **ERC721URIStorage**: Adds per-token metadata URI storage
- **IERC2981**: Royalty standard interface
- **Ownable**: Adds basic access control

### Token Counter and State Variables

\`\`\`solidity
using Counters for Counters.Counter;
Counters.Counter private _tokenIdCounter;
\`\`\`

This sets up an auto-incrementing counter for token IDs, ensuring each NFT gets a unique identifier.

### Minting Function

\`\`\`solidity
function mint(uint256 quantity) public payable {
    require(mintingEnabled, "Minting is not enabled");
    require(quantity > 0, "Quantity must be greater than 0");
    // Additional checks...

    mintedPerWallet[msg.sender] += quantity;

    for (uint256 i = 0; i < quantity; i++) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
    }
}
\`\`\`

This function:
1. Performs multiple validation checks
2. Updates the sender's mint count
3. Mints the requested number of tokens
4. Emits an event for each minted token

### Royalty Implementation

\`\`\`solidity
function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override returns (address, uint256) {
    return (royaltyRecipient, (_salePrice * royaltyPercentage) / 10000);
}
\`\`\`

Implements the ERC-2981 royalty standard, calculating the royalty amount based on the specified percentage (basis points, where 10000 = 100%).

### Required Overrides

\`\`\`solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    override(ERC721, ERC721Enumerable)
{
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
}

function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
{
    return super.tokenURI(tokenId);
}

function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, IERC165)
    returns (bool)
{
    return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
}
\`\`\`

These functions resolve inheritance conflicts and ensure all interfaces are properly supported.

## Deployment Script

Here's how to deploy this contract using Hardhat:

\`\`\`javascript
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the NFT contract
  const MyNFTCollection = await ethers.getContractFactory("MyNFTCollection");
  const nft = await MyNFTCollection.deploy(
    "My NFT Collection",                       // Name
    "MNFT",                                    // Symbol
    "ipfs://bafybeihska3qnqjh6cv24xmdxav35p3o7ssj77ysdh7r2fgfuxrdnkst5e/", // Base URI
    deployer.address,                           // Royalty recipient
    750                                         // Royalty percentage (7.5%)
  );

  await nft.deployed();
  console.log("NFT contract deployed to:", nft.address);

  // Optional: Set initial contract state
  await nft.toggleMinting();
  console.log("Minting enabled");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
\`\`\`

## Best Practices and Optimization Tips

1. **Gas Optimization**:
   - Use unchecked blocks for counters when overflow is impossible (Solidity 0.8+)
   - Batch mint operations to save gas when minting multiple NFTs
   - Consider using merkle proofs for allowlists instead of mappings

2. **Security Considerations**:
   - Use reentrancy guards for functions that transfer ETH
   - Implement access control for sensitive operations
   - Consider adding a pause mechanism for emergencies

3. **Metadata Handling**:
   - Store metadata on IPFS for true decentralization
   - Consider using Arweave for permanent storage
   - Freeze metadata once the collection is complete

4. **Marketplace Compatibility**:
   - Implement ERC-2981 for royalties (as shown)
   - Ensure supportsInterface properly declares all implemented interfaces
   - Test with popular marketplaces like OpenSea before mainnet deployment

5. **Upgradeability**:
   - For complex projects, consider using the OpenZeppelin upgradeable contract pattern
   - However, for simple NFTs, non-upgradeable contracts are often preferred for trust`,
      default: `# Web3 Educational Content

This AI-generated content focuses on providing clear, accurate, and educational material about Web3 technologies. Select a template and customize the prompt to generate specific content for your educational platform.

## Available Templates

- **Tutorials**: Step-by-step guides on specific Web3 topics
- **Course Modules**: Structured learning content with lessons and assessments
- **Quizzes**: Knowledge assessment questions with answer keys
- **Glossaries**: Definitions and explanations of Web3 terminology
- **Code Examples**: Practical implementation examples with explanations

## Customization Tips

1. Replace placeholder topics with specific subjects
2. Add any specific requirements for depth, format, or style
3. Mention target audience (beginners, intermediate, advanced)
4. Request specific code languages or frameworks if needed

Select a template from the sidebar to begin creating educational content.`
    };

    // Return appropriate response
    return responses[template] || responses.default;
  }

  /**
   * Simple markdown parser for formatting messages
   */
  function parseMarkdown(text) {
    // Handle code blocks
    text = text.replace(/```(\w*)([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle bold
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Handle italic
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Handle headers
    text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');

    // Handle lists
    text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Handle numbered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

    // Handle newlines
    text = text.replace(/\n\n/g, '<br><br>');

    return text;
  }

  /**
   * Get current date in format "Apr 25, 2025"
   */
  function getCurrentDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Initialize the studio when the page loads
  initStudio();
});
