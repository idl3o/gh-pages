# Getting Started Guide

This guide will help you get started with the project quickly. Follow these steps to set up and run your first operations.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/project.git
cd project
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Quick Start Examples

### TypeScript SDK Example

```typescript
import { Client } from '../ts/src/client';

async function main() {
  // Initialize the client
  const client = new Client({
    apiKey: process.env.API_KEY,
    endpoint: 'https://api.example.com'
  });

  // Make a request
  const result = await client.getData('resource-id');
  console.log('Result:', result);
}

main().catch(console.error);
```

### Smart Contract Integration

```typescript
import { ethers } from 'ethers';
import { PRXTokenChain } from '../contracts/build/PRXTokenChain';

async function interactWithContract() {
  // Connect to provider
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.example.com');
  const signer = provider.getSigner();

  // Get contract instance
  const contractAddress = '0x1234...';
  const contract = new ethers.Contract(contractAddress, PRXTokenChain.abi, signer);

  // Call contract method
  const result = await contract.getBalance();
  console.log('Balance:', ethers.utils.formatEther(result));
}
```

## Next Steps

- [Local Development Setup](local-development.md) - Set up your local environment
- [TypeScript SDK API](api/typescript/index.html) - Explore the API reference
- [Integration Tutorials](tutorials/index.md) - Learn how components work together
