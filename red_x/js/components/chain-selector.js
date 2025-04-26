/**
 * Chain Selector Component
 * UI component for selecting and interacting with different blockchain networks
 * Created: April 26, 2025
 */

class ChainSelectorComponent {
  constructor(options = {}) {
    // Default options
    this.options = {
      containerId: 'chain-selector-container',
      onChainSwitch: null,
      onConnectionChange: null,
      infuraApiKey: '',
      defaultChain: 'ethereum',
      showBalance: true,
      showNetworkInfo: true,
      ...options
    };

    this.provider = new MultiChainProvider();
    this.currentChain = null;
    this.isConnected = false;

    this.initComponent();
  }

  /**
   * Initialize the component
   * @private
   */
  async initComponent() {
    // Create UI elements
    this._createUI();

    // Populate chain options
    this._populateChainOptions();

    // Set default chain
    if (this.options.defaultChain) {
      await this.switchChain(this.options.defaultChain);
    }

    // Setup event listeners
    this._setupEventListeners();
  }

  /**
   * Create UI elements
   * @private
   */
  _createUI() {
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      console.error(`Container element with ID '${this.options.containerId}' not found`);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'chain-selector-wrapper';

    // Create header
    const header = document.createElement('div');
    header.className = 'chain-selector-header';
    header.innerHTML = `
      <h3>Blockchain Network</h3>
      <div class="connection-status">
        <span class="status-indicator disconnected"></span>
        <span class="status-text">Disconnected</span>
      </div>
    `;
    wrapper.appendChild(header);

    // Create chain selector dropdown
    const selectorWrapper = document.createElement('div');
    selectorWrapper.className = 'chain-dropdown-wrapper';
    selectorWrapper.innerHTML = `
      <label for="chain-select">Select Network:</label>
      <div class="select-wrapper">
        <select id="chain-select" class="chain-select">
          <option value="" disabled selected>Select a blockchain</option>
        </select>
      </div>
    `;
    wrapper.appendChild(selectorWrapper);

    // Create connection button
    const connectButton = document.createElement('button');
    connectButton.id = 'connect-wallet-button';
    connectButton.className = 'connect-wallet-button';
    connectButton.textContent = 'Connect Wallet';
    wrapper.appendChild(connectButton);

    // Create info panel (hidden initially)
    const infoPanel = document.createElement('div');
    infoPanel.className = 'chain-info-panel hidden';
    infoPanel.innerHTML = `
      <div class="chain-info">
        <div class="chain-icon-container">
          <img src="" alt="" class="chain-icon" />
        </div>
        <div class="chain-details">
          <div class="chain-name"></div>
          <div class="chain-id"></div>
        </div>
      </div>
      <div class="wallet-info hidden">
        <div class="wallet-balance"></div>
        <div class="wallet-address"></div>
      </div>
    `;
    wrapper.appendChild(infoPanel);

    // Add styles
    this._addStyles();

    // Add to container
    container.appendChild(wrapper);

    // Save references to elements
    this.elements = {
      wrapper,
      header,
      select: wrapper.querySelector('#chain-select'),
      connectButton: wrapper.querySelector('#connect-wallet-button'),
      statusIndicator: wrapper.querySelector('.status-indicator'),
      statusText: wrapper.querySelector('.status-text'),
      infoPanel: wrapper.querySelector('.chain-info-panel'),
      chainIcon: wrapper.querySelector('.chain-icon'),
      chainName: wrapper.querySelector('.chain-name'),
      chainId: wrapper.querySelector('.chain-id'),
      walletInfo: wrapper.querySelector('.wallet-info'),
      walletBalance: wrapper.querySelector('.wallet-balance'),
      walletAddress: wrapper.querySelector('.wallet-address')
    };
  }

