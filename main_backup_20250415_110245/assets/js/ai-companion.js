/**
 * AI Companion for Web3 Crypto Streaming Service
 * Provides personalized assistance for blockchain and crypto topics
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const messageForm = document.getElementById('message-form');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const voiceInputButton = document.getElementById('voice-input-button');
  const voiceToggle = document.getElementById('voice-toggle');
  const clearChatButton = document.getElementById('clear-chat');
  const speechStatus = document.getElementById('speech-recognition-status');
  const topicItems = document.querySelectorAll('.topic-item');
  const connectWalletButton = document.getElementById('connect-wallet-companion');
  const walletPrompt = document.getElementById('wallet-prompt');
  
  // State
  let isVoiceEnabled = false;
  let isListening = false;
  let speechRecognition = null;
  let connectedWalletAddress = null;
  
  // Sample responses based on topics
  const responses = {
    blockchain: "Blockchain is a distributed ledger technology that records transactions across many computers. It's the foundation of cryptocurrencies like Bitcoin and Ethereum, ensuring no single entity has control over the entire network. Each block contains a timestamp and link to the previous block, forming a chain.",
    wallets: "Crypto wallets are digital tools that allow you to store, send, and receive cryptocurrencies. They come in different forms: software wallets (mobile/desktop apps), hardware wallets (physical devices), and web wallets (browser-based). For maximum security, hardware wallets like Ledger or Trezor are recommended.",
    tokens: "Tokens are digital assets built on existing blockchains. Utility tokens provide access to a project's services, security tokens represent investment contracts, and governance tokens give voting rights in DAOs. Our platform uses the STREAM token for content monetization and governance.",
    streaming: "Web3 streaming uses blockchain to give creators direct control and revenue. Content is stored on decentralized networks like IPFS, payments happen through smart contracts, and viewers can support creators directly without platforms taking large cuts.",
    ipfs: "IPFS (InterPlanetary File System) is a protocol designed to create a permanent and decentralized method of storing and sharing files. It addresses the inefficiencies of HTTP by using content addressing instead of location addressing. Our platform uses IPFS to store creator content, ensuring censorship resistance."
  };
  
  // Initialize voice recognition if supported
  function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';
      
      speechRecognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        stopSpeechRecognition();
        // Auto-send after voice input
        setTimeout(() => sendMessage(), 300);
      };
      
      speechRecognition.onend = function() {
        stopSpeechRecognition();
      };
      
      speechRecognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopSpeechRecognition();
      };
      
      return true;
    } else {
      console.log('Speech recognition not supported');
      voiceInputButton.style.display = 'none';
      return false;
    }
  }
  
  // Start speech recognition
  function startSpeechRecognition() {
    if (speechRecognition) {
      isListening = true;
      speechStatus.classList.remove('hidden');
      speechRecognition.start();
      voiceInputButton.classList.add('active');
    }
  }
  
  // Stop speech recognition
  function stopSpeechRecognition() {
    if (speechRecognition && isListening) {
      isListening = false;
      speechStatus.classList.add('hidden');
      speechRecognition.stop();
      voiceInputButton.classList.remove('active');
    }
  }
  
  // Add a message to the chat
  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message companion-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (!isUser) {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar';
      
      const avatarImg = document.createElement('img');
      avatarImg.src = '/assets/images/ai-companion.svg';
      avatarImg.alt = 'AI';
      
      avatarDiv.appendChild(avatarImg);
      messageDiv.appendChild(avatarDiv);
    }
    
    messageContent.innerHTML = `<p>${text}</p>`;
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Text-to-speech for companion messages
    if (!isUser && isVoiceEnabled) {
      speakText(text);
    }
  }
  
  // Add a system message to the chat
  function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content system-content';
    messageContent.innerHTML = `<p>${text}</p>`;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Generate AI response based on user input
  function generateResponse(userText) {
    // Normalize user text for matching
    const text = userText.toLowerCase().trim();
    
    // Check for wallet related queries
    if (text.includes('wallet') && text.includes('connect')) {
      return "You can connect your wallet by clicking the 'Connect Wallet' button in the sidebar. This will allow me to provide personalized assistance with your assets.";
    }
    
    // Check for greetings
    if (text.match(/^(hi|hello|hey|greetings|howdy)/i)) {
      return "Hello! How can I assist you with your Web3 journey today?";
    }
    
    // Check for blockchain topic
    if (text.includes('blockchain') || text.includes('block chain')) {
      return responses.blockchain;
    }
    
    // Check for wallet topic
    if (text.includes('wallet') || text.includes('metamask') || text.includes('ledger')) {
      return responses.wallets;
    }
    
    // Check for token topic
    if (text.includes('token') || text.includes('coin') || text.includes('cryptocurrency')) {
      return responses.tokens;
    }
    
    // Check for streaming topic
    if (text.includes('stream') || text.includes('content') || text.includes('creator')) {
      return responses.streaming;
    }
    
    // Check for IPFS topic
    if (text.includes('ipfs') || text.includes('storage') || text.includes('decentralized storage')) {
      return responses.ipfs;
    }
    
    // Check for identity verification related queries
    if ((text.includes('identity') || text.includes('verification') || text.includes('credential')) && 
        (text.includes('what') || text.includes('how'))) {
      return `Decentralized Identity Verification (DID) uses the 'aidisixihpamgafaagbris5eyz' entropy seed to generate secure credentials without exposing your private data. Your wallet serves as the cryptographic proof of identity, while our system creates verifiable credentials that work across the Web3 ecosystem. Your credentials are stored client-side and cryptographically signed, not in any central database.`;
    }
    
    // Generic response when no specific topic is matched
    return "That's an interesting question about Web3. While I'm focused on blockchain topics, I'm continuously learning. Could you provide more details or try asking about blockchain, wallets, tokens, streaming, or IPFS?";
  }
  
  // Process and send user message
  async function sendMessage() {
    const text = userInput.value.trim();
    if (text === '') return;
    
    // Add user message to chat
    addMessage(text, true);
    
    // Clear input
    userInput.value = '';
    
    // Simulate AI thinking with dots
    simulateTyping();
    
    // Generate response with realistic variable timing based on message complexity
    const messageComplexity = Math.min(text.length / 20, 1); // 0-1 scale based on message length
    const baseThinkingTime = 1000; // Base thinking time in ms
    const variableTime = 2000; // Additional variable time
    const thinkingTime = baseThinkingTime + (variableTime * messageComplexity * (0.7 + Math.random() * 0.6));
    
    setTimeout(async () => {
      // Generate initial response
      const response = generateResponse(text);
      
      // Apply content moderation if available
      let moderatedResponse = response;
      
      if (window.contentModerator) {
        try {
          const result = await window.contentModerator.moderateContent(response, {
            mode: 'redact',
            context: 'ai-response',
            preserveLength: false
          });
          
          moderatedResponse = result.modifiedContent;
          
          // Add moderation notice if content was altered
          if (result.moderated) {
            moderatedResponse += `\n\n_Note: Some potentially sensitive information has been redacted for security reasons._`;
          }
        } catch (error) {
          console.error('Content moderation error:', error);
        }
      }
      
      document.querySelector('.typing-indicator')?.remove();
      
      // Simulate realistic typing speed
      const typingDelay = Math.min(moderatedResponse.length / 20, 1.5) * 1000;
      simulateRealisticTyping(moderatedResponse, typingDelay);
    }, thinkingTime);
  }
  
  // Simulate realistic typing with progressive message display
  function simulateRealisticTyping(message, duration) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message companion-message typing-response';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = '/assets/images/ai-companion.svg';
    avatarImg.alt = 'AI';
    avatarDiv.appendChild(avatarImg);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<p class="typing-text"></p>';
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const typingText = contentDiv.querySelector('.typing-text');
    const charsToShow = message.length;
    const intervalTime = duration / charsToShow;
    
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < charsToShow) {
        charIndex++;
        typingText.textContent = message.substring(0, charIndex);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        clearInterval(typingInterval);
        typingDiv.className = 'message companion-message'; // Remove typing class
      }
    }, intervalTime);
  }

  // Show typing indicator with realistic variable animations
  function simulateTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message companion-message typing-indicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = '/assets/images/ai-companion.svg';
    avatarImg.alt = 'AI';
    
    avatarDiv.appendChild(avatarImg);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Create more realistic thinking animation
    const thinkingHTML = `
      <div class="thinking-animation">
        <span class="thinking-dot" style="animation-delay: 0ms"></span>
        <span class="thinking-dot" style="animation-delay: 300ms"></span>
        <span class="thinking-dot" style="animation-delay: 600ms"></span>
      </div>
    `;
    
    contentDiv.innerHTML = thinkingHTML;
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Text to speech function
  function speakText(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // Clear chat history
  function clearChat() {
    while (chatMessages.firstChild) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    
    // Add welcome message
    addMessage("Hello! I'm your Web3 assistant. I can help you understand blockchain technology, manage your crypto assets, and optimize your content streaming. What would you like to know about today?");
  }
  
  // Handle wallet connection
  async function connectWallet() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectedWalletAddress = accounts[0];
        
        // Initialize identity verification
        let identityMessage = "";
        
        if (window.decentralizedIdentity) {
          try {
            // Show identity verification in progress
            addMessage("Verifying your decentralized identity credentials...");
            simulateTyping();
            
            // Initialize identity system
            await window.decentralizedIdentity.initialize(connectedWalletAddress);
            const verification = await window.decentralizedIdentity.verifyIdentity();
            
            // Clear typing indicator
            document.querySelector('.typing-indicator')?.remove();
            
            if (verification.verified) {
              identityMessage = `\n\nI've verified your decentralized identity (${verification.credential.id.substring(0, 10)}...). This gives you access to personalized assistance with enhanced security.`;
            } else {
              identityMessage = `\n\nI couldn't fully verify your decentralized identity: ${verification.message}. Some personalized features may be limited.`;
            }
          } catch (error) {
            console.error("Identity verification error:", error);
            identityMessage = `\n\nThere was an issue verifying your decentralized identity. You can still use basic features.`;
          }
        }
        
        // Update UI for connected wallet
        if (walletPrompt) {
          walletPrompt.innerHTML = `
            <p>Wallet Connected: ${connectedWalletAddress.substring(0, 6)}...${connectedWalletAddress.substring(38)}</p>
            <div class="connected-badge">
              <i class="fas fa-check-circle"></i> Personalized assistance active
            </div>
          `;
        }
        
        // Acknowledge in chat
        addMessage(`I've detected your connected wallet. I can now provide personalized assistance with your assets and content. Feel free to ask about your token balance or content performance.${identityMessage}`);
        
      } else {
        throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addMessage(`I couldn't connect to your wallet: ${error.message}. Please try again or make sure you have MetaMask installed.`);
    }
  }
  
  // Event Listeners
  
  // Message form submission
  if (messageForm) {
    messageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      sendMessage();
    });
  }
  
  // Voice input button
  if (voiceInputButton) {
    voiceInputButton.addEventListener('click', function() {
      if (!isListening) {
        startSpeechRecognition();
      } else {
        stopSpeechRecognition();
      }
    });
  }
  
  // Voice toggle switch
  if (voiceToggle) {
    voiceToggle.addEventListener('change', function() {
      isVoiceEnabled = this.checked;
      localStorage.setItem('ai-voice-enabled', isVoiceEnabled);
    });
    
    // Load saved preference
    if (localStorage.getItem('ai-voice-enabled') === 'true') {
      voiceToggle.checked = true;
      isVoiceEnabled = true;
    }
  }
  
  // Clear chat button
  if (clearChatButton) {
    clearChatButton.addEventListener('click', clearChat);
  }
  
  // Topic selection
  topicItems.forEach(item => {
    item.addEventListener('click', function() {
      const topic = this.getAttribute('data-topic');
      if (topic && responses[topic]) {
        // Add user question to chat
        const questions = {
          blockchain: "Can you explain blockchain technology?",
          wallets: "How do crypto wallets work?",
          tokens: "What are tokens in the crypto world?",
          streaming: "How does Web3 streaming differ from traditional platforms?",
          ipfs: "What is IPFS and how does it work?"
        };
        
        addMessage(questions[topic], true);
        
        // Show typing indicator
        simulateTyping();
        
        // Add AI response after a delay
        setTimeout(() => {
          document.querySelector('.typing-indicator')?.remove();
          addMessage(responses[topic]);
        }, 1500);
      }
    });
  });
  
  // Connect wallet button
  if (connectWalletButton) {
    connectWalletButton.addEventListener('click', connectWallet);
  }
  
  // Initialize
  initSpeechRecognition();
  
  // Initialize content moderation
  if (window.contentModerator) {
    window.contentModerator.initialize({
      level: 'standard',
      context: 'ai-companion'
    }).then(() => {
      console.log('Content moderation enabled for AI companion');
    }).catch(err => {
      console.error('Failed to initialize content moderation:', err);
    });
  }
  
  // Check user input for sensitive content
  if (userInput) {
    userInput.addEventListener('blur', async function() {
      const text = userInput.value.trim();
      if (!text || !window.contentModerator) return;
      
      try {
        const result = await window.contentModerator.moderateContent(text, {
          mode: 'flag',
          context: 'user-input'
        });
        
        if (result.moderated && result.metadata.severity === 'critical') {
          addSystemMessage("⚠️ Warning: Your message appears to contain sensitive information such as private keys or addresses. Please be careful not to share such information in conversations.");
        }
      } catch (error) {
        console.error('Input moderation error:', error);
      }
    });
  }
  
  // Check if wallet is already connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    connectedWalletAddress = window.ethereum.selectedAddress;
    
    // Update UI for connected wallet
    if (walletPrompt) {
      walletPrompt.innerHTML = `
        <p>Wallet Connected: ${connectedWalletAddress.substring(0, 6)}...${connectedWalletAddress.substring(38)}</p>
        <div class="connected-badge">
          <i class="fas fa-check-circle"></i> Personalized assistance active
        </div>
      `;
    }
  }
});
