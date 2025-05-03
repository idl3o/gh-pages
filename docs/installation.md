# Installation Guide for Web3 Crypto Streaming Service

This guide will help you set up and run the Web3 Crypto Streaming platform locally for development or testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher) or [Yarn](https://yarnpkg.com/) (v1.22.x or higher)
- [Git](https://git-scm.com/) for version control
- A modern web browser with MetaMask extension installed
- [Ruby](https://www.ruby-lang.org/en/downloads/) (for Jekyll)
- [Bundler](https://bundler.io/) (for Jekyll dependencies)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/web3-streaming-platform.git
cd web3-streaming-platform
```

## Step 2: Install Dependencies

For the Jekyll static site:

```bash
bundle install
```

For the Web3 components:

```bash
npm install
# or with yarn
yarn install
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
# Blockchain Network Configuration
NETWORK_RPC_URL=https://rpc-mainnet.maticvigil.com/
CHAIN_ID=137

# Smart Contract Addresses
CONTENT_CONTRACT=0x1234567890abcdef1234567890abcdef12345678
TOKEN_CONTRACT=0xabcdef1234567890abcdef1234567890abcdef12

# IPFS Configuration
IPFS_GATEWAY=https://ipfs.infura.io/ipfs/
IPFS_API_KEY=your_ipfs_api_key_here

# API Keys (for development only, use environment secrets in production)
ALCHEMY_API_KEY=your_alchemy_key_here
```

## Step 4: Set Up Local Development Environment

### For Jekyll Site

```bash
bundle exec jekyll serve
```

Your site will be available at `http://localhost:4000`

### For Web3 Development Server

```bash
npm run dev
# or with yarn
yarn dev
```

This will start the development server at `http://localhost:3000`

## Step 5: Connect a Wallet for Testing

1. Open your browser and navigate to `http://localhost:4000`
2. Click the "Connect Wallet" button
3. Choose MetaMask or WalletConnect
4. For testing functionality, connect to a test network (Mumbai for Polygon)

## Smart Contract Development

If you need to modify or deploy the smart contracts:

1. Install Hardhat globally:
```bash
npm install -g hardhat
```

2. Compile contracts:
```bash
npx hardhat compile
```

3. Run tests:
```bash
npx hardhat test
```

4. Deploy to a test network:
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

## Environment Setup for Creators

Creators need additional tools for content management:

```bash
npm install -g @web3-stream/creator-cli
creator-cli setup
```

Follow the setup wizard to configure your creator environment.

## Troubleshooting

- **MetaMask Connection Issues**: Ensure you're on the correct network (Polygon Mainnet or Mumbai Testnet)
- **IPFS Upload Failures**: Check your API key and connection to the IPFS gateway
- **Smart Contract Interactions Failing**: Verify you have sufficient gas (MATIC) in your wallet
- **Jekyll Build Errors**: Check Ruby and Bundler versions compatibility

## Additional Resources

- [Full Documentation](https://docs.web3streamingplatform.com)
- [API Reference](https://api.web3streamingplatform.com/docs)
- [Developer Discord](https://discord.gg/web3streaming)
- [GitHub Repository](https://github.com/yourusername/web3-streaming-platform)

## Production Deployment

For production deployment, consider using:

- [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) for frontend hosting
- [GitHub Pages](https://pages.github.com/) for the static Jekyll site
- [IPFS](https://ipfs.io/) or [Arweave](https://www.arweave.org/) for decentralized storage
- [Polygon](https://polygon.technology/) for scalable blockchain transactions
