/**
 * PRX Configuration for GitHub Pages
 * Configure proxy settings for different environments
 */

module.exports = {
  // Development environment configuration
  development: {
    port: 3000,
    targetOrigin: 'http://localhost:8000',
    pathRewrite: {
      '^/api/': '/',
      '^/content/': '/api/content/'
    },
    cacheEnabled: true,
    cacheTTL: 60, // 1 minute for development
    authEnabled: false,
    corsHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  
  // Production environment configuration
  production: {
    port: process.env.PORT || 3000,
    targetOrigin: process.env.TARGET_ORIGIN || 'https://api.example.com',
    pathRewrite: {
      '^/api/': '/',
      '^/content/': '/api/content/'
    },
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes for production
    authEnabled: true,
    corsHeaders: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  
  // Test environment configuration
  test: {
    port: 3001,
    targetOrigin: 'http://localhost:8001',
    pathRewrite: {
      '^/api/': '/test-api/'
    },
    cacheEnabled: false,
    authEnabled: false,
    corsHeaders: {
      'Access-Control-Allow-Origin': '*'
    }
  }
};
