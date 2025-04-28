/**
 * Model Context Protocol Server
 * Handles communication between AI models and the codebase
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mcpConfig = require('./mcp.config');

class MCPServer {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.port = process.env.MCP_PORT || 3030;
    this.initializeMiddleware();
    this.setupRoutes();
    this.contextCache = {};
  }

  initializeMiddleware() {
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', version: this.config.version });
    });

    // MCP configuration endpoint
    this.app.get('/config', (req, res) => {
      res.json(this.config);
    });

    // Context information endpoint
    this.app.get('/context/:domainName', (req, res) => {
      const domain = req.params.domainName;
      const knowledgeDomain = this.config.knowledgeDomains.find(d => d.name === domain);

      if (!knowledgeDomain) {
        return res.status(404).json({ error: `Domain ${domain} not found` });
      }

      // Return cached context if available
      if (this.contextCache[domain]) {
        return res.json(this.contextCache[domain]);
      }

      // Build context from relevant files
      const context = this.buildContextForDomain(knowledgeDomain);
      this.contextCache[domain] = context;

      res.json(context);
    });

    // File content endpoint
    this.app.get('/file', (req, res) => {
      const filePath = req.query.path;

      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const absolutePath = path.join(__dirname, filePath);

      // Check if file is in excluded paths
      const isExcluded = this.config.contextBoundaries.excludedPaths.some(pattern => {
        return this.matchGlobPattern(filePath, pattern);
      });

      if (isExcluded) {
        return res.status(403).json({ error: 'Access to this path is restricted' });
      }

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      try {
        const content = fs.readFileSync(absolutePath, 'utf8');
        res.json({ path: filePath, content });
      } catch (error) {
        res.status(500).json({ error: `Failed to read file: ${error.message}` });
      }
    });

    // Model query endpoint
    this.app.post('/query', async (req, res) => {
      const { query, domainContext, fileContext } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      try {
        // Process the query based on provided context
        const response = await this.processModelQuery(query, domainContext, fileContext);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: `Query processing failed: ${error.message}` });
      }
    });
  }

  async processModelQuery(query, domainContext, fileContext) {
    // In a real implementation, this would process the query using relevant context
    // and potentially call an LLM API

    return {
      query,
      responseType: 'text',
      content: `Processed query in domains: ${domainContext?.join(', ') || 'none'}`,
      timestamp: new Date().toISOString()
    };
  }

  buildContextForDomain(knowledgeDomain) {
    const context = {
      name: knowledgeDomain.name,
      description: knowledgeDomain.description,
      files: []
    };

    // In a full implementation, this would traverse the file system
    // based on relevantPaths and build a context map

    return context;
  }

  matchGlobPattern(filePath, pattern) {
    // Simple glob pattern matching (would use a proper glob library in production)
    if (pattern.endsWith('/**')) {
      const base = pattern.slice(0, -3);
      return filePath.startsWith(base);
    }

    if (pattern.startsWith('**/')) {
      const suffix = pattern.slice(3);
      return filePath.endsWith(suffix);
    }

    return filePath === pattern;
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`MCP Server started on port ${this.port}`);
    });
    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// Create and start the server if this file is executed directly
if (require.main === module) {
  const server = new MCPServer(mcpConfig);
  server.start();
}

module.exports = MCPServer;
