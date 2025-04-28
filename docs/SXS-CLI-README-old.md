# SXS CLI - Simple eXtensible Shell

SXS CLI is a unified command-line interface that combines bash and PowerShell functionality for the GitHub Pages project. It provides a consistent interface for project management tasks, regardless of whether you're working in Windows or a Unix-based environment.

## Features

- **Cross-platform**: Works on Windows (PowerShell), Linux, macOS, and WSL
- **Unified Commands**: Same commands work across all environments
- **Project Management**: Build, deploy, and manage your project with simple commands
- **Git Integration**: Simplified branch management and safe commit options
- **Fixes & Repairs**: Tools to fix common issues with git hooks and dependencies
- **Command Chaining**: Built-in support for && operation across platforms

## Getting Started

### On Windows

Simply run:

```bash
sxs-cli.cmd
```

Or directly with PowerShell:

```powershell
.\sxs-cli.ps1
```

### On Linux/macOS/WSL

Make the script executable and run it:

```bash
chmod +x ./sxs-cli.sh
./sxs-cli.sh
```

## Available Commands

### Core Commands

- `help` - Show the help menu
- `clear` - Clear the console
- `exit` - Exit SXS CLI
- `status` - Show current branch and repository status

### Build Commands

- `build web` - Build the web version (uses Emscripten)
- `build native` - Build the native version
- `clean` - Clean build artifacts

### Server & Deploy Commands

- `server` - Start the development server
- `deploy` - Deploy to GitHub Pages

### Branch Management

- `branch info` - Show branch information
- `branch main` - Switch to main branch
- `branch docs` - Switch to docs branch
- `branch sync` - Sync all branches

### Fixes & Repairs

- `fix hooks` - Fix git hooks issues
- `fix deps` - Fix Node.js dependencies
- `setup` - Set up Emscripten SDK

### Git Operations

- `safe-commit "message"` - Commit changes safely (bypassing hooks)
- `restore-hooks` - Restore git hooks to normal operation

### Advanced Usage

- `try-chain` - Demonstrates command chaining (like && operator)
- `and-operator` - Explains how && works in bash (bash version only)

## Command Chaining

The SXS CLI provides robust command chaining in both PowerShell and bash environments:

### In Bash
The `&&` operator is used natively to ensure commands only execute if the previous command succeeds:

```bash
mkdir temp && cd temp && echo "Success!"
```

### In PowerShell
PowerShell doesn't have a direct equivalent to `&&`, so SXS CLI provides the `Invoke-CommandChain` function:

```powershell
Invoke-CommandChain @(
    { New-Item -ItemType Directory -Path "temp" },
    { Set-Location -Path "temp" },
    { Write-Host "Success!" }
)
```

This ensures that each command only executes if the previous one succeeded, mimicking the behavior of the `&&` operator in bash.

## Running Commands Directly

### PowerShell

```powershell
.\sxs-cli.ps1 -Command "build web"
```

### Bash

```bash
./sxs-cli.sh --command="build web"
```

## Why SXS CLI?

SXS CLI was created to unify project management tasks across different environments and provide a consistent interface for developers. It wraps around various tools and scripts in the project, providing:

1. **Simplicity**: Common tasks are simplified to a single command
2. **Consistency**: Same commands work across all environments
3. **Integration**: Seamlessly integrates with both bash and PowerShell scripts
4. **Discoverability**: Makes all project management features discoverable in one place
5. **Reliability**: Improved error handling with command chaining ensures operations are executed safely

## Extending SXS CLI

To add new commands, simply modify the following files:

- `sxs-cli.ps1`: For PowerShell implementation
- `sxs-cli.sh`: For bash implementation

Add your new command to both files to maintain cross-platform compatibility.
