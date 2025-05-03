/**
 * AI Educational Companion
 * Web3 Educational Content Platform
 *
 * Provides interactive AI-assisted education for web3 topics
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const chatContainer = document.querySelector('.chat-container');
  const messageInput = document.querySelector('#message-input');
  const sendButton = document.querySelector('#send-button');
  const messagesContainer = document.querySelector('.messages-container');

  // State
  const conversationHistory = [];
  let isProcessingMessage = false;

  // Initialize
  initializeCompanion();

  /**
   * Initialize the AI companion
   */
  async function initializeCompanion() {
    // Initialize content safety system for educational content
    if (window.contentSafety) {
      await window.contentSafety.initialize({
        level: 'standard'
      });
    }

    // Add welcome message
    addSystemMessage('Welcome to your Web3 Educational Assistant! Ask me anything about blockchain, smart contracts, or web3 technologies.');

    // Attach event listeners
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  /**
   * Handle sending a message
   */
  async function handleSendMessage() {
    if (isProcessingMessage) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Clear input
    messageInput.value = '';

    // Add user message to UI
    addUserMessage(message);

    // Process with AI
    isProcessingMessage = true;
    await processWithAI(message);
    isProcessingMessage = false;
  }

  /**
   * Add a user message to the chat
   */
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
      <div class="message-content">
        <p>${escapeHTML(message)}</p>
      </div>
    `;
    messagesContainer.appendChild(messageElement);

    // Save to history
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Scroll to bottom
    scrollToBottom();
  }

  /**
   * Add an AI assistant message to the chat
   */
  function addAssistantMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';

    // Convert markdown to HTML with simple parser
    const formattedContent = parseMarkdown(message);

    messageElement.innerHTML = `
      <div class="avatar">
        <img src="../assets/images/ai-avatar.svg" alt="AI Assistant">
      </div>
      <div class="message-content">
        ${formattedContent}
      </div>
    `;
    messagesContainer.appendChild(messageElement);

    // Save to history
    conversationHistory.push({
      role: 'assistant',
      content: message
    });

    // Scroll to bottom
    scrollToBottom();
  }

  /**
   * Add a system message to the chat
   */
  function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.innerHTML = `
      <div class="system-content">
        <p>${escapeHTML(message)}</p>
      </div>
    `;
    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    scrollToBottom();
  }

  /**
   * Process user message with AI
   */
  async function processWithAI(message) {
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();

    // Simulate thinking time (in a real app, this would be the API call time)
    const thinkingTime = Math.min(message.length * 10, 2000);

    setTimeout(async () => {
      // Get AI response (in a real app, this would be from an actual AI service)
      const response = await simulateAIResponse(message);

      let processedResponse = response;

      // Apply content safety checks to the response
      if (window.contentSafety) {
        try {
          const result = await window.contentSafety.processContent(response, {
            mode: 'redact',
            context: 'educational-content',
            preserveLength: false
          });

          processedResponse = result.modifiedContent;

          // Add safety notice if content was altered
          if (result.safetyApplied) {
            processedResponse += `\n\n_Note: Some potentially sensitive blockchain information has been replaced with safe example values for educational purposes._`;
          }
        } catch (error) {
          console.error('Content safety error:', error);
        }
      }

      // Remove typing indicator
      document.querySelector('.typing-indicator')?.remove();

      // Simulate realistic typing speed for better UX
      const typingDelay = Math.min(processedResponse.length / 20, 1.5) * 1000;
      simulateRealisticTyping(processedResponse, typingDelay);
    }, thinkingTime);
  }

  /**
   * Simulate an AI response
   * In a real implementation, this would be a call to an AI API
   */
  async function simulateAIResponse(message) {
    // Educational responses about blockchain topics
    const responses = {
      blockchain: "Blockchain is a distributed, immutable ledger technology that maintains a continuously growing list of records (blocks) that are linked using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.\n\nKey properties include:\n\n• Decentralization: No single entity controls the network\n• Immutability: Once recorded, data cannot be altered retroactively\n• Transparency: All transactions are publicly viewable\n• Security: Cryptographic principles make it extremely difficult to tamper with\n\nBlockchains are the foundation of cryptocurrencies like Bitcoin and Ethereum, but have many other applications in supply chain, healthcare, voting systems, and more.",

      ethereum: "Ethereum is a decentralized, open-source blockchain platform that enables the creation of smart contracts and decentralized applications (dApps). It was proposed by Vitalik Buterin in 2013 and launched in 2015.\n\nUnlike Bitcoin which is primarily designed as a digital currency, Ethereum's purpose is to be a platform for deploying code that runs exactly as programmed without downtime, censorship, or third-party interference.\n\nKey components include:\n\n• Ether (ETH): The native cryptocurrency of the platform\n• Smart Contracts: Self-executing contracts with terms written in code\n• Ethereum Virtual Machine (EVM): The runtime environment for smart contracts\n• Gas: The fee mechanism that pays for computation and storage\n\nEthereum has undergone significant changes, including 'The Merge' in 2022 which transitioned it from Proof of Work to Proof of Stake consensus.",

      "smart contracts": "Smart contracts are self-executing programs stored on a blockchain that run when predetermined conditions are met. They automate agreement execution so that all participants can be immediately certain of the outcome, without an intermediary's involvement.\n\nKey characteristics:\n\n• Autonomous: Once deployed, they operate independently\n• Deterministic: Same input always produces the same output\n• Immutable: Code cannot be changed once deployed (though upgradable patterns exist)\n• Transparent: Anyone can verify the contract's code and execution\n\nCommon use cases include:\n\n• Financial services (DeFi): Lending, derivatives, insurance\n• Supply chain: Automating payments when goods change hands\n• Digital identity: Self-sovereign identity verification\n• Gaming & NFTs: Ownership and trading of digital assets\n\nPopular languages for writing smart contracts include Solidity (Ethereum), Rust (Solana), and Move (Aptos/Sui).",

      "web3": "Web3 represents the next evolution of the internet, focused on decentralization and user ownership. It's built primarily on blockchain technology.\n\nEvolution of the web:\n\n• Web1 (1990s-2000s): Read-only, static websites\n• Web2 (2000s-present): Read-write, interactive platforms, but centralized (Facebook, Google)\n• Web3 (emerging): Read-write-own, decentralized applications where users control their data and digital assets\n\nKey Web3 principles:\n\n• Decentralization: Removing central authorities and single points of failure\n• Native payments: Built-in monetary systems using cryptocurrencies\n• Trustlessness: Ability to interact without trusting counterparties\n• Verifiability: Transparency and ability to verify information\n• Self-sovereignty: Users own their data and digital assets\n\nWeb3 spans cryptocurrencies, DeFi, NFTs, DAOs, and decentralized applications (dApps).",

      "default": "As your Web3 educational assistant, I'd be happy to provide information on blockchain technology, cryptocurrencies, smart contracts, decentralized applications, and related topics. I can explain concepts, provide examples, or walk through how different blockchain systems work.\n\nSome popular topics include:\n• Blockchain fundamentals\n• Cryptocurrencies like Bitcoin and Ethereum\n• Smart contracts and their applications\n• Decentralized Finance (DeFi)\n• NFTs (Non-Fungible Tokens)\n• DAOs (Decentralized Autonomous Organizations)\n• Web3 development\n\nWhat specific aspect of blockchain or Web3 would you like to learn about today?"
    };

    // Determine which topic the message is most closely related to
    const lowercaseMessage = message.toLowerCase();
    let bestResponse = responses.default;

    for (const [topic, response] of Object.entries(responses)) {
      if (topic !== 'default' && lowercaseMessage.includes(topic)) {
        bestResponse = response;
        break;
      }
    }

    return bestResponse;
  }

  /**
   * Simulate realistic typing for better UX
   */
  function simulateRealisticTyping(text, duration) {
    const assistant = document.createElement('div');
    assistant.className = 'message assistant-message';
    assistant.innerHTML = `
      <div class="avatar">
        <img src="../assets/images/ai-avatar.svg" alt="AI Assistant">
      </div>
      <div class="message-content">
        <p class="typing-text"></p>
      </div>
    `;
    messagesContainer.appendChild(assistant);

    const typingText = assistant.querySelector('.typing-text');
    const textLength = text.length;
    const charactersPerFrame = textLength / (duration / 16); // 16ms is roughly 60fps

    let charIndex = 0;
    const intervalId = setInterval(() => {
      const nextChunk = Math.ceil(charactersPerFrame);
      const end = Math.min(charIndex + nextChunk, textLength);
      const textChunk = text.substring(charIndex, end);

      charIndex = end;
      typingText.textContent += textChunk;
      scrollToBottom();

      if (charIndex >= textLength) {
        clearInterval(intervalId);
        // Replace with markdown formatted content
        assistant.querySelector('.message-content').innerHTML = parseMarkdown(text);
      }
    }, 16);
  }

  /**
   * Scroll the chat to the bottom
   */
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Simple HTML escaping for security
   */
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Simple markdown parser for formatting messages
   */
  function parseMarkdown(text) {
    // Handle code blocks
    text = text.replace(/```(\w*)([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle bold
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Handle italic
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Handle lists
    text = text.replace(/^• (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Handle newlines
    text = text.replace(/\n\n/g, '<br><br>');

    return text;
  }
});
