# GitHub Pages Multi-Technology Project

This repository contains a multi-technology project with GitHub Pages for web content, TypeScript SDK, Smart Contracts, and a RED X backend.

## Environments

The project supports multiple deployment environments:

- **Production**: Deployed from the `main` branch - [https://idl3o.github.io/gh-pages/](https://idl3o.github.io/gh-pages/)
- **Backend Development**: Deployed from the `backend-dev` branch - [https://idl3o.github.io/gh-pages/backend-dev/](https://idl3o.github.io/gh-pages/backend-dev/)

## Quick Start

### Setting Up Ruby Environment

This project requires Ruby 2.7.x for GitHub Pages compatibility. If you have both Ruby 3.3.x and Ruby 2.7.x installed:

```powershell
# Use the provided startup script to automatically use Ruby 2.7.x
.\start-jekyll.ps1
```

### Manual Setup

```powershell
# Set Ruby 2.7.x in the path
$env:PATH = "C:\Ruby27-x64\bin;" + $env:PATH

# Install dependencies
bundle install

# Start Jekyll server
bundle exec jekyll serve
```

## Project Structure

- **GitHub Pages** (`/`) - The root directory contains the Jekyll site
- **Server APIs** (`/server`) - Backend server code
- **Smart Contracts** (`/contracts`) - Ethereum smart contracts
- **Serverless Functions** (`/netlify/functions`) - Netlify serverless functions
- **RED X Backend** (`/red_x`) - C-based backend with WebAssembly compilation
- **TypeScript SDK** (`/ts/src`) - TypeScript library
- **Services** (`/services`) - Shared services
- **Utils** (`/utils`) - Utility scripts
- **Config** (`/config`) - Configuration files

## Development Workflows

### GitHub Pages Development

1. Run `.\start-jekyll.ps1` to start the Jekyll server with the correct Ruby version
2. Visit `http://localhost:4000` in your browser

### Deploying to GitHub Pages

Run the deployment script:

```powershell
.\deploy-gh-pages.ps1
```

### TypeScript Development

```bash
cd ts
npm install
npm run build
```

### Smart Contract Development

```bash
cd contracts
# Add commands for your specific workflow
```

## Troubleshooting

### Ruby Version Issues

If you encounter Ruby version compatibility issues:

1. Ensure you have Ruby 2.7.x installed
2. Use the `start-jekyll.ps1` script to set the correct Ruby in your PATH
3. If issues persist, check the `utils/fix_racc.bat` or other utility scripts

### WebAssembly Compilation Issues

Ensure you have Emscripten installed and properly configured in your PATH before working with the RED X backend.

## Contributing

Please follow the established coding style in each directory, as different parts of the project may use different conventions.

## License

This project is licensed under the terms specified in the project files.
