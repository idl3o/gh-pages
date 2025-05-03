# Web3 Streaming Platform Frontend

This is the main frontend application for the Web3 Streaming Platform, built with React, TypeScript, and Vite. This application provides a modern, responsive interface for interacting with the decentralized streaming features of our platform.

## Features

- Modern React application with TypeScript support
- Fast development with Vite's HMR (Hot Module Replacement)
- Web3 wallet integration for blockchain interactions
- Responsive design for desktop and mobile devices
- ESLint configuration for code quality
- Integration with our backend services and smart contracts

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- A modern web browser
- (Optional) MetaMask or other Web3 wallet extension

### Required Environment Setup

Before local testing, make sure you have the following configured:

1. **Local Environment Variables**
   Create a `.env.local` file in the webapp directory with these values:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
   VITE_WEB3_NETWORK=localhost
   VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   ```

2. **Local Blockchain (Optional)**
   If testing Web3 functionality:
   - Install Ganache for a local blockchain (or use Hardhat)
   - Update the `VITE_WEB3_NETWORK` and `VITE_CONTRACT_ADDRESS` accordingly

3. **Mock API Server (Optional)**
   For testing without a backend:
   ```bash
   npm install -g json-server
   json-server --watch mock-data.json --port 3000
   ```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/username/gh-pages.git
   cd gh-pages/frontend/frontend/webapp
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Testing Locally

1. **Unit Tests**
   ```bash
   npm run test
   ```

2. **End-to-End Tests**
   ```bash
   npm run test:e2e
   ```

3. **Testing with Mock Data**
   ```bash
   # In one terminal
   npm run mock-api
   
   # In another terminal
   npm run dev
   ```

4. **Browser Testing**
   For cross-browser compatibility testing:
   ```bash
   npm run build
   npm run preview
   ```
   
   Then test in multiple browsers: Chrome, Firefox, Safari, and Edge

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run lint` - Runs ESLint to check code quality
- `npm run preview` - Previews the production build locally
- `npm run test` - Runs unit tests
- `npm run mock-api` - Starts the mock API server (requires json-server)

## Project Structure

```
webapp/
├── public/          # Static assets
├── src/
│   ├── assets/      # Images, fonts, etc.
│   ├── components/  # Reusable UI components
│   ├── contexts/    # React context providers
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Page components
│   ├── services/    # API and service integrations
│   ├── utils/       # Utility functions
│   ├── App.tsx      # Root component
│   └── main.tsx     # Entry point
└── index.html       # HTML template
```

## ESLint Configuration

We use a flat ESLint configuration with TypeScript support. For more advanced linting rules, see below:

```js
// eslint.config.js
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  plugins: {
    'react': reactPlugin,
    'react-hooks': reactHooks,
  },
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    // Custom rules here
  },
})
```

## Troubleshooting

### Common Issues

1. **Node.js Version Mismatch**
   - Error: "The engine 'node' is incompatible with this module"
   - Solution: Use Node.js 18.x or later (check with `node -v`)

2. **Port Already in Use**
   - Error: "Port 5173 is already in use"
   - Solution: Kill the process using that port or use a different port:
     ```bash
     npm run dev -- --port 3000
     ```

3. **Web3 Connection Issues**
   - Error: "Could not connect to Web3 provider"
   - Solution: Make sure your MetaMask or local blockchain is running

## Contributing

Please refer to our [CONTRIBUTING.md](../../../CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the terms specified in our repository's root directory.

## Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at any scale
- [ESLint](https://eslint.org/) - Pluggable JavaScript linter
- [Web3.js](https://web3js.readthedocs.io/) - Ethereum JavaScript API
- [IPFS](https://ipfs.io/) - InterPlanetary File System

---

Updated: May 2, 2025
