- --
layout: default
title: Interactive Playground
description: Test and experience Web3 Crypto Streaming Service features in a sandbox environment
permalink: /playground/
- --

# Interactive Playground

Welcome to the Web3 Crypto Streaming Service playground! This is a safe environment to test and experience our platform's features without using real cryptocurrency or creating an actual account.

## Features to Explore

<div class="playground-container">
  <div class="playground-tabs">
    <button class="tab-button active" data-tab="wallet-connection">Wallet Connection</button>
    <button class="tab-button" data-tab="streaming-demo">Streaming Demo</button>
    <button class="tab-button" data-tab="token-economics">Token Economics</button>
    <button class="tab-button" data-tab="creator-tools">Creator Tools</button>
  </div>
  
  <div class="playground-content">
    <div class="tab-content active" id="wallet-connection">
      <h3>Connect Virtual Wallet</h3>
      <p>Try connecting a simulated wallet to experience the authentication flow:</p>
      <div class="demo-wallet-connect">
        <button class="button primary" id="demo-connect-wallet">Connect Demo Wallet</button>
        <div class="wallet-status" id="wallet-status">Status: Not connected</div>
      </div>
      <div class="virtual-address hidden" id="virtual-address">
        <p>Your demo wallet address:</p>
        <code>0x71C7656EC7ab88b098defB751B7401B5f6d8976F</code>
        <p><small>Note: This is a simulated wallet and does not interact with any blockchain</small></p>
      </div>
    </div>
    
    <div class="tab-content" id="streaming-demo">
      <h3>Experience Sample Content</h3>
      <div class="demo-video-container">
        <div class="demo-video-player">
          <div class="video-placeholder">
            <div class="play-button">▶</div>
            <p>Web3 Streaming Demo</p>
          </div>
          <div class="video-controls">
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <div class="control-buttons">
              <button>Play</button>
              <button>Fullscreen</button>
              <div class="quality-selector">720p ▾</div>
            </div>
          </div>
        </div>
      </div>
      <div class="stream-info">
        <h4>Decentralized Content Delivery</h4>
        <p>This demo showcases how content flows through our decentralized network compared to traditional centralized platforms.</p>
        <div class="network-visualization">
          <div class="node node-creator">Creator</div>
          <div class="node-connections"></div>
          <div class="node node-network">Network Nodes</div>
          <div class="node-connections"></div>
          <div class="node node-viewer">You</div>
        </div>
      </div>
    </div>
    
    <div class="tab-content" id="token-economics">
      <h3>Interactive Token Economy</h3>
      <div class="token-simulator">
        <div class="token-balance">
          <h4>Your STREAM Tokens</h4>
          <div class="token-amount">100 <span class="token-symbol">STREAM</span></div>
        </div>
        <div class="token-actions">
          <h4>Try Token Interactions</h4>
          <div class="action-buttons">
            <button class="button secondary" id="demo-subscribe">Subscribe to Creator (10 STREAM)</button>
            <button class="button secondary" id="demo-tip">Send Tip (5 STREAM)</button>
            <button class="button secondary" id="demo-stake">Stake Tokens (25 STREAM)</button>
          </div>
          <div class="transaction-log">
            <p>Transaction history will appear here...</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="tab-content" id="creator-tools">
      <h3>Creator Dashboard Demo</h3>
      <div class="creator-dashboard">
        <div class="dashboard-metrics">
          <div class="metric-card">
            <h4>Subscribers</h4>
            <div class="metric-value">250</div>
          </div>
          <div class="metric-card">
            <h4>Monthly Revenue</h4>
            <div class="metric-value">2,500 STREAM</div>
          </div>
          <div class="metric-card">
            <h4>Content Views</h4>
            <div class="metric-value">12,430</div>
          </div>
        </div>
        <div class="upload-demo">
          <h4>Content Upload</h4>
          <div class="upload-form">
            <div class="form-group">
              <label>Title</label>
              <input type="text" placeholder="Enter video title">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea placeholder="Enter description"></textarea>
            </div>
            <div class="form-group">
              <label>Upload File</label>
              <button class="button secondary">Select File</button>
            </div>
            <button class="button primary">Simulate Upload</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="playground-footer">
  <p>Ready to try the real thing?</p>
  <a href="#beta-signup" class="button primary">Join Beta Program</a>
</div>

