# NVM for Windows Setup Guide

NVM (Node Version Manager) for Windows is different from the Unix/Linux version and requires a different installation process.

## Installation

1. Download the installer from the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases)
   - Choose the `nvm-setup.exe` file from the latest release

2. Run the installer and follow the installation prompts

3. After installation, close and reopen your command prompt or PowerShell window

## Usage

NVM for Windows uses different commands than Unix/Linux NVM:

```powershell
# List available Node.js versions
nvm list available

# Install a specific version
nvm install 16.15.1

# Use a specific version
nvm use 16.15.1

# Check which version is currently active
nvm current
```

## Common Issues

### Command Not Found

If you get "nvm is not recognized as an internal or external command", try:
- Make sure you've restarted your command prompt or PowerShell after installation
- Check if the NVM installation directory is in your PATH environment variable

### Permission Issues

Run your command prompt or PowerShell as Administrator if you encounter permission issues.

## Integrating with Project RED X

For your project, you should use Node.js version 16.x for compatibility:

```powershell
# Install Node.js 16.x
nvm install 16.15.1

# Use this version
nvm use 16.15.1

# Verify installation
node -v
npm -v
```

Then install project dependencies:

```powershell
cd c:\Users\Sam\Documents\GitHub\gh-pages
npm install
```
