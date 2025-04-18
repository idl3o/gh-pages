# Web3 Crypto Streaming Service

A decentralized streaming platform that returns control and revenue to creators through blockchain technology.

## About Idl3o

Idl3o is the lead developer of Team MODSIAS, specializing in blockchain integration, distributed systems, and Web3 technologies. With expertise in creating decentralized applications that bridge content creation and cryptocurrency, Idl3o focuses on building equitable platforms that empower creators.

## Project Overview

Web3 Crypto Streaming Service is a revolutionary platform that combines blockchain technology with high-quality media streaming. Our mission is to create a more equitable ecosystem for creators and viewers by:

- Providing creators with 90% of generated revenue
- Ensuring content ownership through blockchain verification
- Enabling direct creator-to-viewer relationships
- Implementing transparent governance through our DAO structure

## Key Features

- **Decentralized Storage Layer**: Content distributed across IPFS for censorship resistance
- **Smart Contract Layer**: Transparent, auditable contracts managing all platform interactions
- **STREAM Token**: Native utility token powering the ecosystem
- **GitHub Integration**: Version control and collaboration tools for content management

## Tech Stack

- Blockchain: Ethereum/Polygon smart contracts
- Storage: IPFS-based content addressing
- Frontend: React/TypeScript progressive web application
- Backend: Node.js with decentralized architecture

## Branch Management

This repository uses multiple branches for different purposes:

- `001` - Main development branch for core functionality
- `temp-check-actions` - Branch for website updates and documentation
- GitHub Pages deployment is handled through a separate remote repository

### Working with Documentation

The smart contract documentation is automatically generated using a GitHub Actions workflow. When changes are made to Solidity files, the documentation is updated and deployed.

To work with documentation:

1. Check out the `temp-check-actions` branch
2. Make your changes to the contracts or documentation
3. Commit and push to trigger the documentation build
4. The site will be available at https://idl3o.github.io/web3-core-functionality/

### Deploying to GitHub Pages

We use a custom deployment process that pushes to a separate gh-pages repository:

```bash
# On Windows
.\deploy-gh-pages.cmd

# On Linux/Mac
./deploy-gh-pages.sh
```

This script builds the static site and deploys it to the separate gh-pages repository.

## Getting Started

Visit our [GitHub Pages site](https://idl3o.github.io/gh-pages) to learn more or join our beta program.

## Contact

- GitHub: [@idl3o](https://github.com/idl3o)
- Twitter/X: [@modsias](https://x.com/modsias)

---

© 2024 Team MODSIAS | Project Demo
