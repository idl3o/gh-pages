---
layout: default
title: Integration Services Documentation
---

# Integration Services Documentation

This documentation covers our integration services which connect various components of the platform, including blockchain data services, email services, HLS streaming services, and IPFS decentralized storage.

## Overview

Our integration services act as bridges between different components of the platform, ensuring seamless communication and data flow between the blockchain, web services, storage systems, and communication channels.

## Key Services

### Blockchain Data Service

The Blockchain Data Service provides real-time access to blockchain data, including token balances, transaction history, and payment stream status.

```javascript
// BlockchainDataService.js
class BlockchainDataService {
  constructor(provider, contracts = {}) {
    this.provider = provider;
    this.contracts = contracts;
    this.ethers = require('ethers');
  }

  async getTokenBalance(address, tokenAddress) {
    const tokenContract = new this.ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    return tokenContract.balanceOf(address);
  }

  async getPaymentStreamDetails(streamId) {
    if (!this.contracts.paymentStream) {
      throw new Error('Payment stream contract not initialized');
    }
    
    return this.contracts.paymentStream.getStream(streamId);
  }

  async getTransactionHistory(address, options = {}) {
    const { startBlock = 0, endBlock = 'latest', limit = 10 } = options;
    
    const history = await this.provider.getHistory(address, startBlock, endBlock);
    return history.slice(0, limit);
  }
}

module.exports = BlockchainDataService;
```

#### Usage Example

```javascript
const { ethers } = require('ethers');
const BlockchainDataService = require('./services/BlockchainDataService');
const PaymentStreamABI = require('./abis/PaymentStream.json');

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-project-id');

// Initialize contracts
const paymentStreamContract = new ethers.Contract(
  '0xPaymentStreamContractAddress',
  PaymentStreamABI,
  provider
);

// Initialize service
const blockchainService = new BlockchainDataService(provider, {
  paymentStream: paymentStreamContract
});

// Get token balance
async function getUserTokenBalance(userAddress, tokenAddress) {
  try {
    const balance = await blockchainService.getTokenBalance(userAddress, tokenAddress);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} tokens`);
    return balance;
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    throw error;
  }
}
```

### Email Service

The Email Service handles transactional emails, notifications, and marketing communications.

```javascript
// emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class EmailService {
  constructor(config) {
    this.transporter = nodemailer.createTransport(config.transportOptions);
    this.defaultFrom = config.defaultFrom;
    this.templateDir = config.templateDir || path.join(__dirname, '../email-templates');
  }

  async loadTemplate(templateName, data) {
    const templatePath = path.join(this.templateDir, `${templateName}.html`);
    const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(data);
  }

  async sendEmail(options) {
    const { to, subject, templateName, data, from = this.defaultFrom } = options;
    
    let html;
    
    if (templateName) {
      html = await this.loadTemplate(templateName, data);
    } else if (options.html) {
      html = options.html;
    } else {
      throw new Error('Either templateName or html must be provided');
    }
    
    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: options.text || this.htmlToText(html)
    };
    
    return this.transporter.sendMail(mailOptions);
  }
  
  htmlToText(html) {
    // Simple HTML to text conversion
    return html.replace(/<[^>]*>/g, '');
  }
  
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to our platform!',
      templateName: 'welcome',
      data: {
        username: user.username,
        verificationLink: `https://example.com/verify?token=${user.verificationToken}`
      }
    });
  }
  
  async sendPaymentConfirmation(user, payment) {
    return this.sendEmail({
      to: user.email,
      subject: 'Payment Confirmation',
      templateName: 'payment-confirmation',
      data: {
        username: user.username,
        amount: payment.amount,
        date: payment.date,
        transactionId: payment.transactionId
      }
    });
  }
}

module.exports = EmailService;
```

#### Usage Example

```javascript
const EmailService = require('./services/emailService');

const emailService = new EmailService({
  transportOptions: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  },
  defaultFrom: '"Platform" <noreply@example.com>'
});

