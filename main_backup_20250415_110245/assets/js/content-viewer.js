/**
 * Content Viewer Component
 * 
 * Handles token-gated streaming content access, creator payments, and viewer interactions.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const connectButton = document.getElementById('connectToView');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  const streamPlaceholder = document.getElementById('streamPlaceholder');
  const tokenGateOverlay = document.getElementById('tokenGateOverlay');
  const payOnceButton = document.getElementById('payOnceButton');
  const subscribeOptionButton = document.getElementById('subscribeOptionButton');
  const tipButton = document.getElementById('tipButton');
  const tipModal = document.getElementById('tipModal');
  const closeTipModal = document.getElementById('closeTipModal');
  const cancelTip = document.getElementById('cancelTip');
  const confirmTip = document.getElementById('confirmTip');
  const tipAmountOptions = document.querySelectorAll('.tip-amount-option');
  const customTipAmount = document.getElementById('customTipAmount');
  const tipMessage = document.getElementById('tipMessage');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const distributionChart = document.getElementById('distributionChart');
  const recommendationGrid = document.querySelector('.recommendation-grid');
  
  // State
  let walletConnected = false;
  let contentUnlocked = false;
  let currentTipAmount = 5; // Default tip amount
  let chart = null; // Distribution chart instance
  
  // Sample data
  const contentData = {
    id: '0xf8e4b2a3c1d9e7f6b5a2c3d4e5f6a7b8',
    title: 'Introduction to Web3 Technology',
    creator: {
      name: 'Alex Thompson',
      address: '0x3a4b59c0e461957c36ac54b3b1dbb52d66443d78',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    description: `This comprehensive tutorial covers the foundations of Web3 technology, including:
    
    • Blockchain fundamentals and consensus mechanisms
    • Smart contract development on Ethereum and Layer 2 networks
    • Decentralized storage with IPFS
    • Token standards (ERC-20, ERC-721, ERC-1155)
    • Web3 authentication protocols
    
    Perfect for developers looking to transition from Web2 to Web3 development.`,
    accessOptions: {
      payPerView: 5,
      subscription: 20
    },
    ipfs: 'QmYvWjTyLNKytiV9CyrRCiVwVMpx8VzCM516i2KK1wLPSH',
    duration: '42:38',
    published: 'March 15, 2025',
    license: 'Creator Commons 4.0',
    quality: '4K (Adaptive)',
    distribution: {
      creator: 90,
      platform: 7,
      dao: 3
    },
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
  };
  
  // Sample recommendations
  const recommendations = [
    {
      id: '0xd45a1bc2e387f',
      title: 'Understanding Token Economics',
      creator: 'Alex Thompson',
      thumbnail: 'https://picsum.photos/seed/token/300/200',
      duration: '38:21'
    },
    {
      id: '0x9c72b5f4a1e2d',
      title: 'Smart Contract Security Best Practices',
      creator: 'Alex Thompson',
      thumbnail: 'https://picsum.photos/seed/security/300/200',
      duration: '45:12'
    },
    {
      id: '0x3e76d5c8b9a1f',
      title: 'Building dApps with React',
      creator: 'Alex Thompson',
      thumbnail: 'https://picsum.photos/seed/react/300/200',
      duration: '51:34'
    },
    {
      id: '0x8f2e7c1d6b5a',
      title: 'Layer 2 Scaling Solutions',
      creator: 'Alex Thompson',
      thumbnail: 'https://picsum.photos/seed/layer2/300/200',
      duration: '29:45'
    }
  ];
  
  // Initialize the page
  function init() {
    populateContentData();
    initializeTabs();
    createDistributionChart();
    populateRecommendations();
    
    // Event listeners
    connectButton.addEventListener('click', connectWallet);
    payOnceButton.addEventListener('click', handlePayOnce);
    subscribeOptionButton.addEventListener('click', handleSubscribe);
    tipButton.addEventListener('click', openTipModal);
    closeTipModal.addEventListener('click', closeTipModalHandler);
    cancelTip.addEventListener('click', closeTipModalHandler);
    confirmTip.addEventListener('click', handleSendTip);
    
    tipAmountOptions.forEach(option => {
      option.addEventListener('click', (e) => selectTipAmount(e.target));
    });
    
    customTipAmount.addEventListener('input', handleCustomTipAmount);
  }
  
  // Populate content data
  function populateContentData() {
    document.getElementById('contentTitle').textContent = contentData.title;
    document.getElementById('creatorName').textContent = contentData.creator.name;
    document.getElementById('contentDescription').innerHTML = `<p>${contentData.description}</p>`;
    
    // Set creator avatar if available
    if (contentData.creator.avatar) {
      const img = document.createElement('img');
      img.src = contentData.creator.avatar;
      img.alt = contentData.creator.name;
      document.getElementById('creatorAvatar').appendChild(img);
    }
  }
  
  // Initialize tabs
  function initializeTabs() {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show selected tab content
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === tabName) {
            content.classList.add('active');
          }
        });
        
        // Redraw chart if distribution tab activated
        if (tabName === 'distribution' && chart) {
          chart.resize();
        }
      });
    });
  }
  
  // Create distribution chart
  function createDistributionChart() {
    if (!distributionChart) return;
    
    const ctx = distributionChart.getContext('2d');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Creator', 'Platform', 'DAO Treasury'],
        datasets: [{
          data: [contentData.distribution.creator, contentData.distribution.platform, contentData.distribution.dao],
          backgroundColor: ['#6366f1', '#2dd4bf', '#f472b6'],
          borderColor: 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            bodyFont: {
              family: 'system-ui, -apple-system, sans-serif'
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.raw + '%';
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
  
  // Populate recommendations
  function populateRecommendations() {
    if (!recommendationGrid) return;
    
    recommendations.forEach(item => {
      const recommendationEl = document.createElement('div');
      recommendationEl.className = 'recommendation-item';
      recommendationEl.innerHTML = `
        <div class="recommendation-thumbnail">
          <img src="${item.thumbnail}" alt="${item.title}">
          <div class="recommendation-duration">${item.duration}</div>
        </div>
        <div class="recommendation-info">
          <div class="recommendation-title">${item.title}</div>
          <div class="recommendation-creator">${item.creator}</div>
        </div>
      `;
      recommendationEl.addEventListener('click', () => {
        // In a full implementation, this would redirect to that content
        console.log('Navigate to content:', item.id);
      });
      recommendationGrid.appendChild(recommendationEl);
    });
  }
  
  // Wallet connection handler
  async function connectWallet() {
    // In a production environment, this would use a real wallet provider
    try {
      connectButton.textContent = 'Connecting...';
      
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user has access to this content
      const hasAccess = false; // This would be determined by checking on-chain access rights
      
      if (hasAccess) {
        unlockContent();
      } else {
        showTokenGate();
      }
      
      walletConnected = true;
      
      // Update header wallet button
      const globalWalletButton = document.getElementById('connect-wallet');
      if (globalWalletButton) {
        globalWalletButton.textContent = 'Wallet Connected';
        globalWalletButton.classList.add('connected');
      }
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      connectButton.textContent = 'Connection Failed';
      setTimeout(() => {
        connectButton.textContent = 'Connect Wallet';
      }, 2000);
    }
  }
  
  // Show token gate for purchasing access
  function showTokenGate() {
    tokenGateOverlay.style.display = 'flex';
  }
  
  // Handle one-time payment
  async function handlePayOnce() {
    try {
      payOnceButton.textContent = 'Processing...';
      payOnceButton.disabled = true;
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Transaction success
      payOnceButton.textContent = 'Access Granted!';
      setTimeout(() => {
        tokenGateOverlay.style.display = 'none';
        unlockContent();
      }, 1000);
      
    } catch (error) {
      console.error('Payment error:', error);
      payOnceButton.textContent = 'Transaction Failed';
      payOnceButton.disabled = false;
      setTimeout(() => {
        payOnceButton.textContent = `Pay ${contentData.accessOptions.payPerView} STREAM`;
      }, 2000);
    }
  }
  
  // Handle subscribe
  async function handleSubscribe() {
    try {
      subscribeOptionButton.textContent = 'Processing...';
      subscribeOptionButton.disabled = true;
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Transaction success
      subscribeOptionButton.textContent = 'Subscribed!';
      setTimeout(() => {
        tokenGateOverlay.style.display = 'none';
        unlockContent();
      }, 1000);
      
    } catch (error) {
      console.error('Subscription error:', error);
      subscribeOptionButton.textContent = 'Transaction Failed';
      subscribeOptionButton.disabled = false;
      setTimeout(() => {
        subscribeOptionButton.textContent = 'Subscribe';
      }, 2000);
    }
  }
  
  // Unlock content
  function unlockContent() {
    streamPlaceholder.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    videoSource.src = contentData.videoUrl;
    videoPlayer.load();
    contentUnlocked = true;
  }
  
  // Open tip modal
  function openTipModal() {
    if (!walletConnected) {
      connectWallet();
      return;
    }
    
    tipModal.style.display = 'flex';
  }
  
  // Close tip modal
  function closeTipModalHandler() {
    tipModal.style.display = 'none';
    resetTipForm();
  }
  
  // Select tip amount
  function selectTipAmount(option) {
    // Remove selected class from all options
    tipAmountOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Add selected class to clicked option
    option.classList.add('selected');
    
    // Update current tip amount
    currentTipAmount = parseFloat(option.getAttribute('data-amount'));
    
    // Clear custom amount input
    customTipAmount.value = '';
  }
  
  // Handle custom tip amount
  function handleCustomTipAmount() {
    const amount = parseFloat(customTipAmount.value);
    if (!isNaN(amount) && amount > 0) {
      // Remove selected class from preset options
      tipAmountOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Update current tip amount
      currentTipAmount = amount;
    }
  }
  
  // Handle send tip
  async function handleSendTip() {
    if (isNaN(currentTipAmount) || currentTipAmount <= 0) {
      alert('Please enter a valid tip amount');
      return;
    }
    
    try {
      confirmTip.textContent = 'Processing...';
      confirmTip.disabled = true;
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Transaction success
      confirmTip.textContent = 'Tip Sent!';
      
      // Display thank you message
      const tipModalContent = document.querySelector('.tip-modal-content');
      tipModalContent.innerHTML = `
        <div class="tip-success">
          <div class="success-icon">✓</div>
          <h3>Thank You!</h3>
          <p>You've successfully sent ${currentTipAmount} STREAM to ${contentData.creator.name}.</p>
        </div>
      `;
      
      document.querySelector('.tip-modal-footer').innerHTML = `
        <button class="button primary" onclick="document.getElementById('tipModal').style.display='none'">Close</button>
      `;
      
    } catch (error) {
      console.error('Tip error:', error);
      confirmTip.textContent = 'Transaction Failed';
      confirmTip.disabled = false;
      setTimeout(() => {
        confirmTip.textContent = 'Send Tip';
      }, 2000);
    }
  }
  
  // Reset tip form
  function resetTipForm() {
    tipAmountOptions.forEach(opt => opt.classList.remove('selected'));
    // Select default option (5 STREAM)
    document.querySelector('.tip-amount-option[data-amount="5"]').classList.add('selected');
    customTipAmount.value = '';
    tipMessage.value = '';
    currentTipAmount = 5;
  }
  
  // Initialize the page
  init();
});
