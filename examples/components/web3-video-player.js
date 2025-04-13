/**
 * Web3 Video Player Component
 * 
 * A video player component with token-gated access that integrates with
 * blockchain for access control and payment verification.
 */

class Web3VideoPlayer {
  /**
   * Create a new video player instance
   * @param {HTMLElement} container - Container element for the player
   * @param {Object} options - Player configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoplay: false,
      muted: false,
      controls: true,
      loop: false,
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2],
      ...options
    };
    
    this.accessVerified = false;
    this.playerInitialized = false;
    this.videoElement = null;
    this.contractAddress = options.contractAddress;
    this.contentId = options.contentId;
    
    this.init();
  }
  
  /**
   * Initialize the player
   * @private
   */
  init() {
    // Create container elements
    this.playerWrapper = document.createElement('div');
    this.playerWrapper.className = 'web3-video-player-wrapper';
    
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = '<div class="spinner"></div><div class="loading-text">Verifying access...</div>';
    
    this.errorOverlay = document.createElement('div');
    this.errorOverlay.className = 'error-overlay';
    this.errorOverlay.style.display = 'none';
    
    // Add to DOM
    this.playerWrapper.appendChild(this.loadingOverlay);
    this.playerWrapper.appendChild(this.errorOverlay);
    this.container.appendChild(this.playerWrapper);
    
    // Add styles
    this.addStyles();
    
    // Check access before loading video
    this.verifyAccess()
      .then(hasAccess => {
        if (hasAccess) {
          this.accessVerified = true;
          this.initializePlayer();
        } else {
          this.showAccessDenied();
        }
      })
      .catch(error => {
        console.error('Error verifying access:', error);
        this.showError('Failed to verify access. Please check your wallet connection.');
      });
  }
  
