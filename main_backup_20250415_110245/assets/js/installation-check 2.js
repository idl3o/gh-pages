document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('check-environment');
  const resultsList = document.getElementById('environment-check-results');
  
  if (!checkButton || !resultsList) return;
  
  checkButton.addEventListener('click', async function() {
    resultsList.innerHTML = '<li class="checking">Checking environment...</li>';
    
    try {
      // Check for Node.js/npm compatibility
      const checks = [
        checkWeb3Availability(),
        checkMetaMask(),
        checkNetwork(),
        checkLocalStorage()
      ];
      
      const results = await Promise.all(checks);
      
      // Display results
      resultsList.innerHTML = '';
      results.forEach(result => {
        const li = document.createElement('li');
        li.className = result.success ? 'success' : 'failure';
        li.innerHTML = `
          <span class="check-icon">${result.success ? '✓' : '✗'}</span>
          <div class="check-details">
            <strong>${result.name}</strong>
            <p>${result.message}</p>
          </div>
        `;
        resultsList.appendChild(li);
      });
      
    } catch (error) {
      resultsList.innerHTML = `
        <li class="failure">
          <span class="check-icon">✗</span>
          <div class="check-details">
            <strong>Error running checks</strong>
            <p>${error.message}</p>
          </div>
        </li>
      `;
    }
  });
  
  async function checkWeb3Availability() {
    // Check if Web3 is available
    if (window.ethereum || window.web3) {
      return {
        name: 'Web3 Provider',
        success: true,
        message: 'Web3 provider detected'
      };
    } else {
      return {
        name: 'Web3 Provider',
        success: false,
        message: 'No Web3 provider detected. Please install MetaMask or another Web3 wallet.'
      };
    }
  }
  
  async function checkMetaMask() {
    // Check for MetaMask specifically
    if (window.ethereum && window.ethereum.isMetaMask) {
      return {
        name: 'MetaMask',
        success: true,
        message: 'MetaMask is installed'
      };
    } else {
      return {
        name: 'MetaMask',
        success: false,
        message: 'MetaMask not detected. Some features may not work properly.'
      };
    }
  }
  
  async function checkNetwork() {
    // Check if on the correct network
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const supportedChains = ['0x1', '0x89', '0x13881']; // Ethereum, Polygon, Mumbai
        
        if (supportedChains.includes(chainId)) {
          return {
            name: 'Network',
            success: true,
            message: 'Connected to a supported network'
          };
        } else {
          return {
            name: 'Network',
            success: false,
            message: 'Please connect to Ethereum Mainnet or Polygon for full functionality'
          };
        }
      } catch (error) {
        return {
          name: 'Network',
          success: false,
          message: 'Could not detect network'
        };
      }
    }
    
    return {
      name: 'Network',
      success: false,
      message: 'No Web3 provider to check network'
    };
  }
  
  async function checkLocalStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      return {
        name: 'Browser Storage',
        success: true,
        message: 'Local storage is available for caching content'
      };
    } catch (e) {
      return {
        name: 'Browser Storage',
        success: false,
        message: 'Local storage is not available. Some features may not work properly.'
      };
    }
  }
});