<!-- Include the asset links -->
{% include playground-asset-links.html %}

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Demo wallet connection
  const connectButton = document.getElementById('demo-connect-wallet');
  const walletStatus = document.getElementById('wallet-status');
  const virtualAddress = document.getElementById('virtual-address');
  
  connectButton.addEventListener('click', () => {
    connectButton.disabled = true;
    connectButton.textContent = 'Connecting...';
    
    setTimeout(() => {
      walletStatus.innerHTML = 'Status: <span style="color: #4CAF50;">Connected</span>';
      connectButton.textContent = 'Disconnect Wallet';
      virtualAddress.classList.remove('hidden');
      connectButton.disabled = false;
      
      connectButton.addEventListener('click', () => {
        walletStatus.innerHTML = 'Status: Not connected';
        connectButton.textContent = 'Connect Demo Wallet';
        virtualAddress.classList.add('hidden');
      }, { once: true });
    }, 1500);
  });
  
  // Token transaction simulation
  const transactionLog = document.querySelector('.transaction-log');
  let tokenBalance = 100;
  
  document.getElementById('demo-subscribe').addEventListener('click', () => {
    if (tokenBalance >= 10) {
      tokenBalance -= 10;
      updateTokenBalance();
      addTransactionLog('Subscribed to Creator Demo', '- 10 STREAM');
    } else {
      addTransactionLog('Insufficient tokens for subscription', 'Failed');
    }
  });
  
  document.getElementById('demo-tip').addEventListener('click', () => {
    if (tokenBalance >= 5) {
      tokenBalance -= 5;
      updateTokenBalance();
      addTransactionLog('Sent tip to Creator Demo', '- 5 STREAM');
    } else {
      addTransactionLog('Insufficient tokens for tip', 'Failed');
    }
  });
  
  document.getElementById('demo-stake').addEventListener('click', () => {
    if (tokenBalance >= 25) {
      tokenBalance -= 25;
      updateTokenBalance();
      addTransactionLog('Staked tokens for rewards', '- 25 STREAM');
      
      // Simulate staking rewards after 5 seconds
      setTimeout(() => {
        tokenBalance += 2;
        updateTokenBalance();
        addTransactionLog('Received staking reward', '+ 2 STREAM');
      }, 5000);
    } else {
      addTransactionLog('Insufficient tokens for staking', 'Failed');
    }
  });
  
  function updateTokenBalance() {
    document.querySelector('.token-amount').textContent = tokenBalance + ' STREAM';
  }
  
  function addTransactionLog(action, amount) {
    const logEntry = document.createElement('div');
    logEntry.className = 'tx-log-entry';
    logEntry.innerHTML = `<span class="tx-action">${action}</span><span class="tx-amount">${amount}</span>`;
    
    if (transactionLog.querySelector('p')) {
      transactionLog.innerHTML = '';
    }
    
    transactionLog.prepend(logEntry);
  }
});
</script>

<style>
.playground-container {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
  margin: 2rem 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.playground-tabs {
  display: flex;
  background-color: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-button {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: var(--secondary-light);
  background-color: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: var(--light-color);
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid var(--secondary);
}

.playground-content {
  padding: 2rem;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* Wallet connection demo */
.demo-wallet-connect {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.wallet-status {
  font-size: 0.9rem;
  color: var(--text-muted-on-dark);
}

.virtual-address {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.virtual-address code {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.hidden {
  display: none;
}

/* Video player demo */
.demo-video-container {
  margin: 1.5rem 0;
}

.demo-video-player {
  width: 100%;
  background-color: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--light-color);
  background-color: #111;
}

.play-button {
  width: 60px;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-button:hover {
  background-color: var(--primary);
  transform: scale(1.1);
}

.video-controls {
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.8);
}

.progress-bar {
  height: 5px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.progress-fill {
  width: 30%;
  height: 100%;
  background-color: var(--primary);
  border-radius: 3px;
}

.control-buttons {
  display: flex;
  align-items: center;
}

.control-buttons button {
  background-color: transparent;
  border: none;
  color: var(--light-color);
  padding: 0.25rem 0.5rem;
  margin-right: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.quality-selector {
  margin-left: auto;
  color: var(--light-color);
  font-size: 0.85rem;
}

.network-visualization {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
}

.node {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
}

.node-creator {
  background-color: rgba(110, 69, 226, 0.2);
  border: 1px solid rgba(110, 69, 226, 0.3);
}

.node-network {
  background-color: rgba(0, 216, 255, 0.2);
  border: 1px solid rgba(0, 216, 255, 0.3);
}

.node-viewer {
  background-color: rgba(72, 187, 120, 0.2);
  border: 1px solid rgba(72, 187, 120, 0.3);
}

.node-connections {
  flex-grow: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(110, 69, 226, 0.5), rgba(0, 216, 255, 0.5), rgba(72, 187, 120, 0.5));
}

/* Token economy demo */
.token-simulator {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.token-balance {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.token-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--secondary);
  margin-top: 0.5rem;
}

.token-symbol {
  font-size: 1rem;
  opacity: 0.8;
}

.token-actions {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.transaction-log {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 1rem;
  height: 150px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.9rem;
}

.tx-log-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Creator dashboard demo */
.creator-dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0.5rem;
}

.upload-demo {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
}

.upload-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--text-muted-on-dark);
}

.form-group input, 
.form-group textarea {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0.75rem;
  color: var(--light-color);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.playground-footer {
  text-align: center;
  margin-top: 3rem;
}

@media (min-width: 768px) {
  .creator-dashboard {
    grid-template-columns: 1fr 2fr;
  }
  
  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .playground-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1 1 calc(50% - 2px);
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>

