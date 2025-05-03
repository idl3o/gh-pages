# Installing and Using Node.js on macOS

## Installation Methods

### Method 1: Using Homebrew (Recommended)

1. **Install Homebrew** if you don't have it yet:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Follow Homebrew's setup instructions** that appear after installation, which typically include:

```bash
# For Apple Silicon (M1/M2/M3) Macs
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Macs
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

3. **Install Node.js**:

```bash
brew install node
```

### Method 2: Using NVM (Node Version Manager)

NVM allows you to install and manage multiple Node.js versions:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Add NVM to your path (add this to your ~/.zshrc or ~/.bash_profile)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install latest LTS version of Node.js
nvm install --lts

# Set it as default
nvm alias default node
```

### Method 3: Direct Download

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the macOS installer (.pkg file) for the LTS version
3. Run the installer and follow the instructions

## Verifying Installation

After installation, open a new Terminal window and verify Node.js is correctly installed:

```bash
# Check Node.js version
node -v

# Check npm version
npm -v
```

## Using Node.js with Your GitHub Pages Project

1. **Navigate to your project directory**:

```bash
cd /Users/s/Documents/GitHub/gh-pages
```

2. **Install project dependencies**:

```bash
npm install
```

3. **Generate package-lock.json** (for GitHub Actions):

```bash
chmod +x scripts/generate-lock-file.sh
./scripts/generate-lock-file.sh --commit
```

4. **Run your build script**:

```bash
npm run build
```

5. **Start local development server** (if available):

```bash
npm run dev
```

## Troubleshooting

### Node.js Command Not Found

If you receive "command not found" errors after installation:

1. **Restart your terminal** or open a new terminal window
2. **Check your PATH** by running: `echo $PATH`
3. **Add Node.js to your PATH** if needed:

```bash
# For Homebrew installations on Apple Silicon
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Homebrew installations on Intel Macs
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Issues

For permission-related errors:

```bash
# Fix ownership of npm directories
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Updating Node.js

```bash
# With Homebrew
brew update && brew upgrade node

# With NVM
nvm install --lts --latest-npm
nvm alias default node
```
