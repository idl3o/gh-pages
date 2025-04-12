/**
 * API Rate Limiting Middleware
 * 
 * Implements rate limiting to protect against abuse and DoS attacks
 * Uses an in-memory store for demo purposes, but should use Redis or similar in production
 */

// Simple in-memory store for rate limiting
const rateLimitStore = new Map();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limiting middleware
 * 
 * @param {Object} options Rate limiting options
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.maxRequests Maximum number of requests allowed in the window
 * @param {Function} options.keyGenerator Function to generate a unique key for the request
 * @returns {Function} Express middleware function
 */
function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute by default
    maxRequests = 60, // 60 requests per minute by default
    keyGenerator = (req) => {
      // Default key is IP address
      return req.ip || req.connection.remoteAddress;
    },
    handler = (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    }
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let data = rateLimitStore.get(key);
    
    // If no existing data or window has expired
    if (!data || data.resetTime < now) {
      data = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, data);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));
      
      return next();
    }
    
    // Increment request count
    data.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));
    
    // Check if rate limit exceeded
    if (data.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
      return handler(req, res);
    }
    
    next();
  };
}

/**
 * Export rate limiting configurations for different endpoints
 */
module.exports = {
  // General API rate limiting
  standardLimiter: rateLimit({
    windowMs: 60000,
    maxRequests: 120
  }),
  
  // More restrictive for authentication routes
  authLimiter: rateLimit({
    windowMs: 60000,
    maxRequests: 20,
    keyGenerator: (req) => {
      // Use IP and username/wallet address
      const identifier = req.body.email || req.body.walletAddress || '';
      return `${req.ip}-${identifier}`;
    }
  }),
  
  // Very restrictive for sensitive operations
  sensitiveOpLimiter: rateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10
  }),
  
  // Custom rate limiter generator
  rateLimit
};