/**
 * Model Context Protocol Configuration
 * This file defines how AI models should interpret and interact with the codebase
 */

module.exports = {
  version: '1.0.0',
  projectName: 'StreamChain Web3 Platform',
  description: 'A decentralized Web3 streaming platform with blockchain integration',

  // Define context boundaries for AI models
  contextBoundaries: {
    maxContextSize: 8192,
    priorityFiles: [
      'README.md',
      'red_x/sxs-core/nlp-handler.js',
      'red_x/sxs-core/conversation-manager.js',
      'assets/js/poebc-controller.js',
      'config/layer2-config.js'
    ],
    excludedPaths: ['node_modules/**', '.git/**', 'backup_*/**', 'main_backup_*/**']
  },

  // Knowledge domains that AI models should be aware of
  knowledgeDomains: [
    {
      name: 'blockchain',
      description: 'Blockchain integration and smart contract management',
      relevantPaths: ['contracts/**', 'cli/commands/blockchain.js', 'red_x/js/blockchain/**']
    },
    {
      name: 'conversational-ai',
      description: 'NLP and conversation management systems',
      relevantPaths: ['red_x/sxs-core/**']
    },
    {
      name: 'emergency-protocol',
      description: 'Protocol for On-chain Emergency Blockchain Control (POEBC)',
      relevantPaths: ['assets/js/poebc-controller.js', 'docs/poebc-simulator.md']
    },
    {
      name: 'content-management',
      description: 'Content and documentation management systems',
      relevantPaths: ['cli/commands/content.js', 'assets/js/content-studio.js']
    }
  ],

  // Model interaction preferences
  modelInteraction: {
    preferredResponseFormat: 'markdown',
    codeBlockLanguagePreference: 'javascript',
    includeLineNumbers: true,
    maxCodeBlockSize: 100,
    contextMaintenance: 'conversational'
  },

  // Schema definitions for key data structures
  schemaDefinitions: {
    blockchainConfig: {
      type: 'object',
      properties: {
        networks: { type: 'array' },
        contracts: { type: 'object' },
        deployments: { type: 'object' }
      }
    },
    poebcController: {
      type: 'object',
      properties: {
        activationState: { type: 'string' },
        authLevel: { type: 'number' },
        recoveryOptions: { type: 'array' }
      }
    },
    conversationManager: {
      type: 'object',
      properties: {
        conversationHistory: { type: 'array' },
        currentContext: { type: 'object' },
        followUpPatterns: { type: 'object' }
      }
    }
  }
};
