# TypeScript with Smart Contracts Integration

This tutorial demonstrates how to integrate the TypeScript SDK with Smart Contracts.

## Prerequisites

- Node.js 18.x or higher
- TypeScript 5.0+
- Ethers.js
- MetaMask or another Ethereum wallet

## Setup

1. Install required dependencies:

```bash
npm install ethers @types/node dotenv
```

2. Create a `.env` file in your project root:

```
ETHEREUM_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=0x1234...
PRIVATE_KEY=your_private_key_here
```

## Basic Integration Example

Let's build a simple application that connects to a smart contract and calls its methods:

```typescript
// src/contract-integration.ts
import { ethers } from 'ethers';
import { Client } from '../../ts/src/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

// Load contract ABI
const contractABI = JSON.parse(fs.readFileSync('./contracts/build/PRXTokenChain.json', 'utf8')).abi;

async function main() {
  try {
    // Initialize TypeScript SDK client
    const client = new Client({
      apiKey: process.env.API_KEY,
      endpoint: process.env.API_ENDPOINT
    });

    // Initialize blockchain provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

    // Create wallet from private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    console.log(`Connected with address: ${wallet.address}`);

    // Create contract instance
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, contractABI, wallet);

    // Example: Get token balance from contract
    const balance = await contract.balanceOf(wallet.address);
    console.log(`Token balance: ${ethers.utils.formatUnits(balance, 18)}`);

    // Example: Get user data from TypeScript SDK
    const userData = await client.getUserData(wallet.address);
    console.log('User data:', userData);

    // Example: Submit transaction using both SDK and contract
    // 1. Get transaction parameters from SDK
    const txParams = await client.prepareTransaction({
      recipient: '0xRecipientAddress',
      amount: '1.5'
    });

    // 2. Submit transaction to contract
    const tx = await contract.transfer(
      txParams.recipient,
      ethers.utils.parseUnits(txParams.amount, 18),
      { gasLimit: txParams.gasLimit }
    );

    console.log(`Transaction submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // 3. Update SDK with transaction result
    await client.recordTransaction({
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      status: 'confirmed'
    });

    console.log('Integration complete!');
  } catch (error) {
    console.error('Error during integration:', error);
  }
}

main();
```

## Advanced Integration: Event Listeners

The following example demonstrates how to listen for smart contract events and process them with the TypeScript SDK:

```typescript
// src/event-integration.ts
import { ethers } from 'ethers';
import { Client } from '../../ts/src/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();
const contractABI = JSON.parse(fs.readFileSync('./contracts/build/PRXTokenChain.json', 'utf8')).abi;

async function monitorContractEvents() {
  // Initialize SDK client
  const client = new Client({
    apiKey: process.env.API_KEY,
    endpoint: process.env.API_ENDPOINT
  });

  // Initialize provider and contract
  const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, contractABI, provider);

  console.log('Starting event monitor...');

  // Listen for Transfer events
  contract.on('Transfer', async (from, to, amount, event) => {
    console.log(
      `Transfer detected: ${from} sent ${ethers.utils.formatUnits(amount, 18)} tokens to ${to}`
    );

    // Process the event with the SDK
    await client.processTransferEvent({
      from,
      to,
      amount: ethers.utils.formatUnits(amount, 18),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber
    });
  });

  // Listen for custom events
  contract.on('CustomEvent', async (data, event) => {
    console.log(`Custom event detected with data: ${data}`);

    // Process with SDK
    await client.processCustomEvent({
      data,
      txHash: event.transactionHash
    });
  });

  console.log('Event listeners registered. Press Ctrl+C to exit.');
}

monitorContractEvents().catch(console.error);
```

## Best Practices

1. **Error Handling**: Always implement robust error handling for both contract and SDK operations
2. **Gas Estimation**: Use dynamic gas estimation for transactions
3. **Retry Logic**: Implement retry logic for failed transactions
4. **Event Logging**: Log all events and transactions for auditing
5. **Secure Key Management**: Never hardcode private keys; use environment variables or key vaults
6. **Test Networks First**: Always test on testnets before deploying to production

## Additional Resources

- [TypeScript SDK Documentation](../api/typescript/index.html)
- [Smart Contracts API](../api/contracts/index.html)
- [Complete Project Workflow](complete-workflow.md)
