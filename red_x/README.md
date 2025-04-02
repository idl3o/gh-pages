# Project RED X

A simple C graphics demo that displays a red X on screen using SDL2, now with Claude 4 AI integration.

## Requirements

- SDL2 library
- C compiler (gcc or clang)
- Emscripten (for web version)
- Node.js 18+ (for development server)
- AWS account with access to Bedrock and Claude 4

> **Note:** This project does not require .NET. If you're seeing errors about "dotnet not found", you can safely ignore them for GitHub Pages deployment or check your local environment setup.

## Building

### Native Build

```bash
make
```

### Web Build

```bash
make web
```

### GitHub Pages Build

```bash
../deploy-gh-pages.sh
```

## Running

### Native Application

```bash
./red_x
```

### Web Version

```bash
npm start
```

### GitHub Pages Version

The GitHub Pages version is a static build with limited functionality. Dynamic features that require a server (like Claude AI and real-time networking) won't work.

## Resources

For more information about WebAssembly and SDL2 integration, check the documentation in the `docs` directory or visit [the project wiki](https://github.com/modsias/red_x/wiki).

## Copyright

PROJECT RED X CORE  
CODE GEN ID: AIMODE-775045-V1.0  
COPYRIGHT (C) 2025 github/modsias

