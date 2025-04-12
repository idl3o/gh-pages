# Web3 Crypto Streaming Service

This repository contains the website for the Web3 Crypto Streaming Service, a decentralized platform for content streaming built on blockchain technology.

## Overview

The Web3 Crypto Streaming Service leverages blockchain technology to create a more equitable, transparent, and efficient content streaming ecosystem. Our platform enables direct creator-to-viewer relationships, fair revenue distribution, and community governance.

## Key Features

- Decentralized content storage and delivery using IPFS
- Tokenized economy with the STREAM token
- Smart contract integration for transparent transactions
- NFT-based content ownership verification
- Token-gated access to premium content
- User-friendly interfaces for creators and viewers

## Documentation

- [Introduction](docs/root/introduction.html)
- [Creator Guide](docs/guides.creators.html)
- [Viewer Guide](docs/guides.viewers.html)
- [Developer Guide](docs/guides.developers.html)
- [Whitepaper](whitepaper/web3-streaming-service-whitepaper.html)
- [Smart Contracts](docs/tech.contracts.html)

## Development

### Prerequisites

- Node.js 18+
- Git

### Local Setup

1. Clone the repository
   ```bash
   git clone https://github.com/idl3o/gh-pages.git
   cd gh-pages
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Generate placeholder images
   ```bash
   node scripts/generate-placeholders.js
   ```

4. Run development server
   ```bash
   npm start
   ```

5. Build for production
   ```bash
   npm run build
   ```

## Compliance

This project adheres to open source best practices and legal requirements:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Privacy Policy](PRIVACY.md)
- [Terms of Service](TERMS.md)
- [License](LICENSE) (MIT)

## Repository Structure

- `assets/` - CSS, JavaScript, and images
- `controllers/` - Application controllers
- `docs/` - Documentation website
- `models/` - Data models
- `scripts/` - Utility scripts
- `tests/` - Test files
- `whitepaper/` - Project whitepaper

## Deployment

This site is deployed using GitHub Pages. Any changes pushed to the main branch will automatically trigger a deployment through our GitHub Actions workflow.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue in this repository or contact us at support@example.com.
