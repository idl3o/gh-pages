// Web3 connection handler for StreamChain platform
document.addEventListener('DOMContentLoaded', function() {
  // Connect wallet button
  const connectWalletBtn = document.querySelector('.connect-wallet-btn');

  // Wallet connection status
  let walletConnected = false;
  let walletAddress = null;

  // Mock provider for demo purposes
  const mockProvider = {
    request: async ({ method }) => {
      if (method === 'eth_requestAccounts') {
        return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'];
      }
      if (method === 'eth_chainId') {
        return '0x1';
      }
      return null;
    },
    on: (event, callback) => {
      console.log(`Registered event: ${event}`);
    },
    removeListener: (event, callback) => {
      console.log(`Removed listener for event: ${event}`);
    }
  };

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (connectWalletBtn) {
      connectWalletBtn.addEventListener('click', async () => {
        try {
          let provider = window.ethereum || mockProvider;

          // Request account access
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          walletAddress = accounts[0];
          walletConnected = true;

          // Update UI
          updateWalletUI();

          // Setup listeners for account and chain changes
          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);

          console.log('Wallet connected:', walletAddress);
        } catch (error) {
          console.error('Error connecting wallet:', error);
          alert('Could not connect to wallet. Please try again.');
        }
      });
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      walletConnected = false;
      walletAddress = null;
    } else {
      // Account changed
      walletAddress = accounts[0];
    }
    updateWalletUI();
  };

  // Handle chain changes
  const handleChainChanged = (chainId) => {
    console.log('Chain changed to:', chainId);
    // Reload the page on chain change as recommended by MetaMask
    window.location.reload();
  };

  // Update UI based on wallet connection status
  const updateWalletUI = () => {
    if (connectWalletBtn) {
      if (walletConnected && walletAddress) {
        // Show abbreviated wallet address
        const shortenedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        connectWalletBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          ${shortenedAddress}
        `;
        connectWalletBtn.classList.add('wallet-connected');
      } else {
        // Show connect button
        connectWalletBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M6 12h.01M18 12h.01"></path>
          </svg>
          Connect Wallet
        `;
        connectWalletBtn.classList.remove('wallet-connected');
      }
    }
  };

  // Initialize wallet functionality
  const initWallet = () => {
    connectWallet();
    updateWalletUI();
  };

  // Start wallet functionality
  initWallet();
});
