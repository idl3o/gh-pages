# Developer Guide

## Welcome to the Web3 Streaming Platform Project

This guide will help you set up your development environment and understand the key components of our Web3 Streaming Platform.

## Prerequisites

- Node.js (v16.x or newer)
- npm (v8.x or newer)
- Git
- MetaMask or similar Web3 wallet for testing
- Basic knowledge of React, Web3.js, and blockchain concepts

## Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/gh-pages.git
cd gh-pages
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm start
```

The application will be available at `http://localhost:9000`.

4. **Run tests**

```bash
npm test
```

## Project Structure

Our project follows the MVC (Model-View-Controller) architecture:

- **Models (`/models`)**: Data structures and business logic
- **Views (`/_layouts`, `/_includes`, HTML files)**: Presentation layer using Jekyll templating
- **Controllers (`/controllers`)**: Handle user interactions and manage the flow between models and views

### Key Directories and Files

- `/assets`: Static assets like CSS, JS, and images
- `/controllers`: Application controllers
- `/models`: Data models
- `/docs`: Documentation files
- `/tests`: Test files
- `/scripts`: Utility scripts for development
- `/whitepaper`: Technical whitepaper

## Architecture Overview

The platform integrates traditional web technologies with blockchain capabilities:

### Web Layer
- Jekyll-based site structure
- HTML/CSS/JavaScript frontend
- Responsive design with modern CSS

### Application Layer
- JavaScript controllers for business logic
- MVC pattern for separation of concerns

### Blockchain Layer
- Web3.js integration for blockchain interactions
- Smart contract integrations for content access and payments
- Multi-chain support (Ethereum, Polygon, Arbitrum)

## Key Features and Implementation

### User Authentication
Authentication is handled by `user-controller.js` and supports both traditional and wallet-based authentication:

```javascript
// Example of wallet authentication
const walletAddress = await window.connectWallet();
const userData = await UserController.authenticateWallet({ 
  walletAddress 
});
```

### Content Management
Content creation, publishing, and access is managed by `content-controller.js`:

```javascript
// Example of publishing content
const contentData = {
  title: "My Video",
  description: "A demo video",
  contentType: "video",
  url: "ipfs://QmHash"
};
await ContentController.publishContent(contentData, authToken);
```

### Payment Processing
The platform handles payments through the `payment-controller.js`:

```javascript
// Example of processing a content purchase
const paymentResult = await PaymentController.processPayment({
  contentId: "content-123",
  amount: "0.01",
  currency: "ETH"
}, authToken);
```

## Testing Strategy

We use Jest for both unit and integration testing:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **Web3 Tests**: Validate blockchain interactions

## Deployment

The platform is deployed as a GitHub Pages site with the following workflow:

1. Development occurs on feature branches
2. PRs are merged to `main` after review
3. GitHub Actions deploys to GitHub Pages

## Contributing

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed contribution guidelines.

## Common Development Tasks

### Adding a New Feature

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Implement your feature
3. Add tests in the `/tests` directory
4. Run tests: `npm test`
5. Submit a PR to the `main` branch

### Debugging Tips

- Use the browser console for frontend issues
- Check `npm run lint` for code quality issues
- For Web3 issues, try connecting to a test network first

### Performance Optimization

- Bundle size can be checked with `npm run analyze`
- Use the webpack profiler with `npm run profile`

## Getting Help

If you need assistance, you can:

- Open an issue on GitHub
- Consult the documentation in `/docs`
- Reach out to the team on our Discord channel

## API Documentation

For detailed API documentation, run:

```bash
npm run generate:docs
```

This will generate documentation in the `/docs/module-map` directory.

## Happy Coding!

We're excited to have you contribute to our Web3 streaming platform. Your contributions help build the decentralized media future!