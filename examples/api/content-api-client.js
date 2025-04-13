/**
 * Content API Client
 * 
 * A client for interacting with the Web3 Crypto Streaming Service API
 * Handles content discovery, metadata, and access verification
 */

class ContentApiClient {
  /**
   * Create a new Content API Client instance
   * @param {Object} config - Configuration options
   * @param {string} config.apiBaseUrl - Base URL for API endpoints
   * @param {string} config.apiKey - API key for authentication (optional)
   * @param {number} config.timeout - Request timeout in milliseconds
   */
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || 'https://api.web3streaming.example/v1';
    this.apiKey = config.apiKey || null;
    this.timeout = config.timeout || 10000; // 10 seconds default timeout
    this.authToken = null;
  }
  
  /**
   * Set authentication token for subsequent requests
   * @param {string} token - JWT token for authentication
   */
  setAuthToken(token) {
    this.authToken = token;
  }
  
  /**
   * Get common headers for API requests
   * @private
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }
  
  /**
   * Handle API response and error cases
   * @private
   * @param {Response} response - Fetch API response
   * @returns {Promise<Object>} Parsed response data
   * @throws {Error} API error with details
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      // Create a detailed error with API response info
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = data;
      throw error;
    }
    
    return data;
  }
  
  /**
   * Make an API request
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const fetchOptions = {
      headers: this.getHeaders(),
      timeout: this.timeout,
      ...options
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      return this.handleResponse(response);
    } catch (error) {
      // Handle network errors or timeout
      if (!error.status) {
        error.message = `Network error: ${error.message}`;
      }
      throw error;
    }
  }
  
  /**
   * Get content catalog with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.category - Filter by category
   * @param {string} params.creator - Filter by creator address
   * @param {string} params.query - Search query
   * @param {number} params.limit - Result limit
   * @param {number} params.offset - Pagination offset
   * @returns {Promise<Object>} Content catalog
   */
  async getCatalog(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.creator) queryParams.append('creator', params.creator);
    if (params.query) queryParams.append('q', params.query);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/content${queryString}`);
  }
  
  /**
   * Get content item details by ID
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Content details
   */
  async getContentById(contentId) {
    return this.request(`/content/${contentId}`);
  }
  
  /**
   * Verify user access to content
   * @param {string} contentId - Content ID
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Access verification result
   */
  async verifyAccess(contentId, userAddress) {
    return this.request(`/access/verify`, {
      method: 'POST',
      body: JSON.stringify({
        contentId,
        userAddress
      })
    });
  }
  
  /**
   * Get playback information for content
   * @param {string} contentId - Content ID
   * @param {string} resolution - Requested resolution (optional)
   * @returns {Promise<Object>} Playback information
   */
  async getPlaybackInfo(contentId, resolution = null) {
    const queryParams = resolution ? `?resolution=${resolution}` : '';
    return this.request(`/content/${contentId}/playback${queryParams}`);
  }
  
  /**
   * Record content view event
   * @param {string} contentId - Content ID
   * @param {Object} viewData - View analytics data
   * @returns {Promise<Object>} View recording result
   */
  async recordView(contentId, viewData = {}) {
    return this.request(`/content/${contentId}/view`, {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...viewData
      })
    });
  }
  
  /**
   * Get creator profile by address
   * @param {string} address - Creator's wallet address
   * @returns {Promise<Object>} Creator profile
   */
  async getCreatorProfile(address) {
    return this.request(`/creators/${address}`);
  }
  
  /**
   * Get content recommendations for user
   * @param {string} userAddress - User's wallet address
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Object>} Content recommendations
   */
  async getRecommendations(userAddress, limit = 10) {
    return this.request(`/recommendations?user=${userAddress}&limit=${limit}`);
  }
  
  /**
   * Get trending content
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Time range (day, week, month)
   * @param {string} params.category - Optional category filter
   * @param {number} params.limit - Result limit
   * @returns {Promise<Object>} Trending content list
   */
  async getTrending(params = {}) {
    const queryParams = new URLSearchParams();
    
    queryParams.append('timeframe', params.timeframe || 'week');
    if (params.category) queryParams.append('category', params.category);
    queryParams.append('limit', (params.limit || 20).toString());
    
    return this.request(`/content/trending?${queryParams.toString()}`);
  }
}

// Example usage
async function demoApiUsage() {
  // Initialize the client
  const client = new ContentApiClient({
    apiBaseUrl: 'https://api.web3streaming.example/v1',
    apiKey: 'your-api-key-here'
  });
  
  try {
    // Get latest content
    const latestContent = await client.getCatalog({
      limit: 5,
      offset: 0
    });
    console.log('Latest content:', latestContent);
    
    // Get content details
    const contentId = 'abc123';
    const contentDetails = await client.getContentById(contentId);
    console.log('Content details:', contentDetails);
    
    // Verify access (requires authentication)
    client.setAuthToken('user-jwt-token-here');
    const accessResult = await client.verifyAccess(contentId, '0x1234567890abcdef');
    
    if (accessResult.hasAccess) {
      // Get playback info
      const playbackInfo = await client.getPlaybackInfo(contentId, '1080p');
      console.log('Playback URL:', playbackInfo.url);
      
      // Record view analytics
      await client.recordView(contentId, {
        playerType: 'web',
        duration: 120,
        completionRate: 0.75
      });
    }
  } catch (error) {
    console.error('API error:', error);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentApiClient;
}