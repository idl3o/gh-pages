# StreamChain - Web3 Crypto Streaming Platform

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-brightgreen)](https://streamchain.github.io/gh-pages/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

StreamChain is a decentralized Web3 streaming platform built on blockchain technology that empowers creators and provides fair monetization options.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Roadmap](#development-roadmap)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Overview

StreamChain revolutionizes content streaming through blockchain technology, allowing creators to maintain ownership of their content, receive fair compensation, and engage directly with their audience.

### Key Principles

- **Decentralized Storage**: Content stored on IPFS for censorship resistance
- **Creator Ownership**: Creators maintain full rights to their content
- **Fair Monetization**: Multiple revenue models including direct tips, subscriptions, and NFTs
- **Community Governance**: Platform decisions made through DAO voting mechanisms

## Features

### Current Features

- Content uploading and streaming from decentralized storage
- Wallet integration for seamless transactions
- Multiple monetization options for creators
- Creator analytics dashboard
- Batch upload functionality for efficient content management
- NFT creation for exclusive content
- Token-gated access controls

### Upcoming Features

- Mobile applications for iOS and Android
- Enhanced analytics dashboard
- Cross-chain compatibility
- Live streaming capabilities
- DAO governance structure
- Creator DAOs

## Project Structure

```
gh-pages/
├── assets/             # Static assets (CSS, JS, images)
│   ├── css/            # Stylesheet files
│   ├── js/             # JavaScript files
│   └── images/         # Image assets
├── _includes/          # Reusable components
├── _layouts/           # Page layout templates
├── _posts/             # Blog posts content
├── docs/               # Project documentation
│   ├── components/     # Component documentation
│   ├── features/       # Feature guides
│   ├── roadmap/        # Development roadmap
│   └── api/            # API documentation
├── scripts/            # Build and utility scripts
│   ├── CLEANUP-README.md  # Cleanup process documentation
│   └── ...             # Various utility scripts
└── tests/              # Test files
```

## Getting Started

### Prerequisites

- Node.js 16.0.0 or later
- Git
- Basic knowledge of blockchain concepts

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/StreamChain/gh-pages.git
   cd gh-pages
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Run the development server

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000` in your browser

### Testing

Run the test suite:

```bash
npm test
```

Run browser compatibility tests:

```bash
npm run test:browsers
```

### Building for Production

Build the static site:

```bash
npm run build
```

## Development Roadmap

Our platform development is organized into three main phases:

### Phase 1: Foundation (Q2-Q4 2025)

- Core platform functionality
- Basic creator tools
- Token economics implementation
- Initial community building

### Phase 2: Expansion (Q1-Q3 2026)

- Enhanced analytics dashboard
- Cross-chain compatibility
- Live streaming capabilities
- Advanced recommendation algorithms

### Phase 3: Maturity (Q4 2026-Q4 2027)

- Full DAO governance transition
- Developer API for integrations
- Advanced monetization tools
- Enterprise creator features

For detailed roadmap information, see [Enhanced Roadmap](docs/roadmap/enhanced-roadmap.md).

## Code Maintenance

To maintain code quality and organization, follow these steps:

1. Identify and clean up duplicate files:

   ```bash
   npm run cleanup:find-duplicates
   ```

2. Review and consolidate duplicate files:

   ```bash
   npm run cleanup:consolidate
   ```

3. Consolidate CSS files:

   ```bash
   npm run cleanup:css
   ```

4. Update the consolidation checklist:

   ```bash
   npm run cleanup:update-checklist
   ```

5. Run all cleanup steps:
   ```bash
   npm run cleanup
   ```

For detailed cleanup process information, see [Cleanup Guide](scripts/CLEANUP-README.md).

## Documentation

### User Documentation

- [Getting Started Guide](docs/users/getting-started.md)
- [Creator Guide](docs/creators/creator-guide.md)
- [Viewer Guide](docs/viewers/viewer-guide.md)
- [Wallet Integration](docs/wallets/integration.md)

### Developer Documentation

- [API Reference](docs/api/reference.md)
- [Component Library](docs/components/index.md)
- [Batch Upload Component](docs/components/batch-uploader.md)
- [Batch Upload Guide](docs/features/batch-upload.md)
- [Smart Contracts](docs/contracts/overview.md)
- [Architecture Overview](docs/architecture/overview.md)

### Whitepapers

- [Technical Whitepaper](docs/whitepapers/technical.md)
- [Token Economics](docs/whitepapers/tokenomics.md)
- [Governance Model](docs/whitepapers/governance.md)

## Contributing

We welcome contributions to StreamChain! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing to the project.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please:

- Check our [FAQ](docs/faq.md)
- Join our [Discord community](https://discord.gg/streamchain)
- Open an [Issue](https://github.com/StreamChain/gh-pages/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
