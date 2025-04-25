#!/bin/bash
set -e

echo "Building static version for GitHub Pages..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Create static build directory
BUILD_DIR="./build"
mkdir -p $BUILD_DIR

# Create assets directory structure in build
mkdir -p $BUILD_DIR/assets/css
mkdir -p $BUILD_DIR/assets/js
mkdir -p $BUILD_DIR/assets/images

# Copy root HTML files
cp index.html $BUILD_DIR/
cp 404.html $BUILD_DIR/ 2>/dev/null || :
cp url-launcher.html $BUILD_DIR/ 2>/dev/null || :
cp team.html $BUILD_DIR/ 2>/dev/null || :
cp status.html $BUILD_DIR/ 2>/dev/null || :
cp streaming.html $BUILD_DIR/
cp creator-dashboard.html $BUILD_DIR/ 2>/dev/null || :
cp governance-visualization.html $BUILD_DIR/ 2>/dev/null || :
cp ranking-power.html $BUILD_DIR/ 2>/dev/null || :
cp ai-companion.html $BUILD_DIR/ 2>/dev/null || :

# Copy Markdown files (for Jekyll processing)
cp *.md $BUILD_DIR/ 2>/dev/null || :

# Copy Jekyll config
cp _config.yml $BUILD_DIR/ 2>/dev/null || :

