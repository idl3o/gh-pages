/**
 * Project RED X Netcode SDK
 * Handles real-time networking using Socket.io
 */
class NetcodeSDK {
  /**
   * Initialize the Netcode SDK
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.options = Object.assign({
      autoConnect: true,
      debug: false,
      maxRetries: 3,
      retryDelay: 2000,
      messageLimitPerSecond: 10,
      positionUpdateInterval: 50,  // ms between position updates
    }, options);
    
    this.socket = null;
    this.connected = false;
    this.clientId = null;
    this.peers = new Map();
    this.handlers = {
      connect: [],
      disconnect: [],
      message: [],
      error: [],
      userJoined: [],
      userLeft: [],
      position: []
    };
    
    this.retryCount = 0;
    this.messageCount = 0;
    this.lastMessageReset = Date.now();
    this.lastPositionUpdate = 0;
    
    if (this.options.debug) {
      this.log('NetcodeSDK initialized');
    }
    
    if (this.options.autoConnect) {
      this.connect();
    }
  }
  
  /**
   * Connect to the server
   * @returns {Promise} Resolves when connected
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Check if Socket.io is loaded
        if (typeof io === 'undefined') {
          throw new Error('Socket.io not loaded. Add <script src="/socket.io/socket.io.js"></script> to your HTML.');
        }
        
        // Create socket connection
        const url = this.options.url || window.location.origin;
        this.socket = io(url);
        
        // Setup event handlers
        this.socket.on('connect', () => {
          this.connected = true;
          this.clientId = this.socket.id;
          
          this.log('Connected to server with ID:', this.clientId);
          this._trigger('connect', { id: this.clientId });
          resolve(this.clientId);
        });
        
        this.socket.on('disconnect', () => {
          this.connected = false;
          this.log('Disconnected from server');
          this._trigger('disconnect');
          this._attemptReconnect();
        });
        
        this.socket.on('error', (error) => {
          this.log('Socket error:', error);
          this._trigger('error', error);
          reject(error);
        });
        
        this.socket.on('welcome', (data) => {
          this.log('Received welcome message:', data);
        });
        
        this.socket.on('userJoined', (data) => {
          this.peers.set(data.id, { id: data.id });
          this.log('User joined:', data.id);
          this._trigger('userJoined', data);
        });
        
        this.socket.on('userLeft', (data) => {
          this.peers.delete(data.id);
          this.log('User left:', data.id);
          this._trigger('userLeft', data);
        });
        
        this.socket.on('message', (data) => {
          this.log('Message received:', data);
          this._trigger('message', data);
        });
        
        this.socket.on('position', (data) => {
          if (this.peers.has(data.id)) {
            const peer = this.peers.get(data.id);
            peer.x = data.x;
            peer.y = data.y;
            this.peers.set(data.id, peer);
          } else {
            this.peers.set(data.id, { id: data.id, x: data.x, y: data.y });
          }
          this._trigger('position', data);
        });
      } catch (error) {
        this.log('Connection error:', error);
        this._trigger('error', error);
        reject(error);
      }
    });
  }
  
  /**
   * Send a message to all connected clients with rate limiting
   * @param {string|Object} content Message content
   * @returns {boolean} Success status
   */
  sendMessage(content) {
    if (!this.connected) {
      this.log('Cannot send message: not connected');
      return false;
    }
    
    // Rate limit messages
    const now = Date.now();
    if (now - this.lastMessageReset > 1000) {
      this.messageCount = 0;
      this.lastMessageReset = now;
    }
    
    if (this.messageCount >= this.options.messageLimitPerSecond) {
      this.log(`Message rate limit reached (${this.options.messageLimitPerSecond}/sec)`);
      return false;
    }
    
    this.messageCount++;
    this.socket.emit('message', { content });
    return true;
  }
  
  /**
   * Send position update with throttling
   * @param {number} x X-coordinate
   * @param {number} y Y-coordinate
   * @returns {boolean} Success status
   */
  sendPosition(x, y) {
    if (!this.connected) {
      return false;
    }
    
    const now = Date.now();
    if (now - this.lastPositionUpdate < this.options.positionUpdateInterval) {
      return false; // Too soon for another update
    }
    
    this.lastPositionUpdate = now;
    this.socket.emit('position', { x, y });
    return true;
  }
  
  /**
   * Register event handler
   * @param {string} event Event name
   * @param {Function} callback Callback function
   * @returns {Function} Function to remove the handler
   */
  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    
    this.handlers[event].push(callback);
    
    return () => {
      this.off(event, callback);
    };
  }
  
  /**
   * Remove event handler
   * @param {string} event Event name
   * @param {Function} callback Callback function to remove
   */
  off(event, callback) {
    if (!this.handlers[event]) return;
    
    const index = this.handlers[event].indexOf(callback);
    if (index !== -1) {
      this.handlers[event].splice(index, 1);
    }
  }
  
  /**
   * Trigger event handlers
   * @private
   * @param {string} event Event name
   * @param {*} data Event data
   */
  _trigger(event, data) {
    if (!this.handlers[event]) return;
    
    for (const handler of this.handlers[event]) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    }
  }
  
  /**
   * Log message if debug is enabled
   * @private
   */
  log(...args) {
    if (this.options.debug) {
      console.log('[NetcodeSDK]', ...args);
    }
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
  
  /**
   * Reconnect with exponential backoff
   * @private
   */
  _attemptReconnect() {
    if (this.retryCount >= this.options.maxRetries) {
      this.log(`Maximum retry attempts (${this.options.maxRetries}) reached`);
      this._trigger('error', new Error('Maximum retry attempts reached'));
      return;
    }
    
    const delay = this.options.retryDelay * Math.pow(2, this.retryCount);
    this.log(`Attempting reconnection in ${delay}ms (attempt ${this.retryCount + 1}/${this.options.maxRetries})`);
    
    setTimeout(() => {
      this.retryCount++;
      this.connect().catch(() => {
        this._attemptReconnect();
      });
    }, delay);
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.NetcodeSDK = NetcodeSDK;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetcodeSDK;
}
