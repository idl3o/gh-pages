# Local Development Setup

This guide provides detailed instructions for setting up your local development environment for the Web3 Streaming Platform.

## System Requirements

### Minimum Requirements

- **CPU**: Dual-core 2.0 GHz or better
- **RAM**: 8 GB
- **Disk Space**: 10 GB available
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

### Recommended Requirements

- **CPU**: Quad-core 2.5 GHz or better
- **RAM**: 16 GB
- **Disk Space**: 20 GB SSD
- **Operating System**: Windows 11, macOS 12+, or Ubuntu 22.04+

## Required Software

### Core Dependencies

1. **Git**

   - [Download Git](https://git-scm.com/downloads)
   - Verify with: `git --version`

2. **Node.js (v18+)**

   - [Download Node.js](https://nodejs.org/)
   - Verify with: `node --version` and `npm --version`

3. **Ruby 2.7** (for Jekyll)

   - Windows: [RubyInstaller](https://rubyinstaller.org/downloads/)
   - macOS: `brew install ruby@2.7`
   - Ubuntu: `sudo apt install ruby2.7 ruby2.7-dev`
   - Verify with: `ruby -v`

4. **Bundler**

   - Install with: `gem install bundler`
   - Verify with: `bundler -v`

5. **Jekyll**
   - Install with: `gem install jekyll`
   - Verify with: `jekyll -v`

### Component-Specific Dependencies

1. **Solidity Compiler** (for smart contract development)

   - Install with: `npm install -g solc`
   - Verify with: `solc --version`

2. **Emscripten SDK** (for WebAssembly development)

   - [Emscripten Installation Guide](https://emscripten.org/docs/getting_started/downloads.html)
   - Verify with: `emcc --version`

3. **.NET SDK 6.0+** (for .NET client development)

   - [Download .NET SDK](https://dotnet.microsoft.com/download)
   - Verify with: `dotnet --version`

4. **Visual Studio Code** (recommended editor)
   - [Download VS Code](https://code.visualstudio.com/)
   - Recommended extensions:
     - Solidity (for smart contracts)
     - C/C++ (for WebAssembly)
     - ESLint (for JavaScript/TypeScript)
     - Prettier (for code formatting)
     - C# (for .NET development)

## Environment Setup

### Setting up Ruby on Windows

Ruby on Windows requires special attention for Jekyll development:

1. Install Ruby with DevKit:

   ```
   choco install ruby --version=2.7.4.1
   ```

2. Fix common Ruby issues:

   ```
   cd utils
   .\fix_bundler.rb
   .\fix_racc.bat
   ```

3. Add Ruby to Path:

   ```
   .\add_to_path.rb "C:\Ruby27-x64\bin"
   ```

4. Verify Jekyll setup:
   ```
   npm run check:env
   ```

### Environment Variables

Create a `.env` file in the project root with:

```
# Development mode
NODE_ENV=development

# API endpoints
API_URL=http://localhost:8888/.netlify/functions
SITE_URL=http://localhost:4000

# Web3 configuration
WEB3_NETWORK=localhost
WEB3_PROVIDER_URL=http://localhost:8545

# IPFS configuration
IPFS_GATEWAY=http://localhost:8080/ipfs/
```

## Running the Components

### Jekyll Site

Start the Jekyll development server:

```bash
# Using npm script
npm run start

# OR using VS Code task
# Press Ctrl+Shift+P, type "Run Task", select "Start Jekyll (Ruby 2.7)"
```

### TypeScript SDK

Build the TypeScript SDK:

```bash
# Using npm script
npm run ts:build

# OR using VS Code task
# Press Ctrl+Shift+P, type "Run Task", select "Build TypeScript SDK"
```

For watch mode (automatic rebuilding):

```bash
cd ts
npm run dev
```

### Smart Contracts

Compile the smart contracts:

```bash
npm run contracts:build
```

For local blockchain development:

1. Start a local blockchain:

   ```bash
   npx hardhat node
   ```

2. Deploy contracts to local blockchain:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### RED X (WebAssembly)

Build the WebAssembly components:

```bash
# Using npm script
npm run wasm:build

# OR directly
cd red_x
make wasm
```

Start the RED X development server:

```bash
cd red_x
node server.js
```

### Serverless Functions

Run the Netlify Functions locally:

```bash
cd netlify
netlify dev
```

## Testing

### Running All Tests

Run the full test suite:

```bash
npm test
```

### Component-Specific Tests

```bash
# TypeScript SDK tests
cd ts
npm test

# Smart Contract tests
npx hardhat test

# Serverless Function tests
cd netlify/functions
npm test
```

## Database Setup

For local development, SQLite is used by default:

```bash
# Initialize the database
node scripts/init-db.js
```

For advanced setups, configure PostgreSQL:

1. Install PostgreSQL
2. Create a database
3. Update `.env` with:
   ```
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=web3streaming
   DB_USER=postgres
   DB_PASS=yourpassword
   ```

## IDE Setup

### Visual Studio Code

1. Open the project:

   ```
   code .
   ```

2. Install recommended extensions:

   - VS Code should prompt to install recommended extensions from `.vscode/extensions.json`

3. Configure settings:
   - Settings are preconfigured in `.vscode/settings.json`
   - Terminal is set to PowerShell on Windows

### Using Tasks

VS Code tasks are already configured:

- **Start Jekyll**: Runs the Jekyll development server
- **Build TypeScript SDK**: Builds the TypeScript SDK
- **Deploy to GitHub Pages**: Deploys the site to GitHub Pages
- **Check Ruby Environment**: Verifies the Ruby setup

Access tasks with `Ctrl+Shift+P` → "Run Task" → Select task.

## Debugging

### Jekyll

Debug Jekyll build issues:

```bash
bundle exec jekyll build --verbose
```

### TypeScript SDK

Use VS Code's built-in debugger:

1. Set breakpoints in TypeScript files
2. Press F5 (default configuration is in `.vscode/launch.json`)

### Smart Contracts

Debug smart contracts with Hardhat:

```bash
npx hardhat test --debug
```

### WebAssembly

Debug WebAssembly using Chrome DevTools:

1. Build with debug info: `make wasm-debug`
2. Open Chrome DevTools → Sources → WASM

## Common Issues and Solutions

### Jekyll SSL Certificate Issues

On Windows, you might encounter SSL issues with Ruby:

```bash
# Download certificate bundle
.\utils\download-ca-cert.ps1

# Set environment variable
$env:SSL_CERT_FILE="C:\Ruby27-x64\ssl\cert.pem"
```

### Node.js Version Conflicts

Use Node Version Manager to switch between versions:

```bash
# Install nvm using the provided script
.\utils\windows-nvm-setup.ps1

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### EACCESS Errors on npm Install

Fix permission issues:

```bash
# Windows
.\utils\fix-npm-permissions.ps1

# Linux/macOS
chmod -R 755 ~/.npm
```

## Further Resources

- [VS Code Tips & Tricks](./vs-code-tips.md)
- [Ruby Troubleshooting](./ruby-troubleshooting.md)
- [WebAssembly Development Guide](./wasm-development.md)
- [Smart Contract Development Best Practices](./smart-contract-best-practices.md)
