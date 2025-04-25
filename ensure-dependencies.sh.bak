#!/bin/bash
# Script to ensure all required dependencies are installed

echo "===== Checking Required Dependencies ====="

# List of critical dependencies
CRITICAL_DEPS=(
  "vite"
  "vite-plugin-node-polyfills"
  "crypto-js"
  "gh-pages"
)

# Check each critical dependency
for dep in "${CRITICAL_DEPS[@]}"; do
  echo "Checking $dep..."
  if ! npm list "$dep" --depth=0 2>/dev/null | grep -q "$dep"; then
    echo "Installing missing dependency: $dep"
    npm install --save-dev "$dep"
  else
    echo "✓ $dep is installed"
  fi
done

# Create a minimal vite.config.js if it doesn't exist
if [ ! -f "vite.config.js" ]; then
  echo "Creating minimal vite.config.js..."
  cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';

let nodePolyfillsPlugin = [];
try {
  const { nodePolyfills } = require('vite-plugin-node-polyfills');
  nodePolyfillsPlugin.push(
    nodePolyfills({
      protocolImports: true,
    })
  );
} catch (e) {
  console.warn("Warning: vite-plugin-node-polyfills is not installed.");
}

export default defineConfig({
  plugins: nodePolyfillsPlugin,
  define: {
    global: 'globalThis',
  },
  build: {
    minify: false,
    sourcemap: true
  }
});
EOF
fi

echo "===== Dependencies Check Complete ====="
echo ""
echo "All required dependencies are installed."
echo "You can now run the build with: npm run build"
