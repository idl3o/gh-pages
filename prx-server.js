/**
 * PRX Server for GitHub Pages
 * Implements a proxy server that can run alongside GitHub Pages
 */

const http = require('http');
const https = require('https');
const url = require('url');
const tokenModel = require('./models/token-model');

// Default configuration
const DEFAULT_PORT = process.env.PRX_PORT || 3000;
const DEFAULT_TARGET = process.env.PRX_TARGET || 'https://api.example.com';

/**
 * Start the PRX server
 * @param {Object} config - Server configuration
 * @returns {Object} HTTP server instance
 */
function startPrxServer(config = {}) {
  // Configure the proxy via token model
  tokenModel.configurePrx({
    enabled: true,
    port: config.port || DEFAULT_PORT,
    targetOrigin: config.targetOrigin || DEFAULT_TARGET,
    pathRewrite: config.pathRewrite || { '^/api/': '/' },
    cacheEnabled: config.cacheEnabled !== false,
    authEnabled: config.authEnabled === true
  });

  // Create HTTP server
  const server = http.createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = url.parse(req.url, true);
      
      // Collect request body if present
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      });
      
      // Process the request once all data is received
      req.on('end', async () => {
        try {
          // Convert body to string if there was data
          if (body.length > 0) {
            body = Buffer.concat(body).toString();
            try {
              // Try to parse as JSON
              body = JSON.parse(body);
            } catch (e) {
              // Leave as string if not JSON
            }
          } else {
            body = undefined;
          }
          
          // Prepare request object for token model
          const request = {
            path: parsedUrl.pathname,
            query: parsedUrl.query,
            method: req.method,
            headers: req.headers,
            body
          };
          
          // Handle the proxy request
          const response = await tokenModel.handlePrxRequest(request);
          
          // Set response status code
          res.statusCode = response.status || 200;
          
          // Set response headers
          if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
              res.setHeader(key, value);
            }
          }
          
          // Add CORS headers
          for (const [key, value] of Object.entries(tokenModel.prxConfig.corsHeaders)) {
            res.setHeader(key, value);
          }
          
          // Send the response
          if (response.data) {
            if (typeof response.data === 'object') {
              res.end(JSON.stringify(response.data));
            } else {
              res.end(response.data);
            }
          } else {
            res.end();
          }
        } catch (error) {
          console.error('Error handling request:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message
          }));
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  
  // Start server
  const port = tokenModel.prxConfig.port;
  server.listen(port, () => {
    console.log(`PRX server running on port ${port}`);
    console.log(`Proxying requests to ${tokenModel.prxConfig.targetOrigin}`);
  });
  
  // Handle server errors
  server.on('error', (err) => {
    console.error('PRX server error:', err);
  });
  
  return server;
}

// Export the function to start the server
module.exports = { startPrxServer };

// Auto-start if this is the main module
if (require.main === module) {
  startPrxServer();
}
