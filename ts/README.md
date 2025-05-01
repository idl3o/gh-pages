# TypeScript SDK

The TypeScript SDK provides a developer-friendly interface for interacting with the Web3 Streaming Platform. This document outlines how to use and extend the SDK.

## Installation

You can install the TypeScript SDK using npm:

```bash
npm install @web3streaming/sdk
```

Or using yarn:

```bash
yarn add @web3streaming/sdk
```

## Quick Start

Here's a simple example of using the SDK to connect to a wallet and access content:

```typescript
import { PRXBlockchainClient } from '@web3streaming/sdk';

// Initialize the client
const client = new PRXBlockchainClient({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Connect to a wallet
async function connectWallet() {
  try {
    await client.connect();
    const account = client.getCurrentAccount();
    console.log(`Connected to wallet: ${account}`);
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}

// Access content
async function getContent(contentId) {
  try {
    const content = await client.getContent(contentId);
    return content;
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return null;
  }
}
```

## Core Components

The TypeScript SDK includes the following core components:

### PRXBlockchainClient

The main client for interacting with the blockchain and content systems.

```typescript
import { PRXBlockchainClient } from '@web3streaming/sdk';
```

### PRXBlockchainDashboard

A React component for displaying blockchain information and user data.

```typescript
import { PRXBlockchainDashboard } from '@web3streaming/sdk/components';
```

### Web3Service

A service for interacting with Web3 providers and smart contracts.

```typescript
import { Web3Service } from '@web3streaming/sdk/services';
```

## API Reference

### PRXBlockchainClient

#### Constructor

```typescript
constructor(options: ClientOptions)
```

Options:

- `apiKey`: Your API key
- `network`: 'mainnet' or 'testnet'
- `ipfsGateway`: (optional) Custom IPFS gateway URL

#### Methods

- `connect()`: Connect to a Web3 wallet
- `disconnect()`: Disconnect from the current wallet
- `getCurrentAccount()`: Get the currently connected account
- `getBalance()`: Get the token balance of the current account
- `getContent(contentId: string)`: Fetch content by ID
- `uploadContent(data: ContentData)`: Upload new content
- `purchaseContent(contentId: string)`: Purchase access to content

### PRXBlockchainDashboard

A React component that displays blockchain data and user information.

```tsx
import { PRXBlockchainDashboard } from '@web3streaming/sdk/components';

function App() {
  return (
    <div>
      <PRXBlockchainDashboard apiKey="your-api-key" showBalance={true} showHistory={true} />
    </div>
  );
}
```

Props:

- `apiKey`: Your API key
- `showBalance`: (boolean) Whether to show token balance
- `showHistory`: (boolean) Whether to show transaction history
- `theme`: (optional) Custom theme overrides

## Building the SDK

To build the SDK from source:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the SDK:
   ```bash
   npm run build
   ```

This will generate the compiled output in the `dist` directory.

## Running Tests

To run the test suite:

```bash
npm test
```

For coverage reports:

```bash
npm run test:coverage
```

## Contributing

We welcome contributions to the TypeScript SDK! Please see our [Contributing Guidelines](/CONTRIBUTING.md) for more information.

## License

This SDK is licensed under the [MIT License](/LICENSE).
