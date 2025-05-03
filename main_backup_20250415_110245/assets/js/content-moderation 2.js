/**
 * Content Moderation System
 * Web3 Crypto Streaming Service
 * 
 * Uses deterministic hashing with secure keys to filter sensitive content
 * without sending data to external services
 */

class ContentModerationService {
  constructor() {
    this.initialized = false;
    this.moderationKey = "qah6uedmaxredactk8o";
    this.sensitivePatterns = null;
    this.moderationLevel = 'standard';
    this.moderationStats = {
      processed: 0,
      flagged: 0,
      redacted: 0
    };
  }
  
  /**
   * Initialize the moderation system
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} - Whether initialization succeeded
   */
  async initialize(options = {}) {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing content moderation system...");
      
      // Set configuration options
      this.moderationLevel = options.level || 'standard';
      
      // Generate patterns based on the moderation key
      await this.generatePatterns();
      
      this.initialized = true;
      console.log(`Content moderation initialized at ${this.moderationLevel} level`);
      
      return true;
    } catch (error) {
      console.error("Failed to initialize moderation system:", error);
      return false;
    }
  }
  
  /**
   * Generate detection patterns from the moderation key
   * @private
   */
  async generatePatterns() {
    // In a real implementation, these would be more sophisticated patterns
    // derived cryptographically from the moderation key
    
    // Create a simple hash from the key
    const keyHash = await this.simpleHash(this.moderationKey);
    
    // Use different segments of the key hash to create patterns
    this.sensitivePatterns = {
      // PII detection (simplified)
      pii: [
        /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, // SSN patterns
        /\b\d{16}\b/g,                     // Credit card numbers (simplified)
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi // Email addresses
      ],
      
      // Blockchain security risks
      blockchain: [
        /\b0x[a-fA-F0-9]{40}\b/g, // Ethereum addresses
        /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/g, // Private key patterns (simplified)
        new RegExp(`${keyHash.substring(0, 8)}[a-zA-Z0-9]{8,32}`, 'g') // Custom pattern based on key
      ],
      
      // Moderately sensitive terms
      moderate: [
        /\b(password|pwd|secret|key|mnemonic|seed)\b/gi
      ]
    };
  }
  
  /**
   * Process and moderate content
   * @param {string} content - Content to moderate
   * @param {Object} options - Moderation options
   * @returns {Object} - Moderated content and metadata
   */
  async moderateContent(content, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.moderationStats.processed++;
    
    // Default options
    const settings = {
      mode: options.mode || 'redact', // redact, flag, block
      context: options.context || 'general',
      preserveLength: options.preserveLength !== false
    };
    
    // Skip moderation for trusted content or in specific contexts
    if (options.trusted || options.skipModeration) {
      return {
        originalContent: content,
        modifiedContent: content,
        moderated: false,
        metadata: { action: 'skipped' }
      };
    }
    
    let modifiedContent = content;
    let sensitiveMaterial = false;
    let detections = [];
    
    // Apply patterns based on moderation level
    const patternCategories = Object.keys(this.sensitivePatterns);
    
    for (const category of patternCategories) {
      // Skip certain categories based on moderation level
      if (this.moderationLevel === 'low' && category !== 'blockchain') {
        continue;
      }
      
      const patterns = this.sensitivePatterns[category];
      
      for (const pattern of patterns) {
        // Reset lastIndex for regex reuse
        if (pattern instanceof RegExp) {
          pattern.lastIndex = 0;
        }
        
        const matches = modifiedContent.match(pattern);
        if (matches) {
          sensitiveMaterial = true;
          
          detections.push({
            category,
            matches: matches.length,
            severity: this.getSeverity(category)
          });
          
          if (settings.mode === 'redact') {
            // Replace with censored content
            modifiedContent = modifiedContent.replace(pattern, match => {
              this.moderationStats.redacted++;
              if (settings.preserveLength) {
                return '█'.repeat(match.length);
              } else {
                return '[REDACTED]';
              }
            });
          }
        }
      }
    }
    
    if (sensitiveMaterial) {
      this.moderationStats.flagged++;
    }
    
    // Generate a verifiable hash of the moderation result
    const resultHash = await this.simpleHash(modifiedContent + this.moderationKey);
    
    return {
      originalContent: content,
      modifiedContent: modifiedContent,
      moderated: sensitiveMaterial,
      metadata: {
        action: sensitiveMaterial ? settings.mode : 'none',
        categories: detections.map(d => d.category),
        severity: this.getHighestSeverity(detections),
        verificationHash: resultHash.substring(0, 12)
      }
    };
  }
  
  /**
   * Get severity level for a specific category
   * @param {string} category - Category name
   * @returns {string} - Severity level
   * @private
   */
  getSeverity(category) {
    const severityMap = {
      'pii': 'high',
      'blockchain': 'critical',
      'moderate': 'medium'
    };
    
    return severityMap[category] || 'low';
  }
  
  /**
   * Get highest severity from a list of detections
   * @param {Array} detections - List of detections
   * @returns {string} - Highest severity
   * @private
   */
  getHighestSeverity(detections) {
    const severityLevels = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    let highestLevel = 'none';
    let highestScore = 0;
    
    for (const detection of detections) {
      const score = severityLevels[detection.severity] || 0;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = detection.severity;
      }
    }
    
    return highestLevel;
  }
  
  /**
   * Get moderation statistics
   * @returns {Object} - Current moderation stats
   */
  getStatistics() {
    return { ...this.moderationStats };
  }
  
  /**
   * Change the moderation level
   * @param {string} level - New level (low, standard, high, strict)
   */
  setModerationLevel(level) {
    const validLevels = ['low', 'standard', 'high', 'strict'];
    
    if (validLevels.includes(level)) {
      this.moderationLevel = level;
      console.log(`Content moderation level set to: ${level}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Simple hashing function for demonstration purposes
   * @param {string} input - String to hash
   * @returns {Promise<string>} - Hashed string
   * @private
   */
  async simpleHash(input) {
    // In a real implementation, use a proper crypto hash function
    // This is a placeholder implementation
    
    let hash = 0;
    const str = input + this.moderationKey;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string
    const hashHex = (hash >>> 0).toString(16);
    return hashHex.padStart(8, '0');
  }
}

// Create global singleton instance
window.contentModerator = new ContentModerationService();