  /**
   * Verify user has access to content through token ownership
   * @private
   * @returns {Promise<boolean>} Whether user has access
   */
  async verifyAccess() {
    try {
      // Check if Web3 is available
      if (!window.web3 && !window.ethereum) {
        this.showError('Web3 provider not detected. Please install MetaMask or another Web3 wallet.');
        return false;
      }
      
      // Get the web3 instance
      const web3 = window.ethereum ? new Web3(window.ethereum) : new Web3(window.web3.currentProvider);
      
      // Request account access if needed
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      
      // Get user's account
      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        this.showError('No accounts found. Please unlock your wallet.');
        return false;
      }
      
      const userAddress = accounts[0];
      
      // Check if contract address exists
      if (!this.contractAddress) {
        console.warn('No contract address provided, skipping verification');
        return true;
      }
      
      // Load contract ABI (would typically come from an import or an API)
      const contractABI = [
        {
          "inputs": [
            {"name": "user", "type": "address"},
            {"name": "contentId", "type": "bytes32"}
          ],
          "name": "hasAccess",
          "outputs": [{"name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      
      // Initialize contract
      const contract = new web3.eth.Contract(contractABI, this.contractAddress);
      
      // Convert content ID to bytes32
      const contentIdBytes = web3.utils.sha3(this.contentId || 'default');
      
      // Check access
      const hasAccess = await contract.methods.hasAccess(userAddress, contentIdBytes).call();
      return hasAccess;
    } catch (error) {
      console.error('Error in verifyAccess:', error);
      return false;
    }
  }
  
  /**
   * Initialize video player after access is verified
   * @private
   */
  initializePlayer() {
    if (this.playerInitialized) return;
    
    // Hide loading overlay
    this.loadingOverlay.style.display = 'none';
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.className = 'web3-video-element';
    
    // Set attributes based on options
    if (this.options.autoplay) this.videoElement.setAttribute('autoplay', '');
    if (this.options.muted) this.videoElement.setAttribute('muted', '');
    if (this.options.controls) this.videoElement.setAttribute('controls', '');
    if (this.options.loop) this.videoElement.setAttribute('loop', '');
    
    // Set source if provided
    if (this.options.src) {
      const source = document.createElement('source');
      source.src = this.options.src;
      source.type = this.options.type || 'video/mp4';
      this.videoElement.appendChild(source);
    }
    
    // Add to player
    this.playerWrapper.appendChild(this.videoElement);
    
    // Mark as initialized
    this.playerInitialized = true;
    
    // Trigger event
    this.container.dispatchEvent(new CustomEvent('playerReady', { 
      detail: { player: this }
    }));
  }
  
  /**
   * Show access denied message
   * @private
   */
  showAccessDenied() {
    this.loadingOverlay.style.display = 'none';
    this.errorOverlay.style.display = 'flex';
    this.errorOverlay.innerHTML = `
      <div class="access-denied-message">
        <h3>Access Denied</h3>
        <p>You don't have the required NFT to view this content.</p>
        <button class="purchase-button">Purchase Access NFT</button>
      </div>
    `;
    
    // Add event listener to purchase button
    const purchaseButton = this.errorOverlay.querySelector('.purchase-button');
    purchaseButton.addEventListener('click', () => {
      this.handlePurchase();
    });
  }
  
  /**
   * Show error message
   * @private
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.loadingOverlay.style.display = 'none';
    this.errorOverlay.style.display = 'flex';
    this.errorOverlay.innerHTML = `
      <div class="error-message">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Handle NFT purchase flow
   * @private
   */
  async handlePurchase() {
    // This would connect to a marketplace or minting contract
    alert('NFT purchase flow would be implemented here');
    // Typically would redirect to marketplace or open modal
  }
  
  /**
   * Add required CSS styles
   * @private
   */
  addStyles() {
    if (document.getElementById('web3-video-player-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'web3-video-player-styles';
    styleEl.textContent = `
      .web3-video-player-wrapper {
        position: relative;
        width: 100%;
        background-color: #000;
        overflow: hidden;
        border-radius: 8px;
        aspect-ratio: 16/9;
      }
      
      .web3-video-element {
        width: 100%;
        height: 100%;
      }
      
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        z-index: 10;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        z-index: 10;
        text-align: center;
        padding: 20px;
      }
      
      .error-message h3, .access-denied-message h3 {
        font-size: 24px;
        margin-bottom: 10px;
      }
      
      .purchase-button {
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #3d5afe;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
      }
      
      .purchase-button:hover {
        background-color: #536dfe;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  /**
   * Load a new video source
   * @param {string} src - Video URL
   * @param {string} type - MIME type (e.g., 'video/mp4')
   */
  loadSource(src, type = 'video/mp4') {
    if (!this.playerInitialized) {
      this.options.src = src;
      this.options.type = type;
      return;
    }
    
    // Clear existing sources
    while (this.videoElement.firstChild) {
      this.videoElement.removeChild(this.videoElement.firstChild);
    }
    
    // Add new source
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    this.videoElement.appendChild(source);
    this.videoElement.load();
  }
  
  /**
   * Play the video
   */
  play() {
    if (this.videoElement) {
      this.videoElement.play().catch(error => {
        console.error('Playback failed:', error);
      });
    }
  }
  
  /**
   * Pause the video
   */
  pause() {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }
  
  /**
   * Get current playback state
   * @returns {Object} Playback state
   */
  getState() {
    if (!this.videoElement) return {};
    
    return {
      currentTime: this.videoElement.currentTime,
      duration: this.videoElement.duration,
      paused: this.videoElement.paused,
      ended: this.videoElement.ended,
      muted: this.videoElement.muted,
      volume: this.videoElement.volume,
      playbackRate: this.videoElement.playbackRate
    };
  }
  
  /**
   * Clean up resources and remove event listeners
   */
  destroy() {
    // Remove from DOM
    if (this.container && this.playerWrapper) {
      this.container.removeChild(this.playerWrapper);
    }
    
    // Clean up any event listeners here if needed
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Web3VideoPlayer;
}