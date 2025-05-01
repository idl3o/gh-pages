# Smart Contracts

This directory contains the smart contracts that power the Web3 Streaming Platform's blockchain functionality. These contracts handle token management, content ownership, and payment processing on the blockchain.

## Contract Overview

### PRXTokenChain.sol

The main token contract for the platform, implementing ERC-20 and ERC-1155 standards for fungible and non-fungible tokens.

**Key Features:**

- Token minting and burning
- Content ownership verification
- Creator royalty payments
- Token-gated content access

### SimpleTokenChain.sol

A simplified token contract for testing and development purposes.

**Key Features:**

- Basic ERC-20 functionality
- Test minting and transfers
- No gas optimization (for educational purposes)

## Development Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Solidity Compiler (`solc` v0.8.0+)
- Hardhat or Truffle for testing

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Compile contracts:
   ```bash
   npm run contracts:build
   # or
   cd contracts && solc --bin --abi --optimize --overwrite -o ./build/ *.sol
   ```

## Testing

Run the test suite with:

```bash
npm test
```

This will deploy the contracts to a local blockchain and run tests against them.

## Contract Deployment

### Local Development

For local development, you can use Hardhat's local blockchain:

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Test Networks

To deploy to a test network (e.g., Sepolia):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Main Network

For production deployment (be cautious!):

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Contract Verification

After deployment, verify your contracts on Etherscan:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"
```

## Gas Optimization

Our contracts implement several gas optimization techniques:

- Storage packing
- View function optimization
- Loop optimization
- Using events where appropriate instead of storage

To analyze gas usage:

```bash
node analyze-gas-usage.js
```

## Security Considerations

These contracts have been designed with security best practices in mind:

1. Using OpenZeppelin's battle-tested contracts where possible
2. Implementing reentrancy guards
3. Avoiding common vulnerabilities like frontrunning and integer overflow
4. Following the Checks-Effects-Interactions pattern

## Contract Documentation

For detailed function-by-function documentation, see [Contract API Documentation](../docs/contract-api.md).

## License

These contracts are licensed under the [MIT License](/LICENSE).

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](/CONTRIBUTING.md) before submitting pull requests.