# Copy assets
cp -r assets/css/* $BUILD_DIR/assets/css/ 2>/dev/null || :
cp -r assets/js/* $BUILD_DIR/assets/js/ 2>/dev/null || :
cp -r assets/images/* $BUILD_DIR/assets/images/ 2>/dev/null || :

# Copy any smart contracts
cp Streaming.sol $BUILD_DIR/ 2>/dev/null || :
if [ -f "StreamToken.sol" ]; then
    cp StreamToken.sol $BUILD_DIR/
fi
if [ -f "StreamPayment.sol" ]; then
    cp StreamPayment.sol $BUILD_DIR/
fi
if [ -f "StreamAccessContract.sol" ]; then
    cp StreamAccessContract.sol $BUILD_DIR/
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Please install Node.js and npm."
    exit 1
fi

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten compiler (emcc) not found."
    echo "Please install Emscripten or make sure it's in your PATH."
    exit 1
fi

# Create a minimal package.json for GitHub Pages in the build directory
echo '{
  "name": "web3-core-functionality",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}' > $BUILD_DIR/package.json

# Build the Red X web version
cd red_x

# Make sure required JavaScript libraries are available
echo "Checking for required npm packages..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install --no-optional || { echo "npm install failed"; exit 1; }
fi

# Create a fallback template.html if needed
if [ ! -f template.html ] && [ -f index.html ]; then
    cp index.html template.html
    # Remove any server-dependent references
    sed -i.bak 's|/api/version|#|g' template.html
    sed -i.bak 's|/socket.io/socket.io.js|https://cdn.socket.io/4.5.0/socket.io.min.js|g' template.html
fi

echo "Building Red X WebAssembly..."
emcc main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
    --shell-file template.html -s NO_EXIT_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=cwrap \
    -s ENVIRONMENT=web -s MODULARIZE=1 -s EXPORT_NAME="RedXModule" \
    || { echo "Build failed"; exit 1; }

# Create static version directory
mkdir -p ../build/red_x

# Copy necessary files
cp index.html index.js index.wasm ../build/red_x/

# Copy test deployment file if it exists
if [ -f "deployment_test.html" ]; then
    echo "Copying deployment test file..."
    cp deployment_test.html ../build/red_x/
fi

# Copy copyright information in machine language
mkdir -p ../build/red_x/legal
cp COPYRIGHT.* ../build/red_x/legal/ 2>/dev/null || echo "No COPYRIGHT files found"

# Make sure the js directory exists before copying
if [ -d "js" ]; then
    mkdir -p ../build/red_x/js
    cp -r js/* ../build/red_x/js/
else
    mkdir -p ../build/red_x/js
    # Create minimal required JS files
    echo "// Fallback file created by deployment script" > ../build/red_x/js/link-extractor.js

    # Create a simple link extractor
    cat > ../build/red_x/js/link-extractor.js << 'EOL'
class LinkExtractor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
    }
  }
  async loadLinks(txtFilePath) {
    try {
      const response = await fetch(txtFilePath);
      if (!response.ok) { throw new Error(`Failed to load ${txtFilePath}`); }
      const content = await response.text();
      this.parseAndDisplay(content);
    } catch (error) {
      console.error('Error loading links:', error);
      this.container.innerHTML = `<p class="error">Failed to load links</p>`;
      this.useFallbackData();
    }
  }
  useFallbackData() {
    const fallbackData = `# GitHub Pages Fallback Links\n\n## WebAssembly Resources\n<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>\n<a href="https://emscripten.org/">Emscripten</a>`;
    this.parseAndDisplay(fallbackData);
  }
  parseAndDisplay(content) {
    this.container.innerHTML = '<p>Static GitHub Pages version - links loaded</p>';
    const sections = content.split(/^## /m);
    sections.forEach(section => {
      if (section.trim()) {
        const div = document.createElement('div');
        div.className = 'link-section';
        div.innerHTML = section;
        this.container.appendChild(div);
      }
    });
  }
}
if (typeof window !== 'undefined') { window.LinkExtractor = LinkExtractor; }
EOL
fi

# Copy links file if it exists
if [ -f "../wub-links.txt" ]; then
    cp ../wub-links.txt ../build/
else
    # Create a simple fallback file
    echo "# WUB Links (Fallback)" > ../build/wub-links.txt
    echo "" >> ../build/wub-links.txt
    echo "## Resources" >> ../build/wub-links.txt
    echo "<a href=\"https://developer.mozilla.org/en-US/docs/WebAssembly\">WebAssembly Documentation</a>" >> ../build/wub-links.txt
fi

# Create .nojekyll file to prevent Jekyll processing
touch ../build/.nojekyll

# Create _headers file for Cloudflare/Netlify edge caching
cat > ../build/_headers << 'EOL'
# All pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cloudflare.com wss://*.cloudflare.com; worker-src 'self' blob:;

# WebAssembly specific headers
/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=86400

# API responses should not be cached
/api/*
  Cache-Control: no-cache
EOL

# Write edge functions redirects file for Netlify/Vercel
cat > ../build/_redirects << 'EOL'
# Netlify/Vercel Edge Functions redirects
/api/*  /.netlify/functions/api-handler  200
EOL

# Add WASM compression support after build
if [ -f "red_x/js/utils/compression.js" ]; then
  echo "Optimizing WebAssembly size..."
  node -e "
    const fs = require('fs');
    const path = require('path');
    const Compressor = require('./red_x/js/utils/compression');

    async function optimizeWasm() {
      try {
        const wasmPath = './build/red_x/index.wasm';
        const wasmBuffer = fs.readFileSync(wasmPath);
        console.log('Original WASM size:', (wasmBuffer.length / 1024).toFixed(2), 'KB');

        // Create compressed version
        const optimizedPath = './build/red_x/index.wasm.br';
        await Compressor.compressFile(wasmPath, optimizedPath, {
          format: 'brotli',
          level: 9,
          isWasm: true
        });

        const compressedSize = fs.statSync(optimizedPath).size;
        console.log('Compressed WASM size:', (compressedSize / 1024).toFixed(2), 'KB');
        console.log('Compression ratio:', ((1 - compressedSize / wasmBuffer.length) * 100).toFixed(2), '%');
      } catch (err) {
        console.error('WASM optimization failed:', err);
      }
    }

    optimizeWasm();
  " || echo "WASM optimization skipped"
fi

# Create a CNAME file if needed (customize domain here)
echo "www.web3streaming.example" > ../build/CNAME

# Automated GitHub Pages deployment
echo "Deploying to GitHub Pages..."
if [ -z "$(git branch --list gh-pages)" ]; then
  echo "Creating gh-pages branch..."
  git checkout --orphan gh-pages
  git rm -rf .
  touch .nojekyll
  git add .nojekyll
  git commit -m "Initialize gh-pages branch"
  git push origin gh-pages
  git checkout -
fi

# Deploy to GitHub Pages using git worktree
echo "Deploying build to gh-pages branch..."
if [ -d ".git" ]; then
  # Use git worktree for cleaner deployment
  rm -rf .git/worktrees/gh-pages 2>/dev/null || true
  git worktree add -f gh-pages gh-pages
  rm -rf gh-pages/* gh-pages/.[!.]*
  cp -a build/. gh-pages/
  cd gh-pages
  git add --all
  git commit -m "Deploy to GitHub Pages: $(date)"
  git push origin gh-pages
  cd ..
  git worktree remove gh-pages
  echo "Successfully deployed to GitHub Pages!"
else
  echo "Not a git repository, skipping automatic deployment."
  echo "Static build complete! Files are in the ./build directory."
fi

echo ""
echo "To manually deploy to GitHub Pages:"
echo "1. Create a gh-pages branch (if not already created)"
echo "2. Copy the contents of the build directory to the gh-pages branch"
echo "3. Push the gh-pages branch to GitHub"
echo ""
echo "Or use gh-pages npm package with: npm install -g gh-pages && gh-pages -d build"

exit 0
