/**
 * Web3 Wallet Connection Handler
 * Modern implementation using Web3Modal v3 with support for multiple chains
 * April 2025
 */

(function () {
  // DOM Elements
  const connectButton = document.getElementById('connect-wallet');
  const walletDisplay = document.getElementById('wallet-display');
  const chainDisplay = document.getElementById('chain-display');

  // Supported chains
  const chains = {
    ethereum: {
      id: '0x1',
      name: 'Ethereum',
      icon: 'eth-icon'
    },
    polygon: {
      id: '0x89',
      name: 'Polygon',
      icon: 'polygon-icon'
    },
    optimism: {
      id: '0xa',
      name: 'Optimism',
      icon: 'optimism-icon'
    },
    arbitrum: {
      id: '0xa4b1',
      name: 'Arbitrum',
      icon: 'arbitrum-icon'
    },
    base: {
      id: '0x2105',
      name: 'Base',
      icon: 'base-icon'
    }
  };

  // Initialize Web3 connection
  async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Modern Web3Modal implementation
        if (connectButton) {
          connectButton.addEventListener('click', connectWallet);
        }

        // Check if previously connected
        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress) {
          await connectWallet(true);
        }
      } catch (error) {
        console.error('Error initializing Web3:', error);
        updateConnectionUI(false);
      }
    } else {
      updateConnectionUI(false);
    }
  }

  // Connect wallet function
  async function connectWallet(isAutoConnect = false) {
    try {
      if (!isAutoConnect) {
        connectButton.classList.add('connecting');
        connectButton.textContent = 'Connecting...';
      }

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        localStorage.setItem('walletAddress', address);

        // Get chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });

        updateConnectionUI(true, address, chainId);
      } else {
        updateConnectionUI(false);
      }
    } catch (error) {
      console.error('Connection error:', error);
      updateConnectionUI(false);
    }
  }

  // Update UI based on connection status
  function updateConnectionUI(connected, address = null, chainId = null) {
    if (connected && address) {
      // Format address: 0x1234...5678
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

      if (connectButton) {
        connectButton.textContent = shortAddress;
        connectButton.classList.remove('connecting');
        connectButton.classList.add('connected');
      }

      if (walletDisplay) {
        walletDisplay.textContent = shortAddress;
        walletDisplay.classList.add('connected');
      }

      if (chainDisplay && chainId) {
        // Get chain info
        const chainInfo = getChainInfo(chainId);
        chainDisplay.textContent = chainInfo.name;
        chainDisplay.classList.add(chainInfo.icon);
      }

      // Show connected elements
      document.querySelectorAll('.wallet-connected').forEach(el => {
        el.style.display = 'block';
      });

      // Hide disconnected elements
      document.querySelectorAll('.wallet-disconnected').forEach(el => {
        el.style.display = 'none';
      });
    } else {
      // Reset to disconnected state
      if (connectButton) {
        connectButton.textContent = 'Connect Wallet';
        connectButton.classList.remove('connecting', 'connected');
      }

      if (walletDisplay) {
        walletDisplay.textContent = 'Not Connected';
        walletDisplay.classList.remove('connected');
      }

      if (chainDisplay) {
        chainDisplay.textContent = '';
        // Remove all chain icon classes
        Object.values(chains).forEach(chain => {
          chainDisplay.classList.remove(chain.icon);
        });
      }

      // Hide connected elements
      document.querySelectorAll('.wallet-connected').forEach(el => {
        el.style.display = 'none';
      });

      // Show disconnected elements
      document.querySelectorAll('.wallet-disconnected').forEach(el => {
        el.style.display = 'block';
      });

      localStorage.removeItem('walletAddress');
    }
  }

  // Get chain information
  function getChainInfo(chainId) {
    // Find matching chain
    for (const chain of Object.values(chains)) {
      if (chain.id === chainId) {
        return chain;
      }
    }

    // Default to unknown chain
    return {
      name: `Chain ID: ${chainId}`,
      icon: 'unknown-chain'
    };
  }

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', accounts => {
      if (accounts.length === 0) {
        updateConnectionUI(false);
      } else {
        connectWallet(true);
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
      connectWallet(true);
    });
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeb3);
  } else {
    initWeb3();
  }
})();
