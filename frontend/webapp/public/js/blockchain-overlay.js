/**
 * Blockchain Overlay Integration for Web3 Streaming Platform
 * Used with OBS Studio, XSplit and other streaming software
 *
 * This library provides real-time blockchain interactions for stream overlays
 * Version: 1.0.0
 * Date: May 3, 2025
 */

const BlockchainOverlay = (function() {
  // Private variables
  let config = {
    channelId: null,
    contractAddress: null,
    network: 'ethereum',
    websocketUrl: 'wss://stream-events.yourwebsite.com',
    refreshRate: 2000, // ms
    animations: {
      duration: 5000, // ms
      fadeIn: 500,  // ms
      fadeOut: 1000 // ms
    },
    debug: false
  };

  let ws = null;
  let eventQueue = [];
  let isProcessingEvents = false;
  let ethersProvider = null;
  let streamContract = null;

  // DOM Elements cache
  let elements = {
    tipContainer: null,
    subAlert: null
  };

  // Connect to Ethereum/Web3 provider
  const connectProvider = async () => {
    try {
      if (window.ethereum) {
        // Modern dapp browsers
        if (config.debug) console.log("Using window.ethereum provider");
        ethersProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
      } else {
        // Fallback to a public provider if no wallet is available
        const networkUrls = {
          'ethereum': 'https://mainnet.infura.io/v3/YOUR_INFURA_ID',
          'polygon': 'https://polygon-rpc.com',
          'optimism': 'https://mainnet.optimism.io',
          'arbitrum': 'https://arb1.arbitrum.io/rpc'
        };

        if (config.debug) console.log(`Using public ${config.network} provider`);
        ethersProvider = new ethers.providers.JsonRpcProvider(networkUrls[config.network]);
      }

      // Initialize contract interface
      const streamAbi = [
        "event TipReceived(address indexed sender, address indexed creator, uint256 amount, string message)",
        "event SubscriptionStarted(address indexed subscriber, address indexed creator, uint256 tier, uint256 duration)",
        "event NFTDisplayed(address indexed owner, uint256 indexed tokenId, string tokenURI)",
        "function getChannelInfo(string channelId) view returns (address owner, bool isLive, uint256 viewerCount)"
      ];

      streamContract = new ethers.Contract(config.contractAddress, streamAbi, ethersProvider);

      // Set up event listeners
      setupContractListeners();

      return true;
    } catch (error) {
      console.error("Failed to connect to Web3 provider:", error);
      return false;
    }
  };

  // Set up contract event listeners
  const setupContractListeners = () => {
    if (!streamContract) return;

    // Listen for tips
    streamContract.on("TipReceived", (sender, creator, amount, message) => {
      if (creator.toLowerCase() === config.channelOwner.toLowerCase()) {
        const amountInEth = ethers.utils.formatEther(amount);
        queueEvent({
          type: 'tip',
          sender: sender,
          amount: amountInEth,
          message: message
        });
      }
    });

    // Listen for subscriptions
    streamContract.on("SubscriptionStarted", (subscriber, creator, tier, duration) => {
      if (creator.toLowerCase() === config.channelOwner.toLowerCase()) {
        queueEvent({
          type: 'subscription',
          subscriber: subscriber,
          tier: tier.toNumber(),
          duration: duration.toNumber() // in days
        });
      }
    });

    // Listen for NFT displays
    streamContract.on("NFTDisplayed", (owner, tokenId, tokenURI) => {
      queueEvent({
        type: 'nftDisplay',
        owner: owner,
        tokenId: tokenId.toString(),
        tokenURI: tokenURI
      });
    });
  };

  // Connect to WebSocket server
  const connectWebsocket = () => {
    try {
      ws = new WebSocket(`${config.websocketUrl}/channel/${config.channelId}`);

      ws.onopen = function() {
        if (config.debug) console.log("WebSocket connected");
        ws.send(JSON.stringify({
          type: 'auth',
          channelId: config.channelId
        }));
      };

      ws.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.type === 'auth_success') {
          if (config.debug) console.log("WebSocket authenticated");
        } else {
          queueEvent(data);
        }
      };

      ws.onclose = function() {
        if (config.debug) console.log("WebSocket closed, will reconnect...");
        setTimeout(connectWebsocket, 3000);
      };

      ws.onerror = function(error) {
        console.error("WebSocket error:", error);
        ws.close();
      };

      return true;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      return false;
    }
  };

  // Add an event to the queue
  const queueEvent = (event) => {
    eventQueue.push({
      ...event,
      timestamp: Date.now()
    });

    if (!isProcessingEvents) {
      processEventQueue();
    }
  };

  // Process events in the queue
  const processEventQueue = async () => {
    if (eventQueue.length === 0) {
      isProcessingEvents = false;
      return;
    }

    isProcessingEvents = true;
    const event = eventQueue.shift();

    switch (event.type) {
      case 'tip':
        await displayTip(event);
        break;
      case 'subscription':
        await displaySubscription(event);
        break;
      case 'nftDisplay':
        await displayNFT(event);
        break;
      case 'chat':
        displayChat(event);
        break;
      default:
        if (config.debug) console.log("Unknown event type:", event.type);
        break;
    }

    setTimeout(processEventQueue, 1000);
  };

  // Display functions
  const displayTip = async (event) => {
    const tipElement = document.createElement('div');
    tipElement.className = 'tip-alert animated';

    let senderName = await getEnsName(event.sender) || shortenAddress(event.sender);

    tipElement.innerHTML = `
      <div class="tip-header">
        <span class="tip-icon">💰</span>
        <span class="tip-title">New Tip!</span>
      </div>
      <div class="tip-content">
        <p class="tip-sender">${senderName}</p>
        <p class="tip-amount">${event.amount} ${config.network === 'ethereum' ? 'ETH' : 'MATIC'}</p>
        ${event.message ? `<p class="tip-message">"${sanitizeHTML(event.message)}"</p>` : ''}
      </div>
    `;

    elements.tipContainer.appendChild(tipElement);

    // Animation
    await animateElement(tipElement);

    // Remove from DOM after animation completes
    tipElement.remove();
  };

  const displaySubscription = async (event) => {
    elements.subAlert.className = 'visible animated';

    let subscriberName = await getEnsName(event.subscriber) || shortenAddress(event.subscriber);
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const tierName = tierNames[event.tier] || `Tier ${event.tier + 1}`;

    elements.subAlert.innerHTML = `
      <div class="sub-content">
        <h3>New Subscriber!</h3>
        <p class="sub-name">${subscriberName}</p>
        <p class="sub-details">just subscribed at ${tierName} tier for ${event.duration} days!</p>
      </div>
    `;

    // Animation
    await animateElement(elements.subAlert);

    // Hide after animation
    elements.subAlert.className = 'hidden';
  };

  const displayNFT = async (event) => {
    try {
      const nftElement = document.createElement('div');
      nftElement.className = 'nft-display animated';

      // Fetch NFT metadata
      const metadata = await fetchNFTMetadata(event.tokenURI);
      let ownerName = await getEnsName(event.owner) || shortenAddress(event.owner);

      nftElement.innerHTML = `
        <div class="nft-card">
          <div class="nft-header">
            <h3>${sanitizeHTML(metadata.name || "NFT #" + event.tokenId)}</h3>
          </div>
          <div class="nft-image">
            <img src="${sanitizeHTML(metadata.image)}" alt="NFT">
          </div>
          <div class="nft-owner">
            <p>Owned by: ${ownerName}</p>
          </div>
          ${metadata.description ? `<p class="nft-description">${sanitizeHTML(metadata.description)}</p>` : ''}
        </div>
      `;

      document.body.appendChild(nftElement);

      // Animation
      await animateElement(nftElement);

      // Remove from DOM after animation
      nftElement.remove();
    } catch (error) {
      console.error("Error displaying NFT:", error);
    }
  };

  const displayChat = (event) => {
    // If there's an existing chat UI, forward the message there
    if (window.ChatUI && typeof window.ChatUI.addMessage === 'function') {
      window.ChatUI.addMessage(event);
    }
  };

  // Helper functions
  const animateElement = (element) => {
    return new Promise((resolve) => {
      element.style.opacity = 0;

      // Fade in
      setTimeout(() => {
        element.style.opacity = 1;
        element.style.transition = `opacity ${config.animations.fadeIn}ms ease-in`;
      }, 100);

      // Wait, then fade out
      setTimeout(() => {
        element.style.opacity = 0;
        element.style.transition = `opacity ${config.animations.fadeOut}ms ease-out`;

        // Resolve after fade out completes
        setTimeout(resolve, config.animations.fadeOut + 100);
      }, config.animations.duration);
    });
  };

  const fetchNFTMetadata = async (tokenURI) => {
    try {
      // Handle IPFS URIs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(tokenURI);
      const metadata = await response.json();

      // Handle IPFS image URLs
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      return metadata;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return { name: "Unknown NFT", image: "placeholder.png" };
    }
  };

  const getEnsName = async (address) => {
    try {
      if (!ethersProvider) return null;
      return await ethersProvider.lookupAddress(address);
    } catch (error) {
      if (config.debug) console.log("Error getting ENS name:", error);
      return null;
    }
  };

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const sanitizeHTML = (text) => {
    const element = document.createElement('div');
    element.innerText = text;
    return element.innerHTML;
  };

  // Public methods
  return {
    /**
     * Initialize the blockchain overlay
     * @param {Object} options - Configuration options
     */
    init: async function(options) {
      // Merge configurations
      config = { ...config, ...options };

      if (!config.channelId || !config.contractAddress) {
        console.error("Missing required configuration: channelId or contractAddress");
        return false;
      }

      // Cache DOM elements
      elements.tipContainer = document.getElementById('tip-container');
      elements.subAlert = document.getElementById('sub-alert');

      // Create elements if they don't exist
      if (!elements.tipContainer) {
        elements.tipContainer = document.createElement('div');
        elements.tipContainer.id = 'tip-container';
        elements.tipContainer.className = 'animated';
        document.body.appendChild(elements.tipContainer);
      }

      if (!elements.subAlert) {
        elements.subAlert = document.createElement('div');
        elements.subAlert.id = 'sub-alert';
        elements.subAlert.className = 'hidden';
        document.body.appendChild(elements.subAlert);
      }

      // Get channel owner address
      try {
        const channel = await fetch(`https://api.yourwebsite.com/channels/${config.channelId}`);
        const channelData = await channel.json();
        config.channelOwner = channelData.ownerAddress;
      } catch (error) {
        console.error("Error fetching channel data:", error);
        return false;
      }

      // Load required libraries if needed
      if (!window.ethers) {
        await loadScript('https://cdn.ethers.io/lib/ethers-5.6.umd.min.js');
      }

      // Connect to providers
      const web3Connected = await connectProvider();
      const wsConnected = connectWebsocket();

      if (config.debug) {
        console.log(`Blockchain Overlay initialized for channel: ${config.channelId}`);
        console.log(`Web3 connected: ${web3Connected}, WebSocket connected: ${wsConnected}`);
      }

      return web3Connected && wsConnected;
    },

    /**
     * Add a custom event to the display queue
     * @param {Object} event - Event object
     */
    addCustomEvent: function(event) {
      if (!event || !event.type) {
        console.error("Invalid event format");
        return;
      }

      queueEvent(event);
    },

    /**
     * Update configuration options
     * @param {Object} options - New configuration options
     */
    updateConfig: function(options) {
      config = { ...config, ...options };
    },

    /**
     * Get the current connection status
     * @returns {Object} Status object
     */
    getStatus: function() {
      return {
        web3Connected: !!ethersProvider,
        wsConnected: ws && ws.readyState === WebSocket.OPEN,
        channelId: config.channelId,
        network: config.network,
        queueLength: eventQueue.length
      };
    }
  };
})();

// Helper function to load external scripts
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