// Send a welcome email
async function sendUserWelcome(user) {
  try {
    const result = await emailService.sendWelcomeEmail(user);
    console.log('Welcome email sent:', result.messageId);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
```

### HLS Streaming Service

The HLS (HTTP Live Streaming) Service manages adaptive bitrate streaming for media content.

```javascript
// HLSService.js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

class HLSService {
  constructor(config) {
    this.outputDir = config.outputDir;
    this.segmentLength = config.segmentLength || 10; // seconds
    this.qualities = config.qualities || [
      { name: '720p', resolution: '1280x720', bitrate: '2500k' },
      { name: '480p', resolution: '854x480', bitrate: '1000k' },
      { name: '360p', resolution: '640x360', bitrate: '500k' }
    ];
  }

  async createHLSStream(videoPath, outputName) {
    // Create output directory
    const streamDir = path.join(this.outputDir, outputName);
    await fs.promises.mkdir(streamDir, { recursive: true });
    
    // Create master playlist
    let masterPlaylist = '#EXTM3U\n';
    
    // Process each quality variant
    const transcodePromises = this.qualities.map(async (quality) => {
      const qualityDir = path.join(streamDir, quality.name);
      await fs.promises.mkdir(qualityDir, { recursive: true });
      
      const playlistPath = path.join(qualityDir, 'playlist.m3u8');
      const segmentPattern = path.join(qualityDir, 'segment%d.ts');
      
      // Add to master playlist
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.resolution}\n`;
      masterPlaylist += `${quality.name}/playlist.m3u8\n`;
      
      // Transcode video
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .outputOptions([
            `-c:v libx264`,
            `-c:a aac`,
            `-b:v ${quality.bitrate}`,
            `-s ${quality.resolution}`,
            `-hls_time ${this.segmentLength}`,
            `-hls_playlist_type vod`,
            `-hls_segment_filename ${segmentPattern}`
          ])
          .output(playlistPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    });
    
    // Wait for all transcoding processes to complete
    await Promise.all(transcodePromises);
    
    // Write master playlist
    const masterPlaylistPath = path.join(streamDir, 'master.m3u8');
    await fs.promises.writeFile(masterPlaylistPath, masterPlaylist);
    
    return {
      masterPlaylist: `/streams/${outputName}/master.m3u8`,
      variants: this.qualities.map(q => ({
        quality: q.name,
        playlist: `/streams/${outputName}/${q.name}/playlist.m3u8`
      }))
    };
  }
  
  async generateThumbnail(videoPath, outputName, time = '00:00:05') {
    const thumbnailDir = path.join(this.outputDir, outputName);
    await fs.promises.mkdir(thumbnailDir, { recursive: true });
    
    const thumbnailPath = path.join(thumbnailDir, 'thumbnail.jpg');
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [time],
          filename: 'thumbnail.jpg',
          folder: thumbnailDir,
          size: '320x180'
        })
        .on('end', () => resolve(`/streams/${outputName}/thumbnail.jpg`))
        .on('error', reject);
    });
  }
}

module.exports = HLSService;
```

#### Usage Example

```javascript
const HLSService = require('./services/HLSService');

const hlsService = new HLSService({
  outputDir: path.join(__dirname, '../public/streams'),
  segmentLength: 6 // 6 seconds per segment
});

// Process a video for streaming
async function processVideoForStreaming(videoPath, streamId) {
  try {
    console.log(`Processing video for streaming: ${streamId}`);
    
    // Generate stream
    const streamDetails = await hlsService.createHLSStream(videoPath, streamId);
    
    // Generate thumbnail
    const thumbnailUrl = await hlsService.generateThumbnail(videoPath, streamId);
    
    // Return stream metadata
    return {
      id: streamId,
      masterPlaylist: streamDetails.masterPlaylist,
      variants: streamDetails.variants,
      thumbnail: thumbnailUrl
    };
  } catch (error) {
    console.error(`Failed to process video for streaming: ${error.message}`);
    throw error;
  }
}
```

### IPFS Service

The IPFS (InterPlanetary File System) Service provides decentralized storage capabilities for content and metadata.

```javascript
// IPFSService.js
const ipfsClient = require('ipfs-http-client');
const fs = require('fs');
const { Buffer } = require('buffer');

class IPFSService {
  constructor(config) {
    this.ipfs = ipfsClient.create(config.ipfsApiUrl);
    this.gateway = config.gateway;
  }

  async uploadFile(filePath) {
    const file = await fs.promises.readFile(filePath);
    return this.uploadBuffer(file);
  }

  async uploadBuffer(buffer) {
    const result = await this.ipfs.add(buffer);
    return {
      cid: result.cid.toString(),
      size: result.size,
      url: `${this.gateway}/ipfs/${result.cid.toString()}`
    };
  }

  async uploadJSON(data) {
    const buffer = Buffer.from(JSON.stringify(data));
    return this.uploadBuffer(buffer);
  }

  async uploadDirectory(directoryPath) {
    const files = await this.getFilesFromDirectory(directoryPath);
    
    const results = [];
    for (const file of files) {
      const content = await fs.promises.readFile(file.path);
      results.push({
        path: file.name,
        content
      });
    }
    
    const result = await this.ipfs.add(results, { wrapWithDirectory: true });
    return {
      cid: result.cid.toString(),
      size: result.size,
      url: `${this.gateway}/ipfs/${result.cid.toString()}`
    };
  }

  async getFilesFromDirectory(directoryPath) {
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    
    const files = entries
      .filter(entry => !entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: path.join(directoryPath, entry.name)
      }));
    
    return files;
  }

  getIPFSUrl(cid) {
    return `${this.gateway}/ipfs/${cid}`;
  }
  
  async pinCID(cid) {
    return this.ipfs.pin.add(cid);
  }
  
  async unpinCID(cid) {
    return this.ipfs.pin.rm(cid);
  }
}

module.exports = IPFSService;
```

#### Usage Example

```javascript
const IPFSService = require('./services/IPFSService');

const ipfsService = new IPFSService({
  ipfsApiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
  gateway: process.env.IPFS_GATEWAY || 'https://gateway.ipfs.io'
});

// Upload content metadata to IPFS
async function uploadContentMetadata(metadata) {
  try {
    console.log('Uploading content metadata to IPFS');
    
    const result = await ipfsService.uploadJSON(metadata);
    
    console.log(`Metadata uploaded to IPFS with CID: ${result.cid}`);
    console.log(`IPFS URL: ${result.url}`);
    
    // Pin the content to ensure persistence
    await ipfsService.pinCID(result.cid);
    
    return result;
  } catch (error) {
    console.error(`Failed to upload metadata to IPFS: ${error.message}`);
    throw error;
  }
}
```

## Service Integration Patterns

Our integration services follow several design patterns to ensure reliability, scalability, and maintainability:

### 1. Dependency Injection

Services are designed with dependency injection to facilitate testing and configuration:

```javascript
// Dependency injection example
function createServices(config) {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  
  // Create contracts
  const paymentStreamContract = new ethers.Contract(
    config.contractAddresses.paymentStream,
    PaymentStreamABI,
    provider
  );
  
  // Create services
  const blockchainService = new BlockchainDataService(provider, {
    paymentStream: paymentStreamContract
  });
  
  const emailService = new EmailService({
    transportOptions: config.email.transportOptions,
    defaultFrom: config.email.defaultFrom
  });
  
  const ipfsService = new IPFSService({
    ipfsApiUrl: config.ipfs.apiUrl,
    gateway: config.ipfs.gateway
  });
  
  return {
    blockchainService,
    emailService,
    ipfsService
  };
}
```

### 2. Event-Driven Architecture

Services communicate through events to ensure loose coupling:

```javascript
// Event-driven example
const EventEmitter = require('events');

class ServiceBus extends EventEmitter {}

const serviceBus = new ServiceBus();

// Subscribe to payment events
serviceBus.on('payment.created', async (payment) => {
  const user = await getUserById(payment.userId);
  await emailService.sendPaymentConfirmation(user, payment);
});

// Subscribe to stream events
serviceBus.on('stream.started', async (stream) => {
  // Update blockchain record
  await blockchainService.recordStreamStart(stream.id);
});

// Emit events
function createPayment(paymentData) {
  // Process payment
  const payment = processPayment(paymentData);
  
  // Emit event
  serviceBus.emit('payment.created', payment);
  
  return payment;
}
```

### 3. Retry Mechanisms

Services implement retry logic for resilience:

```javascript
// Retry mechanism example
async function withRetry(fn, options = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  
  let retries = 0;
  let currentDelay = delay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoff;
    }
  }
}

// Usage
async function getStreamData(streamId) {
  return withRetry(
    () => blockchainService.getPaymentStreamDetails(streamId),
    { maxRetries: 5, delay: 2000 }
  );
}
```

## Configuration

Services are configured through environment variables and configuration files:

```javascript
// config.js
module.exports = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  contractAddresses: {
    paymentStream: process.env.PAYMENT_STREAM_ADDRESS,
    token: process.env.TOKEN_ADDRESS
  },
  email: {
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    defaultFrom: process.env.EMAIL_FROM || '"Platform" <noreply@example.com>'
  },
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'http://localhost:5001',
    gateway: process.env.IPFS_GATEWAY || 'https://gateway.ipfs.io'
  },
  hls: {
    outputDir: process.env.HLS_OUTPUT_DIR || './public/streams',
    segmentLength: parseInt(process.env.HLS_SEGMENT_LENGTH || '10')
  }
};
```

## Next Steps

- [Server Documentation](../server-docs/index.md)
- [Serverless Functions Documentation](../serverless-docs/index.md)
- [Utility Documentation](../utility-docs/index.md)