  /**
   * Add component styles
   * @private
   */
  _addStyles() {
    // Check if styles already exist
    if (document.getElementById('chain-selector-styles')) {
      return;
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'chain-selector-styles';
    styleEl.textContent = `
      .chain-selector-wrapper {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
        max-width: 400px;
        margin: 0 auto;
      }

      .chain-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .chain-selector-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }

      .connection-status {
        display: flex;
        align-items: center;
        font-size: 14px;
      }

      .status-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
      }

      .status-indicator.connected {
        background-color: #4caf50;
        box-shadow: 0 0 5px #4caf50;
      }

      .status-indicator.disconnected {
        background-color: #f44336;
      }

      .status-indicator.connecting {
        background-color: #ff9800;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }

      .chain-dropdown-wrapper {
        margin-bottom: 15px;
      }

      .chain-dropdown-wrapper label {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
        color: #666;
      }

      .select-wrapper {
        position: relative;
      }

      .chain-select {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f8f8f8;
        font-size: 16px;
        appearance: none;
        cursor: pointer;
      }

      .select-wrapper::after {
        content: '▼';
        font-size: 0.8em;
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #666;
      }

      .connect-wallet-button {
        width: 100%;
        padding: 12px;
        background-color: #3f51b5;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-bottom: 15px;
      }

      .connect-wallet-button:hover {
        background-color: #303f9f;
      }

      .connect-wallet-button.connected {
        background-color: #4caf50;
      }

      .connect-wallet-button.connected:hover {
        background-color: #43a047;
      }

      .chain-info-panel {
        border-top: 1px solid #eee;
        padding-top: 15px;
        font-size: 14px;
      }

      .chain-info-panel.hidden {
        display: none;
      }

      .chain-info {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .chain-icon-container {
        width: 32px;
        height: 32px;
        margin-right: 10px;
        border-radius: 50%;
        overflow: hidden;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chain-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }

      .chain-details {
        flex: 1;
      }

      .chain-name {
        font-weight: 500;
        color: #333;
      }

      .chain-id {
        color: #666;
        font-size: 12px;
        margin-top: 3px;
      }

      .wallet-info {
        background-color: #f9f9f9;
        border-radius: 5px;
        padding: 10px;
      }

      .wallet-info.hidden {
        display: none;
      }

      .wallet-balance {
        font-weight: 500;
        margin-bottom: 5px;
      }

      .wallet-address {
        font-family: monospace;
        font-size: 12px;
        color: #666;
        word-break: break-all;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .chain-selector-wrapper {
          background: #222;
          color: #eee;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .chain-selector-header h3 {
          color: #eee;
        }

        .chain-dropdown-wrapper label {
          color: #bbb;
        }

        .chain-select {
          background-color: #333;
          border-color: #444;
          color: #eee;
        }

        .select-wrapper::after {
          color: #aaa;
        }

        .chain-info-panel {
          border-top-color: #444;
        }

        .chain-name {
          color: #eee;
        }

        .chain-id {
          color: #aaa;
        }

        .wallet-info {
          background-color: #333;
        }

        .wallet-address {
          color: #aaa;
        }

        .chain-icon-container {
          background-color: #333;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * Populate chain options in the selector
   * @private
   */
  _populateChainOptions() {
    const select = this.elements.select;
    const chains = this.provider.getSupportedChains();

    // Clear existing options except placeholder
    while (select.options.length > 1) {
      select.remove(1);
    }

    // Add chains
    chains.forEach(chain => {
      const option = document.createElement('option');
      option.value = chain.id;
      option.textContent = chain.name;
      select.appendChild(option);
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Chain selection change
    this.elements.select.addEventListener('change', async e => {
      const chainId = e.target.value;
      if (chainId) {
        await this.switchChain(chainId);
      }
    });

    // Connect wallet button
    this.elements.connectButton.addEventListener('click', async () => {
      if (this.isConnected) {
        this.disconnect();
      } else {
        await this.connect();
      }
    });
  }

  /**
   * Switch to a different blockchain network
   * @param {string} chainId - Chain identifier
   * @returns {Promise<boolean>} - Success status
   */
  async switchChain(chainId) {
    try {
      // Update UI to show connecting state
      this._updateConnectionStatus('connecting');

      // Initialize provider for the chain
      const options = {
        infuraApiKey: this.options.infuraApiKey,
        useWallet: this.isConnected
      };

      const success = await this.provider.initProvider(chainId, options);

      if (success) {
        this.currentChain = chainId;

        // Update UI
        this._updateChainInfo();

        // If already connected to wallet, update connection
        if (this.isConnected) {
          await this._updateWalletConnection();
        } else {
          this._updateConnectionStatus('disconnected');
        }

        // Trigger callback
        if (typeof this.options.onChainSwitch === 'function') {
          this.options.onChainSwitch(chainId, this.provider.getChainConfig(chainId));
        }

        return true;
      } else {
        this._updateConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.error('Error switching chain:', error);
      this._updateConnectionStatus('disconnected');
      return false;
    }
  }

  /**
   * Connect to wallet
   * @returns {Promise<boolean>} - Success status
   */
  async connect() {
    try {
      if (!this.currentChain) {
        // If no chain selected, use default or first in list
        const defaultChain = this.options.defaultChain || this.provider.getSupportedChains()[0].id;
        await this.switchChain(defaultChain);
      }

      this._updateConnectionStatus('connecting');

      // Reinitialize with wallet connection
      const chain = this.provider.getChainConfig(this.currentChain);
      const success = await this.provider.initProvider(this.currentChain, {
        infuraApiKey: this.options.infuraApiKey,
        useWallet: true
      });

      if (success) {
        this.isConnected = true;

        // Update UI
        this._updateConnectionStatus('connected');
        this._updateWalletInfo();

        // Update button text
        this.elements.connectButton.textContent = 'Disconnect Wallet';
        this.elements.connectButton.classList.add('connected');

        // Show wallet info if enabled
        if (this.options.showBalance) {
          this.elements.walletInfo.classList.remove('hidden');
        }

        // Trigger callback
        if (typeof this.options.onConnectionChange === 'function') {
          this.options.onConnectionChange(true);
        }

        return true;
      } else {
        this._updateConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this._updateConnectionStatus('disconnected');
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    // Reset connection state
    this.isConnected = false;

    // Update UI
    this._updateConnectionStatus('disconnected');
    this.elements.connectButton.textContent = 'Connect Wallet';
    this.elements.connectButton.classList.remove('connected');
    this.elements.walletInfo.classList.add('hidden');

    // Reinitialize provider without wallet
    this.provider.initProvider(this.currentChain, {
      infuraApiKey: this.options.infuraApiKey,
      useWallet: false
    });

    // Trigger callback
    if (typeof this.options.onConnectionChange === 'function') {
      this.options.onConnectionChange(false);
    }
  }

  /**
   * Update chain information display
   * @private
   */
  _updateChainInfo() {
    const chainInfo = this.provider.getChainConfig(this.currentChain);

    if (chainInfo && this.options.showNetworkInfo) {
      // Update chain info panel
      this.elements.infoPanel.classList.remove('hidden');
      this.elements.chainName.textContent = chainInfo.name;

      // Show chain ID for EVM chains
      if (!chainInfo.nonEVM) {
        this.elements.chainId.textContent = `Chain ID: ${chainInfo.chainId}`;
      } else {
        this.elements.chainId.textContent = '';
      }

      // Set icon
      const iconPath = `/assets/images/blockchain/${chainInfo.icon}`;
      this.elements.chainIcon.src = iconPath;
      this.elements.chainIcon.alt = `${chainInfo.name} logo`;
    } else {
      // Hide info panel if no chain info or display disabled
      this.elements.infoPanel.classList.add('hidden');
    }

    // Select the chain in dropdown
    this.elements.select.value = this.currentChain;
  }

  /**
   * Update wallet connection status
   * @private
   */
  async _updateWalletConnection() {
    try {
      // Check if we can get accounts as a simple connection test
      const providerInfo = this.provider.providers.get(this.currentChain);

      if (!providerInfo) {
        throw new Error('Provider not initialized');
      }

      // For EVM chains, check for accounts
      if (!providerInfo.chain.nonEVM) {
        let accounts;
        if (providerInfo.type === 'ethers') {
          try {
            const signer = providerInfo.provider.getSigner();
            await signer.getAddress();
            accounts = [true]; // Just need a non-empty array
          } catch (e) {
            accounts = [];
          }
        } else {
          accounts = await providerInfo.provider.eth.getAccounts();
        }

        this.isConnected = accounts && accounts.length > 0;
      } else if (providerInfo.chain.id === 'solana') {
        // For Solana, check wallet connection
        this.isConnected = !!providerInfo.provider.wallet;
      } else {
        this.isConnected = false; // Default for unsupported chains
      }

      // Update UI based on connection status
      if (this.isConnected) {
        this._updateConnectionStatus('connected');
        this.elements.connectButton.textContent = 'Disconnect Wallet';
        this.elements.connectButton.classList.add('connected');

        // Update wallet info
        if (this.options.showBalance) {
          await this._updateWalletInfo();
          this.elements.walletInfo.classList.remove('hidden');
        }
      } else {
        this._updateConnectionStatus('disconnected');
        this.elements.connectButton.textContent = 'Connect Wallet';
        this.elements.connectButton.classList.remove('connected');
        this.elements.walletInfo.classList.add('hidden');
      }

      // Trigger callback
      if (typeof this.options.onConnectionChange === 'function') {
        this.options.onConnectionChange(this.isConnected);
      }
    } catch (error) {
      console.error('Error updating wallet connection:', error);
      this._updateConnectionStatus('disconnected');
      this.isConnected = false;
    }
  }

  /**
   * Update wallet information display
   * @private
   */
  async _updateWalletInfo() {
    if (!this.isConnected || !this.options.showBalance) {
      return;
    }

    try {
      // Get balance from provider
      const balanceInfo = await this.provider.getBalance();

      // Update UI
      this.elements.walletBalance.textContent = `${parseFloat(balanceInfo.formatted).toFixed(4)} ${balanceInfo.symbol}`;

      // Truncate address for display
      const address = balanceInfo.address;
      const truncatedAddress =
        address.substring(0, 6) + '...' + address.substring(address.length - 4);

      this.elements.walletAddress.textContent = truncatedAddress;
      this.elements.walletAddress.title = address; // Full address on hover
    } catch (error) {
      console.error('Error updating wallet info:', error);
      this.elements.walletBalance.textContent = 'Balance unavailable';
      this.elements.walletAddress.textContent = '';
    }
  }

  /**
   * Update the connection status indicator
   * @private
   */
  _updateConnectionStatus(status) {
    const { statusIndicator, statusText } = this.elements;

    // Remove all status classes
    statusIndicator.classList.remove('connected', 'disconnected', 'connecting');

    // Set status based on parameter
    switch (status) {
      case 'connected':
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
        break;
      case 'connecting':
        statusIndicator.classList.add('connecting');
        statusText.textContent = 'Connecting...';
        break;
      case 'disconnected':
      default:
        statusIndicator.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
        break;
    }
  }

  /**
   * Get the current chain ID
   * @returns {string} - Current chain ID
   */
  getCurrentChain() {
    return this.currentChain;
  }

  /**
   * Get the blockchain provider instance
   * @returns {MultiChainProvider} - Provider instance
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Check if wallet is connected
   * @returns {boolean} - Connection status
   */
  isWalletConnected() {
    return this.isConnected;
  }

  /**
   * Refresh the component
   */
  refresh() {
    this._updateChainInfo();
    if (this.isConnected) {
      this._updateWalletInfo();
    }
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChainSelectorComponent;
} else if (typeof window !== 'undefined') {
  window.ChainSelectorComponent = ChainSelectorComponent;
}
