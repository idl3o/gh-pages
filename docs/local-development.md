# Local Development Setup

This guide will help you set up your local development environment for working with all components of the project.

## System Requirements

- Windows 10/11, macOS, or Linux
- Node.js 18.x or higher
- npm 9.x or higher
- Ruby 2.7+ (for Jekyll documentation)
- Git

## Initial Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/project.git
cd project
```

2. Install dependencies:

```bash
npm install
```

3. Install Ruby dependencies for documentation:

```bash
bundle install
```

## TypeScript SDK Development

The TypeScript SDK is located in the `ts` directory:

1. Navigate to the directory:

```bash
cd ts
```

2. Build the TypeScript code:

```bash
npm run build
```

3. Run tests:

```bash
npm test
```

## Smart Contract Development

Smart contracts are located in the `contracts` directory:

1. Install development dependencies:

```bash
npm install -g hardhat
```

2. Navigate to the contracts directory:

```bash
cd contracts
```

3. Compile contracts:

```bash
npx hardhat compile
```

4. Run contract tests:

```bash
npx hardhat test
```

5. Deploy to local development network:

```bash
npx hardhat node
npx hardhat run --network localhost scripts/deploy.js
```

## RED X Backend Development

The RED X backend is located in the `red_x` directory:

1. Set up WASM toolchain:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

2. Build the WASM package:

```bash
cd red_x
wasm-pack build
```

3. Run tests:

```bash
cargo test
```

## Serverless Functions Development

For developing serverless functions locally:

1. Navigate to the functions directory:

```bash
cd netlify/functions
```

2. Install dependencies:

```bash
npm install
```

3. Start the local development server:

```bash
npm run dev
```

## Documentation Development

To work on the documentation:

1. Make sure you have Jekyll installed:

```bash
gem install jekyll bundler
```

2. Start the documentation server:

```bash
bundle exec jekyll serve
```

3. Visit `http://localhost:4000` in your browser

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# API Keys
API_KEY=your_api_key_here

# Contract Configuration
CONTRACT_ADDRESS=0x...

# Services
ENDPOINT_URL=https://api.example.com
```

## Troubleshooting

### Common Issues

1. **Node.js version issues**: Use nvm to manage Node.js versions
2. **WASM build fails**: Ensure you have the correct Rust toolchain installed
3. **Jekyll errors**: Check Ruby version compatibility

If you encounter any other issues, please check the [troubleshooting guide](troubleshooting.md) or [open an issue](https://github.com/yourusername/project/issues/new).
