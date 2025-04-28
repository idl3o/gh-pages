- --
layout: default
title: Content Viewer
description: Stream content securely through the Web3 Crypto Streaming Service platform
permalink: /viewer/
- --

# Web3 Content Viewer

<div class="content-viewer-container">
  <div class="viewer-header">
    <div class="creator-info">
      <div class="creator-avatar" id="creatorAvatar"></div>
      <div class="creator-details">
        <h2 id="contentTitle">Content Title</h2>
        <div class="creator-name" id="creatorName">Creator Name</div>
      </div>
    </div>
    <div class="viewer-actions">
      <button class="button secondary" id="subscribeButton">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path>
          </svg>
        </span>
        Subscribe
      </button>
      <button class="button primary" id="tipButton">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v12"></path>
            <path d="M8 12h8"></path>
          </svg>
        </span>
        Send Tip
      </button>
    </div>
  </div>

  <div class="viewer-main">
    <div class="stream-container" id="streamContainer">
      <div class="stream-placeholder" id="streamPlaceholder">
        <div class="placeholder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <div class="placeholder-text">Connect wallet to access content</div>
        <button class="button primary" id="connectToView">Connect Wallet</button>
      </div>
      <video id="videoPlayer" controls class="hidden">
        <source src="" type="video/mp4" id="videoSource">
        Your browser does not support the video tag.
      </video>
    </div>

    <div class="content-details">
      <div class="tabs">
        <button class="tab-button active" data-tab="description">Description</button>
        <button class="tab-button" data-tab="metadata">Metadata</button>
        <button class="tab-button" data-tab="distribution">Distribution</button>
      </div>
      
      <div class="tab-content active" id="description">
        <div class="content-description" id="contentDescription">
          <p>This premium content is available through the Web3 Crypto Streaming Service. Connect your wallet to access the full stream securely through our decentralized protocol.</p>
        </div>
        <div class="content-tags">
          <span class="tag">Blockchain</span>
          <span class="tag">Tutorial</span>
          <span class="tag">Premium</span>
        </div>
      </div>
      
      <div class="tab-content" id="metadata">
        <div class="metadata-grid">
          <div class="metadata-item">
            <div class="metadata-label">Content ID</div>
            <div class="metadata-value"><code>0xf8e4b2a3c1d9e7f6b5a2c3d4e5f6a7b8</code></div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Published</div>
            <div class="metadata-value">March 15, 2025</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Duration</div>
            <div class="metadata-value">42:38</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">License</div>
            <div class="metadata-value">Creator Commons 4.0</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Quality</div>
            <div class="metadata-value">4K (Adaptive)</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">IPFS CID</div>
            <div class="metadata-value"><code>QmYvWjTyLNKytiV9CyrRCiVwVMpx8VzCM516i2KK1wLPSH</code></div>
          </div>
        </div>
      </div>
      
      <div class="tab-content" id="distribution">
        <div class="distribution-info">
          <div class="distribution-chart-container">
            <canvas id="distributionChart"></canvas>
          </div>
          <div class="distribution-legend">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #6366f1;"></span>
              <span class="legend-label">Creator Payment (90%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #2dd4bf;"></span>
              <span class="legend-label">Platform Fee (7%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #f472b6;"></span>
              <span class="legend-label">DAO Treasury (3%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="token-gate-overlay" id="tokenGateOverlay">
    <div class="token-gate-container">
      <div class="token-gate-header">
        <h3>Access Required</h3>
      </div>
      <div class="token-gate-content">
        <p>This content requires either:</p>
        <div class="access-options">
          <div class="access-option">
            <div class="access-option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <div class="access-option-details">
              <h4>Pay once</h4>
              <div class="price">5 STREAM</div>
              <p>One-time payment for lifetime access</p>
              <button class="button primary" id="payOnceButton">Pay 5 STREAM</button>
            </div>
          </div>
          <div class="access-option-separator">OR</div>
          <div class="access-option">
            <div class="access-option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="access-option-details">
              <h4>Subscribe</h4>
              <div class="price">20 STREAM/month</div>
              <p>Access all content from this creator</p>
              <button class="button secondary" id="subscribeOptionButton">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div class="token-gate-footer">
        <p>You'll be prompted to approve this transaction with your connected wallet.</p>
      </div>
    </div>
  </div>
  
  <div class="tip-modal" id="tipModal">
    <div class="tip-modal-container">
      <div class="tip-modal-header">
        <h3>Send a Tip to Creator</h3>
        <button class="close-button" id="closeTipModal">&times;</button>
      </div>
      <div class="tip-modal-content">
        <div class="tip-amount-options">
          <button class="tip-amount-option" data-amount="1">1 STREAM</button>
          <button class="tip-amount-option" data-amount="5">5 STREAM</button>
          <button class="tip-amount-option" data-amount="10">10 STREAM</button>
          <button class="tip-amount-option" data-amount="25">25 STREAM</button>
          <button class="tip-amount-option" data-amount="50">50 STREAM</button>
          <button class="tip-amount-option" data-amount="100">100 STREAM</button>
        </div>
        <div class="tip-custom-amount">
          <label for="customTipAmount">Or enter custom amount:</label>
          <div class="custom-tip-input">
            <input type="number" id="customTipAmount" min="1" placeholder="Custom amount">
            <span class="currency-label">STREAM</span>
          </div>
        </div>
        <div class="tip-message">
          <label for="tipMessage">Add a message (optional):</label>
          <textarea id="tipMessage" placeholder="Your message to the creator"></textarea>
        </div>
      </div>
      <div class="tip-modal-footer">
        <button class="button secondary" id="cancelTip">Cancel</button>
        <button class="button primary" id="confirmTip">Send Tip</button>
      </div>
    </div>
  </div>
</div>

<div class="content-recommendations">
  <h3>More From This Creator</h3>
  <div class="recommendation-grid">
    <!-- This section will be populated by JavaScript -->
  </div>
</div>

<link rel="stylesheet" href="{{ '/assets/css/content-viewer.css' | relative_url }}">
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
<script src="{{ '/assets/js/content-viewer.js' | relative_url }}" defer></script>

