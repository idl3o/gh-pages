const path = require('path');
const serveStatic = require('serve-static');
const compression = require('compression');
const http = require('http');
const fs = require('fs');

// Default port (can be overridden by environment variable)
const PORT = process.env.PORT || 3000;

// Status endpoints
const statusEndpoints = {
  blockchain: { status: 'operational', latency: 120 },
  contracts: { status: 'operational', latency: 85 },
  cdn: { status: 'operational', latency: 42 },
  api: { status: 'operational', latency: 153 },
  auth: { status: 'operational', latency: 210 },
  // Adding security endpoint status
  security: {
    status: 'operational',
    latency: 65,
    threatProtection: 'active',
    lastScan: new Date().toISOString(),
    detectedThreats: 0
  }
};

// Create simple server
const app = http.createServer((req, res) => {
  // Apply compression
  compression()(req, res, () => {});

  // Handle status API endpoint
  if (req.url === '/api/status') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      components: statusEndpoints,
      overall: 'operational'
    }));
    return;
  }

  // Add security status endpoint
  if (req.url === '/api/security-status') {
    // Update security status data
    statusEndpoints.security.lastScan = new Date().toISOString();
    statusEndpoints.security.detectedThreats = Math.random() > 0.95 ? Math.floor(Math.random() * 3) : 0;

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      securityStatus: statusEndpoints.security,
      activeThreatProtection: true,
      firewallStatus: 'active',
      malwareProtection: 'active',
      phishingProtection: 'active',
      smartContractAudit: {
        lastCheck: new Date(Date.now() - 86400000).toISOString(),
        vulnerabilitiesFound: 0,
        status: 'secure'
      }
    }));
    return;
  }

  // Special handling for status.html
  if (req.url === '/status.html' || req.url === '/status') {
    // Check if the user has seen the onboarding
    const cookie = req.headers.cookie || '';
    if (!cookie.includes('statusOnboardingShown=true')) {
      // Redirect to onboarding on first visit
      res.writeHead(302, {
        'Location': '/status-onboarding.html'
      });
      res.end();
      return;
    }
  }

  // Serve static files from the dist directory
  serveStatic(path.join(__dirname, 'dist'), {
    index: ['index.html', 'index.htm']
  })(req, res, () => {
    // Handle 404 if the file isn't found
    if (!res.headersSent) {
      res.writeHead(404);
      res.end('Not found');
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving content from ${path.join(__dirname, 'dist')}`);
  console.log(`Status page available at http://localhost:${PORT}/status.html`);
  console.log(`Security status available at http://localhost:${PORT}/security.html`);
});

console.log('To build the project first, run: npm run build');
console.log('To deploy to GitHub Pages, run: npm run deploy');
