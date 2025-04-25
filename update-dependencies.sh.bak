#!/bin/bash
# Script to update dependencies for Vite build and testing

echo "===== Installing Required Dependencies ====="

# Ensure Vite is installed first
npm install --save-dev vite@latest

# Install Vite plugins and polyfills - ensure these critical dependencies are installed correctly
echo "Installing critical Vite plugins..."
npm install --save-dev vite-plugin-node-polyfills@latest crypto-js@latest

# Install testing dependencies
npm install --save-dev jest babel-jest @babel/core @babel/preset-env jest-fetch-mock

# Install linting and formatting dependencies
npm install --save-dev eslint prettier eslint-config-prettier

# Update package.json with the NODE_OPTIONS for the build script
if [ -f "package.json" ]; then
  cp package.json package.json.bak
  # Add NODE_OPTIONS to the build:vite script
  perl -i -pe 's/"build:vite":\s*"vite build"/"build:vite": "NODE_OPTIONS=--openssl-legacy-provider vite build"/' package.json
  # Add test script if it doesn't exist
  if ! grep -q '"test"' package.json; then
    perl -i -pe 's/("scripts":\s*\{)/\1\n    "test": "jest",/' package.json
  fi
  # Add postinstall script to ensure plugin is always available
  if ! grep -q '"postinstall"' package.json; then
    perl -i -pe 's/("scripts":\s*\{)/\1\n    "postinstall": "npm install --no-save vite-plugin-node-polyfills@latest crypto-js@latest",/' package.json
  fi
fi

# Create a simplified build command that bypasses Vite if needed
cat > jekyll-only-build.sh << 'EOF'
#!/bin/bash
# Build script that skips Vite and only uses Jekyll

echo "===== Building with Jekyll Only ====="
bundle exec jekyll build
echo "Build complete! Files in _site directory"
EOF

chmod +x jekyll-only-build.sh

# Create a Vite-specific build script
cat > vite-build.sh << 'EOF'
#!/bin/bash
# Script to build only the Vite portion with enhanced error handling

echo "===== Building with Vite ====="
# Install the required plugin if missing
if ! npm list vite-plugin-node-polyfills &>/dev/null; then
  echo "Installing missing vite-plugin-node-polyfills..."
  npm install --no-save vite-plugin-node-polyfills@latest
fi

# Set legacy provider for Node
export NODE_OPTIONS=--openssl-legacy-provider

# Run Vite build
npx vite build
echo "Vite build complete! Files in dist directory"
EOF

chmod +x vite-build.sh

echo "===== Dependencies Updated ====="
echo ""
echo "To build with the updated configuration, run:"
echo "npm run build"
echo ""
echo "If Vite continues to have issues, use the Jekyll-only build:"
echo "./jekyll-only-build.sh"
echo ""
echo "To build only with Vite (for testing):"
echo "./vite-build.sh"
echo ""
echo "To format and fix linting issues, run:"
echo "./format-and-lint.sh"
