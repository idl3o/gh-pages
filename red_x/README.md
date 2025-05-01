# RED X Backend (WebAssembly)

This directory contains the RED X Backend, a high-performance WebAssembly-based processing engine that powers key functionality of the Web3 Streaming Platform.

## Overview

RED X is a WebAssembly (WASM) module designed for computationally intensive tasks in the Web3 Streaming Platform. By using WebAssembly, we achieve near-native performance directly in the browser, reducing latency and enabling advanced features.

## Key Features

- **High-Performance Video Processing**: Optimized video encoding and transcoding
- **Content Verification**: Cryptographic content verification and fingerprinting
- **Real-time Filtering**: AI-powered content filtering
- **IPFS Integration**: Direct WebAssembly to IPFS communication
- **Multi-threading**: Utilizes browser WebWorkers for parallel processing

## Directory Structure

```
red_x/
├── COPYRIGHT.asm        # Copyright notice in assembly format
├── COPYRIGHT.bin        # Binary version of copyright notice
├── COPYRIGHT.hex        # Hexadecimal version of copyright notice
├── Develop-Native.ps1   # PowerShell script for native development
├── email-routes.js      # Email notification routes
├── font_atlas.c         # Font rendering code
├── font_atlas.h         # Font rendering headers
├── index.html           # Demo HTML page
├── index.js             # JavaScript entry point
├── index.wasm           # Compiled WebAssembly module
├── main.c               # Main C code
├── Makefile             # Build system configuration
├── server.js            # Development server
├── sxs                  # SXS development tool
├── sxs-cli.js           # SXS command line interface
├── test.wasm            # Test WebAssembly module
└── windows-connector.js # Windows-specific connector code
```

## Getting Started

### Prerequisites

- Emscripten SDK (emsdk) for compiling WebAssembly
- Node.js (v18+) for running the development server
- Make for building from source
- C/C++ compiler (if building native version)

### Building

#### WebAssembly Build

To build the WebAssembly module:

```bash
make wasm
```

This compiles the C code to WebAssembly using Emscripten.

#### Native Build (for Development/Testing)

To build a native version for development and testing:

```bash
# On Windows
.\Develop-Native.ps1

# On Linux/macOS
make native
```

### Running the Development Server

```bash
node server.js
```

This starts a development server at http://localhost:8080.

## Integration with the Platform

### JavaScript API

```javascript
// Import the RED X module
import { createREDX } from './red_x/index.js';

// Initialize the module
const redx = await createREDX();

// Process video content
const result = await redx.processVideo({
  sourceUrl: 'ipfs://QmVideoCID',
  options: {
    resolution: '720p',
    format: 'mp4'
  }
});

// Verify content integrity
const isValid = await redx.verifyContentIntegrity('ipfs://QmContentCID', 'expectedHash');
```

### WebAssembly Direct Access

For advanced use cases, you can access the WebAssembly module directly:

```javascript
const response = await fetch('index.wasm');
const bytes = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(bytes, importObject);
const result = instance.exports.processFunction(params);
```

## Performance Considerations

- RED X is optimized for processing media content in the browser
- Consider using Web Workers for long-running operations
- Memory usage scales with content size; monitor heap allocation
- For heavy workloads, consider using the streaming API instead of loading entire files

## Development and Testing

### Running Tests

```bash
npm test
```

This runs the test suite using the test.wasm module.

### Debugging

For debugging the C/C++ code:

1. Build with debug symbols:

   ```bash
   make wasm-debug
   ```

2. Use Chrome DevTools with the "WebAssembly" tab for step-by-step debugging

## SXS Development Tool

SXS is a custom development tool for RED X that allows hot-reloading of WebAssembly code.

```bash
node sxs-cli.js watch
```

See [SXS-CLI-README.md](../docs/SXS-CLI-README.md) for more information.

## License

This component is licensed under the [MIT License](/LICENSE).

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](/CONTRIBUTING.md) before submitting pull requests.
