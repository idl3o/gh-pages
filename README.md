# SimpleTokenChain

A blockchain implementation where each token minting adds a new block to the chain, with minimal user interaction facilitated by open-source software.

## Concept

This project implements a unique blockchain system where:

1. Each token minted directly creates a new block in the chain
2. The block contains metadata about the token and links to previous blocks
3. The interface requires minimal interaction from users to participate
4. The entire codebase is open-source and transparent

## Technical Implementation

### Smart Contract

The `SimpleTokenChain.sol` contract combines elements of blockchain and token standards:

- A `Block` structure that includes:
  - Block number
  - Timestamp
  - Minter's address
  - Previous block hash
  - Current block hash
  - Token metadata
  
- Token tracking that includes:
  - Owner mappings
  - Balances
  - Metadata storage
  
- Chain verification to ensure data integrity

### Key Features

- **One-Step Minting**: Minting a token automatically creates a block in the chain
- **Verifiable Integrity**: The `verifyChain()` function allows anyone to verify the blockchain integrity
- **Transparent History**: All blocks are publicly viewable
- **Minimal Interface**: Simple UI requires minimal interaction to participate
- **Open Source**: All code is available for review and improvement

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/simple-token-chain.git
cd simple-token-chain
```

2. Install dependencies:
```
npm install
```

3. Compile the smart contract:
```
npx hardhat compile
```

### Running Tests

Run the test suite to ensure everything is working correctly:

```
npx hardhat test
```

### Local Deployment

1. Start a local blockchain:
```
npx hardhat node
```

2. In a separate terminal, deploy the contract:
```
npx hardhat run scripts/deploy.js --network localhost
```

3. Copy the deployed contract address and use it in your frontend.

### Frontend Usage

1. Open `index.html` in your browser
2. Connect your MetaMask wallet
3. Enter metadata for your token
4. Click "Mint Token"
5. Confirm the transaction in MetaMask
6. Your token is minted and a new block is added to the chain!

## Architecture

```
┌─────────────────┐      ┌───────────────┐      ┌────────────────┐
│                 │      │               │      │                │
│  User Interface │─────▶│  Web3/ethers  │─────▶│  Smart Contract│
│                 │      │               │      │                │
└─────────────────┘      └───────────────┘      └────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                            ┌────────────────┐
│                 │                            │                │
│  MetaMask Wallet│                            │  Blockchain    │
│                 │                            │                │
└─────────────────┘                            └────────────────┘
```

## Extension Ideas

- **Explorer**: Create a block explorer to visualize the chain
- **Enhanced Metadata**: Support for rich media in token metadata
- **Governance**: Allow token holders to vote on protocol changes
- **Layer 2**: Implement sidechains for more efficient token operations

## License

This project is open source and available under the MIT License.