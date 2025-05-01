# Web3 Streaming Platform

This repository contains the GitHub Pages website, TypeScript SDK, .NET client, WebAssembly components, and smart contracts for the Web3 Streaming Platform.

## Project Structure

- **Jekyll Site**: Main website hosted on GitHub Pages
- **TypeScript SDK**: Client-side SDK for interacting with the platform
- **Serverless Functions**: Netlify functions for API endpoints
- **RED X Backend**: WebAssembly-based components
- **.NET Client**: Client library for .NET applications
- **Smart Contracts**: Solidity contracts for blockchain interactions

## Requirements

- **Ruby 2.7** (for Jekyll)
- **Node.js 18+** (for TypeScript SDK and serverless functions)
- **.NET 6.0** (for .NET client)
- **Emscripten** (optional, for WebAssembly components)
- **Solidity Compiler** (optional, for smart contracts)

## Local Development

### Setting Up

1. Clone the repository
   ```
   git clone https://github.com/yourusername/gh-pages.git
   cd gh-pages
   ```

2. Install Ruby dependencies
   ```
   bundle install
   ```

3. Install Node.js dependencies
   ```
   npm install
   cd ts
   npm install
   cd ../netlify/functions
   npm install
   cd ../..
   ```

4. Set up Git hooks
   ```
   npm install husky --save-dev
   npx husky install
   ```

### Running Tests

You can run all tests using the provided PowerShell script:

```
.\run-tests.ps1
```

This will test:
- Jekyll site build
- TypeScript SDK build
- .NET client build
- WebAssembly components (if Emscripten is installed)
- Smart contracts (if Solc is installed)

### Development Tasks

VS Code tasks are available for common operations:

- **Start Jekyll**: Starts the local Jekyll development server
- **Deploy to GitHub Pages**: Deploys the site to GitHub Pages
- **Build TypeScript SDK**: Builds the TypeScript SDK
- **Check Ruby Environment**: Verifies the Ruby environment is correctly set up

## Deployment

### GitHub Pages

The site is automatically deployed to GitHub Pages via GitHub Actions when pushing to the `main` branch.

### Netlify Functions

Serverless functions are deployed to Netlify using the configuration in `netlify.toml`.

## Documentation

- **Jekyll Site**: The public website and documentation
- **TypeScript API**: Available at `/docs/typescript-api`
- **.NET API**: Available at `/docs/dotnet-api`
- **WebAssembly API**: Available at `/docs/wasm-api`
- **Smart Contracts**: Available at `/docs/contract-api`

## Continuous Integration

GitHub Actions workflows are set up for:

1. **Testing**: Runs on pull requests to ensure everything builds correctly
2. **Deployment**: Deploys the site to GitHub Pages when changes are pushed to the main branch
