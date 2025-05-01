---
layout: default
title: TypeScript SDK Documentation
---

# TypeScript SDK Documentation

This documentation covers our TypeScript SDK, which provides strongly typed interfaces for interacting with our platform's APIs and blockchain services.

## Overview

Our TypeScript SDK simplifies integration with our platform by providing a set of tools, utilities, and interfaces that abstract away the complexity of direct API and blockchain interaction.

## Installation

```bash
npm install @project/typescript-sdk
# or
yarn add @project/typescript-sdk
```

## Key Components

### Type Definitions

Our SDK includes comprehensive TypeScript definitions for all API endpoints, responses, and blockchain interactions.

```typescript
// Example type definitions
export interface User {
  id: string;
  username: string;
  walletAddress?: string;
  createdAt: Date;
}

export interface StreamMetadata {
  id: string;
  title: string;
  description?: string;
  creator: string;
  contentHash: string;
  duration: number;
  created: Date;
}

export interface PaymentStream {
  streamId: string;
  sender: string;
  recipient: string;
  tokenAddress: string;
  amountPerSecond: BigNumber;
  startTime: Date;
  endTime?: Date;
  active: boolean;
}
```

### API Integration

The SDK provides typed wrappers around our REST APIs for simplified integration.

```typescript
import { ApiClient } from '@project/typescript-sdk';

const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Get user profile with full type safety
const getProfile = async (userId: string): Promise<User> => {
  return await client.users.getProfile(userId);
};

// Create a new stream
const createStream = async (metadata: StreamMetadata): Promise<string> => {
  return await client.streams.create(metadata);
};
```

### Developer Tools

The SDK includes developer tools to simplify common tasks.

```typescript
import { DevTools } from '@project/typescript-sdk';

// Generate test data
const testUsers = DevTools.generateTestUsers(5);
const testStreams = DevTools.generateTestStreams(10);

// Validate blockchain addresses
const isValidAddress = DevTools.validateEthAddress('0x1234...');

// Format currency values
const formattedAmount = DevTools.formatCurrency('1000000000000000000', 'ETH');
console.log(formattedAmount); // "1.0 ETH"
```

### Web3 Integration

Our SDK provides type-safe wrappers around Web3 functionality for blockchain interactions.

```typescript
import { Web3Service } from '@project/typescript-sdk';

const web3 = new Web3Service({
  provider: 'https://mainnet.infura.io/v3/your-project-id',
  privateKey: 'your-private-key' // Optional
});

// Create a payment stream
const createPaymentStream = async (
  recipient: string,
  tokenAddress: string,
  amountPerSecond: string,
  duration: number
): Promise<string> => {
  const tx = await web3.streams.create({
    recipient,
    tokenAddress,
    amountPerSecond,
    duration
  });
  
  return tx.hash;
};

// Check stream balance
const getStreamBalance = async (streamId: string): Promise<string> => {
  return await web3.streams.getBalance(streamId);
};
```

## Error Handling

The SDK includes standardized error handling:

```typescript
import { ApiClient, ApiError } from '@project/typescript-sdk';

const client = new ApiClient({ /* config */ });

try {
  const result = await client.users.getProfile('invalid-id');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.code} - ${error.message}`);
    
    // Handle specific error codes
    if (error.code === 'NOT_FOUND') {
      // Handle not found error
    } else if (error.code === 'UNAUTHORIZED') {
      // Handle authentication error
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

The SDK can be configured based on your environment:

```typescript
import { createSdkConfig } from '@project/typescript-sdk';

const config = createSdkConfig({
  environment: 'production', // or 'development', 'staging'
  apiKey: 'your-api-key',
  logLevel: 'error', // 'debug', 'info', 'warn', 'error'
  timeout: 5000, // ms
  retries: 3
});

const client = new ApiClient(config);
```

## Examples

### Creating and Managing a Payment Stream

```typescript
import { Web3Service, ApiClient, BigNumber } from '@project/typescript-sdk';

// Setup services
const web3 = new Web3Service({ /* config */ });
const api = new ApiClient({ /* config */ });

async function createAndManageStream() {
  // 1. Create a payment stream - 0.1 tokens per second for 1 hour
  const recipient = '0xRecipientAddress';
  const tokenAddress = '0xTokenContractAddress';
  const amountPerSecond = new BigNumber('100000000000000000').div(10); // 0.1 tokens/sec
  const durationInSeconds = 60 * 60; // 1 hour
  
  const streamId = await web3.streams.create({
    recipient,
    tokenAddress,
    amountPerSecond: amountPerSecond.toString(),
    duration: durationInSeconds
  });
  
  console.log(`Stream created with ID: ${streamId}`);
  
  // 2. Register stream metadata in the API
  await api.streams.registerMetadata(streamId, {
    title: 'Premium Content Access',
    description: 'Payment stream for accessing premium content',
    creator: await web3.getConnectedAddress()
  });
  
  // 3. Check stream status
  const status = await web3.streams.getStatus(streamId);
  console.log(`Stream status: ${status.active ? 'Active' : 'Inactive'}`);
  console.log(`Current balance: ${status.remainingBalance}`);
  
  // 4. Cancel stream early if needed
  if (userRequestedCancel) {
    await web3.streams.cancel(streamId);
    console.log('Stream cancelled');
  }
}
```

## TypeScript SDK Reference

For a complete reference of all classes, interfaces, and types, see the [TypeScript SDK API Reference](./api-reference.md).

## Next Steps

- [Server Documentation](../server-docs/index.md)
- [Blockchain Integration](../blockchain-docs/index.md)
- [Serverless Functions Documentation](../serverless-docs/index.md)