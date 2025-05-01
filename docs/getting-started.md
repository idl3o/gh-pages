# Getting Started

This guide will help you get started with the Web3 Streaming Platform, covering the initial setup, authentication, and basic operations.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+) and npm/yarn
- **Ruby 2.7** (for Jekyll site development)
- **Git** for version control
- A modern web browser (Chrome, Firefox, Edge, or Safari)

Optional tools for specific components:

- **Solidity** (for smart contract development)
- **Emscripten** (for WebAssembly development)
- **.NET SDK** (for .NET client development)

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/gh-pages.git
cd gh-pages
```

### Install Dependencies

1. **Ruby Dependencies**:

   ```bash
   bundle install
   ```

2. **Node.js Dependencies**:

   ```bash
   npm install
   ```

3. **TypeScript SDK Dependencies**:

   ```bash
   cd ts
   npm install
   cd ..
   ```

4. **Serverless Function Dependencies**:
   ```bash
   cd netlify/functions
   npm install
   cd ../..
   ```

## Configuration

### Environment Setup

Create a `.env` file in the root directory:

```
# API Keys
API_KEY=your-api-key

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# IPFS Configuration
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### Jekyll Configuration

Edit `_config.yml` to configure your Jekyll site:

```yaml
# Site settings
title: Your Web3 Streaming Site
description: Decentralized content streaming platform
baseurl: ''
url: 'https://yourusername.github.io'

# Build settings
markdown: kramdown
theme: minima
plugins:
  - jekyll-feed
  - jekyll-seo-tag
```

## Running Locally

### Start the Jekyll Site

```bash
npm run start
```

Or use the VS Code task "Start Jekyll (Ruby 2.7)".

This will make the site available at http://localhost:4000.

### Run Serverless Functions Locally

```bash
cd netlify
netlify dev
```

This will start the serverless functions at http://localhost:8888/.netlify/functions/.

## Basic Usage

### Connecting to a Blockchain Wallet

```javascript
import { PRXBlockchainClient } from '@web3streaming/sdk';

const client = new PRXBlockchainClient({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Connect to wallet
await client.connect();
const account = client.getCurrentAccount();
console.log(`Connected to wallet: ${account}`);
```

### Accessing Content

```javascript
// Get content by ID
const content = await client.getContent('content-id-123');

// Stream content
const streamUrl = await client.getStreamUrl('content-id-123', {
  quality: 'high',
  format: 'mp4'
});

// Play the stream (example using HTML5 video)
const videoElement = document.getElementById('video-player');
videoElement.src = streamUrl;
videoElement.play();
```

### Creating Content

```javascript
// Upload content
const result = await client.uploadContent({
  title: 'My Web3 Video',
  description: 'A video about Web3 technologies',
  file: fileObject, // From file input
  tags: ['web3', 'blockchain', 'tutorial'],
  access: 'public' // or 'token-gated'
});

console.log(`Content uploaded with ID: ${result.contentId}`);
```

## Next Steps

Once you have the basic setup working, you can explore these advanced topics:

- [Smart Contract Integration](./contract-integration.md)
- [Token-Gated Content](./token-gated-content.md)
- [IPFS Storage Configuration](./ipfs-configuration.md)
- [WebAssembly Processing](./wasm-processing.md)
- [Monetization Options](./monetization.md)

## Troubleshooting

### Common Issues

**Jekyll Build Errors**:

- Ensure Ruby 2.7 is installed and in your PATH
- Run `bundle update` to update dependencies
- Check for syntax errors in your Markdown files

**Web3 Connection Issues**:

- Confirm your wallet (MetaMask, etc.) is installed and unlocked
- Verify you're connected to the correct network
- Check browser console for specific error messages

**IPFS Content Not Loading**:

- Check your IPFS gateway configuration
- Ensure content is properly pinned
- Try an alternative gateway if one is unresponsive

### Getting Help

If you encounter issues not covered here:

- Check our [FAQ](./faq.md)
- Review [GitHub Issues](https://github.com/yourusername/gh-pages/issues)
- Join our [Discord community](https://discord.gg/web3streaming)
- Email [support@example.com](mailto:support@example.com)
