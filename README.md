# StreamChain Experience System (SxS)

A comprehensive management CLI for StreamChain Web3 platform development, deployment, and maintenance.

## Installation

Before using the SxS CLI, you need to set it up:

```bash
# Install required dependencies and configure CLI
npm run sxs:setup
```

## Getting Started

After installation, you can start using the CLI:

```bash
# Show the welcome guide for new users
npm run sxs:start

# Or use the globally installed command
sxs --welcome
```

This will start the interactive welcome guide to help you get familiar with the available commands.

## Basic Commands

Here are some essential commands to get started:

```bash
# Show help and available commands
npm run sxs -- --help

# Show the welcome guide
npm run sxs:start

# Try the UI demo
npm run sxs:ui

# See ASCII art capabilities
npm run sxs -- art demo

# List content files
npm run sxs -- content list

# Initialize a blockchain project
npm run sxs -- blockchain init

# Create a token contract
npm run sxs -- token create
```

## Direct CLI Usage

After running `sxs:setup`, you can use the CLI directly:

```bash
sxs --help
sxs blockchain init
sxs token create --erc20
sxs content list
sxs analyze performance
```

## Project Structure

- `/cli` - CLI command modules and utilities
- `/scripts` - Backend scripts for building, deployment, etc.
- `/blockchain` - Blockchain contracts and deployment scripts
- `/docs` - Documentation and whitepapers

## Feature Groups

The SxS CLI is organized into several feature groups:

- **Content** - Content management and analysis
- **Blockchain** - Blockchain project management and deployment
- **Token** - Token creation and deployment
- **Analytics** - Site performance and analytics
- **UI** - UI component demos and utilities
- **Art** - ASCII art for terminal output

## Documentation

For complete documentation on all available commands, run:

```bash
npm run sxs -- --help
```

Or check the specific help for any command:

```bash
npm run sxs -- blockchain --help
npm run sxs -- token --help
```

## Troubleshooting

If you encounter any dependency issues, try running the setup script again:

```bash
npm run sxs:setup
```

## License

MIT
