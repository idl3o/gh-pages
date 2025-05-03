document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const connectWalletBtn = document.getElementById('connect-wallet');
  const walletModal = document.getElementById('wallet-modal');
  const closeModal = document.querySelector('.close-modal');
  const walletOptions = document.querySelectorAll('.wallet-option');
  
  // Web3 state
  let web3;
  let userAccount;
  let userInfo;
  let identityVerified = false;
  const identityStatusElement = document.createElement('div');
  identityStatusElement.className = 'identity-status';
  identityStatusElement.style.display = 'none';
  
  if (connectWalletBtn) {
    connectWalletBtn.parentNode.insertBefore(identityStatusElement, connectWalletBtn.nextSibling);
  }
  
  // Open wallet connection modal
  connectWalletBtn.addEventListener('click', function() {
    walletModal.style.display = 'block';
  });
  
  // Close modal
  closeModal.addEventListener('click', function() {
    walletModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === walletModal) {
      walletModal.style.display = 'none';
    }
  });
  
  // Connect wallet options
  walletOptions.forEach(option => {
    option.addEventListener('click', async function() {
      const walletType = this.getAttribute('data-wallet');
      
      try {
        await connectWallet(walletType);
        walletModal.style.display = 'none';
        updateUIAfterConnection();
      } catch (error) {
        console.error('Connection failed:', error);
        alert('Failed to connect wallet: ' + error.message);
      }
    });
  });
  
  // Connect to wallet with realistic blockchain behavior
  async function connectWallet(walletType) {
    if (walletType === 'metamask') {
      if (window.ethereum) {
        try {
          // Show realistic connection state
          updateConnectionState('connecting');
          
          // Simulate network latency - real blockchain connections aren't instant
          await simulateNetworkLatency(800, 1500);
          
          web3 = new Web3(window.ethereum);
          
          // Simulate chain ID detection
          await simulateNetworkLatency(300, 600);
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkName = getNetworkName(chainId);
          
          // Request accounts with realistic delay
          updateConnectionState('requesting');
          await simulateNetworkLatency(1000, 2000);
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          userAccount = accounts[0];
          
          console.log(`Connected to ${networkName} with account:`, userAccount);
          
          // Simulate balance fetching
          updateConnectionState('loading');
          await simulateNetworkLatency(600, 1200);
          const balanceWei = await web3.eth.getBalance(userAccount);
          const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
          
          // Store user info
          userInfo = {
            address: userAccount,
            network: networkName,
            chainId: chainId,
            balance: parseFloat(balanceEth).toFixed(4)
          };
          
          // Initialize decentralized identity system
          if (window.decentralizedIdentity) {
            updateConnectionState('verifying');
            try {
              await window.decentralizedIdentity.initialize(userAccount);
              const verification = await window.decentralizedIdentity.verifyIdentity();
              identityVerified = verification.verified;
              
              if (identityVerified) {
                showIdentityStatus('verified', verification.credential.id);
              } else {
                showIdentityStatus('failed', verification.message);
              }
            } catch (error) {
              console.error('Identity verification error:', error);
              showIdentityStatus('error', error.message);
            }
          }
          
          updateConnectionState('connected');
          return userAccount;
        } catch (error) {
          updateConnectionState('error');
          throw new Error('User rejected connection');
        }
      } else {
        updateConnectionState('error');
        throw new Error('MetaMask not installed');
      }
    } else if (walletType === 'walletconnect') {
      updateConnectionState('connecting');
      await simulateNetworkLatency(1000, 2000);
      updateConnectionState('error');
      throw new Error('WalletConnect integration not implemented in this demo');
    }
  }
  
  // Get readable network name
  function getNetworkName(chainId) {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x2a': 'Kovan Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Mumbai Testnet'
    };
    
    return networks[chainId] || 'Unknown Network';
  }

  // Show realistic connection states
  function updateConnectionState(state) {
    const connectWalletBtn = document.getElementById('connect-wallet');
    if (!connectWalletBtn) return;
    
    switch (state) {
      case 'connecting':
        connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        connectWalletBtn.disabled = true;
        break;
      case 'requesting':
        connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Awaiting Approval...';
        connectWalletBtn.disabled = true;
        break;
      case 'loading':
        connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Data...';
        connectWalletBtn.disabled = true;
        break;
      case 'verifying':
        connectWalletBtn.innerHTML = '<i class="fas fa-fingerprint fa-spin"></i> Verifying Identity...';
        connectWalletBtn.disabled = true;
        break;
      case 'connected':
        connectWalletBtn.innerHTML = `
          <i class="fas fa-check-circle"></i> 
          ${userAccount.substring(0, 5)}...${userAccount.substring(38)} 
          <span class="balance-indicator">${userInfo.balance} ETH</span>
        `;
        connectWalletBtn.classList.add('connected');
        connectWalletBtn.disabled = false;
        break;
      case 'error':
        connectWalletBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Connection Failed';
        connectWalletBtn.classList.add('error');
        connectWalletBtn.disabled = false;
        setTimeout(() => {
          connectWalletBtn.innerHTML = 'Connect Wallet';
          connectWalletBtn.classList.remove('error');
        }, 2000);
        break;
      default:
        connectWalletBtn.innerHTML = 'Connect Wallet';
        connectWalletBtn.disabled = false;
    }
  }
  
  // Simulate realistic network latency
  function simulateNetworkLatency(min, max) {
    const latency = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, latency));
  }
  
  // Update UI after successful connection
  function updateUIAfterConnection() {
    // Update button text to show connected address
    connectWalletBtn.textContent = userAccount.slice(0, 6) + '...' + userAccount.slice(-4);
    connectWalletBtn.classList.add('connected');
    
    // You could also update other UI elements or fetch user's NFTs/tokens
    fetchUserContent();
  }
  
  // Fetch content owned by the user
  async function fetchUserContent() {
    // This would connect to your contract in a real implementation
    console.log('Fetching content for account:', userAccount);
    // Simulated delay to represent blockchain query
    setTimeout(() => {
      console.log('User content loaded');
    }, 1500);
  }
  
  // Display identity verification status
  function showIdentityStatus(status, message) {
    if (!identityStatusElement) return;
    
    identityStatusElement.style.display = 'block';
    
    switch (status) {
      case 'verified':
        identityStatusElement.innerHTML = `
          <div class="verified-badge">
            <i class="fas fa-shield-alt"></i>
            <span>Identity Verified</span>
            <div class="tooltip">DID: ${message.substring(0, 10)}...</div>
          </div>
        `;
        identityStatusElement.className = 'identity-status verified';
        break;
      case 'failed':
        identityStatusElement.innerHTML = `
          <div class="warning-badge">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Identity Check Failed</span>
            <div class="tooltip">${message}</div>
          </div>
        `;
        identityStatusElement.className = 'identity-status warning';
        break;
      case 'error':
        identityStatusElement.innerHTML = `
          <div class="error-badge">
            <i class="fas fa-times-circle"></i>
            <span>Identity Error</span>
            <div class="tooltip">${message}</div>
          </div>
        `;
        identityStatusElement.className = 'identity-status error';
        break;
      default:
        identityStatusElement.style.display = 'none';
    }
  }
  
  // Check if already connected (for page refreshes)
  async function checkExistingConnection() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        userAccount = accounts[0];
        web3 = new Web3(window.ethereum);
        updateUIAfterConnection();
      }
    }
  }
  
  // Initial connection check
  checkExistingConnection().catch(console.error);
});
