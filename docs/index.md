---
layout: docs
title: Web3 Streaming Platform Documentation
---

Welcome to the documentation for the Web3 Streaming Platform. This comprehensive guide covers all components of our platform, including the Jekyll site, TypeScript SDK, Smart Contracts, RED X Backend, and Serverless Functions.

## Overview

The Web3 Streaming Platform combines traditional web technologies with blockchain capabilities to create a decentralized streaming service. Our architecture consists of:

- **Jekyll Site**: The main user-facing website
- **TypeScript SDK**: Client-side libraries for developers to integrate with our platform
- **Smart Contracts**: Blockchain contracts for token management and transactions
- **RED X Backend**: WebAssembly-powered processing engine for optimized performance
- **Serverless Functions**: API endpoints for various platform services

## Component Documentation

### Jekyll Site

The Jekyll site is the main web interface for the platform. It is hosted on GitHub Pages and serves as the primary user interface for the streaming service.

[Learn more about the Jekyll site structure](./jekyll-site.md)

### TypeScript SDK

The TypeScript SDK provides developers with client-side libraries to interact with the Web3 Streaming Platform. It includes APIs for blockchain interactions, content management, and user authentication.

[View TypeScript SDK documentation](/ts/README.md)

### Smart Contracts

Our platform uses Solidity smart contracts on the Ethereum blockchain to manage tokens, transactions, and content rights.

[Explore Smart Contracts documentation](/contracts/README.md)

### RED X Backend

The RED X Backend is a high-performance WebAssembly component that handles content processing, encoding, and streaming.

[RED X Backend documentation](/red_x/README.md)

### Serverless Functions

Our API layer is built with serverless functions hosted on Netlify, providing scalable endpoints for various platform services.

[Serverless Functions documentation](/netlify/functions/README.md)

## Developer Guides

- [Getting Started](./getting-started.md)
- [Local Development Setup](./local-development.md)
- [Contribution Guidelines](/CONTRIBUTING.md)
- [Code of Conduct](/CODE_OF_CONDUCT.md)
- [API Reference](./api-reference.md)

## Platform Architecture

Below is a high-level diagram of how the different components interact:

```
+----------------+       +-----------------+
| Jekyll Website |------>| TypeScript SDK  |
+----------------+       +-----------------+
        |                         |
        v                         v
+----------------+       +-----------------+
|  Serverless    |<----->|  Smart          |
|  Functions     |       |  Contracts      |
+----------------+       +-----------------+
        |                         |
        v                         v
+----------------+       +-----------------+
|  RED X         |<----->|  Blockchain     |
|  Backend       |       |  Network        |
+----------------+       +-----------------+
```

## Support and Community

- [GitHub Issues](https://github.com/yourusername/gh-pages/issues)
- [Discord Community](https://discord.gg/web3streaming)
- [Support Email](mailto:support@example.com)

## License

This project is licensed under the [MIT License](/LICENSE).
