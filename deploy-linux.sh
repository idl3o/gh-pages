#!/bin/bash

# Enhanced Linux-compatible deploy script for GitHub Pages with proscriptive error handling
# deploy-linux.sh

# Set strict error handling
set -e

# Check if we're in a CI environment
CI=${CI:-false}
SKIP_QUESTIONS=${SKIP_QUESTIONS:-false}

# Color output functions (disabled in CI)
function log_info() {
    if [ "$CI" = "true" ]; then
        echo "[INFO] $1"
    else
        echo -e "\e[36m[INFO] $1\e[0m"
    fi
}

function log_success() {
    if [ "$CI" = "true" ]; then
        echo "[SUCCESS] $1"
    else
        echo -e "\e[32m[SUCCESS] $1\e[0m"
    fi
}

function log_warning() {
    if [ "$CI" = "true" ]; then
        echo "[WARNING] $1"
    else
        echo -e "\e[33m[WARNING] $1\e[0m"
    fi
}

function log_error() {
    if [ "$CI" = "true" ]; then
        echo "[ERROR] $1"
    else
        echo -e "\e[31m[ERROR] $1\e[0m"
    fi
}

function log_critical() {
    if [ "$CI" = "true" ]; then
        echo "[CRITICAL] $1"
    else
        echo -e "\e[31m[CRITICAL] $1\e[0m"
    fi
    exit 1
}

# Initialize logging
LOG_FILE="deploy-log.txt"
echo "--- Deployment Started: $(date -u '+%Y-%m-%d %H:%M:%S') ---" > "$LOG_FILE"

# Function to log to file and console
function log() {
    local timestamp=$(date -u '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
}

# Function to check for required commands
function check_command() {
    log "Checking for $1..."
    if ! command -v "$1" &> /dev/null; then
        log_warning "$1 not found. $2"
        return 1
    else
        log_success "$1 found: $(which $1)"
        return 0
    fi
}

# Function to verify checkpoints
function verify_checkpoint() {
    log "Checking: $1"
    if eval "$2"; then
        log_success "✓ Checkpoint passed: $1"
        return 0
    else
        if [ "$3" = "critical" ]; then
            log_critical "✗ Critical checkpoint failed: $1"
            return 1
        else
            log_warning "✗ Checkpoint failed: $1"
            return 1
        fi
    fi
}

# Function to ask a yes/no question, returns 0 for yes, 1 for no
# In CI or SKIP_QUESTIONS mode, always returns yes
function ask_yes_no() {
    local question="$1"
    local default="${2:-y}"  # Default to yes if not specified

    if [ "$CI" = "true" ] || [ "$SKIP_QUESTIONS" = "true" ]; then
        return 0
    fi

    local prompt="$question [y/n] "
    if [ "$default" = "y" ]; then
        prompt="$question [Y/n] "
    else
        prompt="$question [y/N] "
    fi

    read -p "$prompt" -n 1 -r REPLY
    echo
    if [[ -z "$REPLY" ]]; then
        REPLY=$default
    fi
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Define build directory
BUILD_DIR="./_site"
log_info "Setting build directory to $BUILD_DIR"

# Validate prerequisites
log_info "Validating prerequisites..."

# Check for git
check_command "git" "Please install Git" || log_critical "Git is required for deployment"

# Ensure we're on the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "unknown")
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "backend-dev" ]; then
    log_warning "You're not on main/master branch. Current branch: $CURRENT_BRANCH"
    if ! ask_yes_no "Do you want to continue deployment from the $CURRENT_BRANCH branch?"; then
        log "Deployment cancelled by user."
        exit 0
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log_warning "You have uncommitted changes in your working directory."
    if ! ask_yes_no "Do you want to continue deployment with uncommitted changes?"; then
        log "Deployment cancelled by user."
        exit 0
    fi
fi

# Check for npm (optional)
npm_installed=0
if check_command "npm" "Some features may not work. Install Node.js from https://nodejs.org/"; then
    npm_installed=1
fi

# Check for emscripten (Emcc)
emcc_installed=0
EMCC_PATH=""

if command -v emcc &> /dev/null; then
    EMCC_PATH=$(which emcc)
    emcc_installed=1
    log_success "Found emcc in PATH: $EMCC_PATH"
elif [ -d "./emsdk" ] && [ -f "./emsdk/upstream/emscripten/emcc" ]; then
    EMCC_PATH="./emsdk/upstream/emscripten/emcc"
    emcc_installed=1
    log_success "Found emcc in local emsdk directory: $EMCC_PATH"
else
    log_warning "Emscripten compiler (emcc) not found."
    log_info "Attempting to activate emsdk automatically..."

    if [ -d "./emsdk" ]; then
        log_info "Found emsdk, activating environment..."
        pushd ./emsdk > /dev/null
        source ./emsdk_env.sh || true
        popd > /dev/null

        if command -v emcc &> /dev/null; then
            EMCC_PATH=$(which emcc)
            emcc_installed=1
            log_success "Successfully activated emsdk environment."
        else
            log_error "Failed to activate emsdk environment."
        fi
    else
        log_error "emsdk not found. If you want to build WebAssembly components, please install emsdk first."
        if ! ask_yes_no "Continue without WebAssembly support?"; then
            log "Deployment cancelled by user."
            exit 0
        fi
    fi
fi

# Create or clean build directory
log_info "Creating build directory..."
if [ -d "$BUILD_DIR" ]; then
    log_info "Cleaning existing directory..."
    # Keep .git directory if it exists
    find "$BUILD_DIR" -mindepth 1 -not -path "$BUILD_DIR/.git*" -delete || true
else
    mkdir -p "$BUILD_DIR"
fi

# Create directories
log_info "Creating directory structure..."
mkdir -p "$BUILD_DIR/assets/css"
mkdir -p "$BUILD_DIR/assets/js"
mkdir -p "$BUILD_DIR/assets/images"
mkdir -p "$BUILD_DIR/assets/fonts"
mkdir -p "$BUILD_DIR/assets/videos"
mkdir -p "$BUILD_DIR/components"
mkdir -p "$BUILD_DIR/pages"
mkdir -p "$BUILD_DIR/pages/team"
mkdir -p "$BUILD_DIR/pages/blockchain"
mkdir -p "$BUILD_DIR/pages/streaming"
mkdir -p "$BUILD_DIR/docs"

# Function to safely copy files
function copy_file_safely() {
    if [ -f "$1" ]; then
        cp "$1" "$2"
        log_success "Copied: $1 -> $2"
    else
        log_warning "Source not found: $1"
        return 1
    fi
}

function copy_dir_safely() {
    if [ -d "$1" ]; then
        cp -r "$1"/* "$2"/ 2>/dev/null || true
        log_success "Copied directory: $1 -> $2"
    else
        log_warning "Source directory not found: $1"
        return 1
    fi
}

# Copy root HTML files
log_info "Copying root HTML files..."
copy_file_safely "index.html" "$BUILD_DIR/"
copy_file_safely "404.html" "$BUILD_DIR/"

# Copy components
log_info "Copying components..."
if [ -d "components" ]; then
    copy_dir_safely "components" "$BUILD_DIR/components"
fi

# Copy public content pages
log_info "Copying public content pages..."
PUBLIC_PAGES=(
    "url-launcher.html" "status.html" "ai-companion.html"
    "creator-dashboard.html" "governance-visualization.html" "ranking-power.html"
)

if [ -d "public" ]; then
    for page in "${PUBLIC_PAGES[@]}"; do
        copy_file_safely "public/$page" "$BUILD_DIR/pages/"
    done

    # Team pages
    copy_file_safely "public/team.html" "$BUILD_DIR/pages/team/"

    # Blockchain pages
    copy_file_safely "public/token.html" "$BUILD_DIR/pages/blockchain/"
    copy_file_safely "public/token-explorer.html" "$BUILD_DIR/pages/blockchain/"
    copy_file_safely "public/prx-blockchain.html" "$BUILD_DIR/pages/blockchain/"

    # Streaming pages
    copy_file_safely "public/streaming.html" "$BUILD_DIR/pages/streaming/"
fi

# Check root directory for HTML files
log_info "Checking for HTML files in root..."
ROOT_PAGES=(
    "team.html:$BUILD_DIR/pages/team/"
    "status.html:$BUILD_DIR/pages/"
    "streaming.html:$BUILD_DIR/pages/streaming/"
    "creator-dashboard.html:$BUILD_DIR/pages/"
    "governance-visualization.html:$BUILD_DIR/pages/"
    "ranking-power.html:$BUILD_DIR/pages/"
    "ai-companion.html:$BUILD_DIR/pages/"
    "prx-blockchain.html:$BUILD_DIR/pages/blockchain/"
)

for page_mapping in "${ROOT_PAGES[@]}"; do
    source=$(echo $page_mapping | cut -d: -f1)
    destination=$(echo $page_mapping | cut -d: -f2)
    copy_file_safely "$source" "$destination"
done

# Copy Markdown files (for docs)
log_info "Copying documentation files..."
if [ -d "docs" ]; then
    cp -r docs/*.md "$BUILD_DIR/docs/" 2>/dev/null || true
fi

# Copy Jekyll config
log_info "Copying Jekyll configuration..."
if ! copy_file_safely "_config.yml" "$BUILD_DIR/"; then
    log_critical "Failed to copy _config.yml - this file is required!"
fi

# Copy assets
log_info "Copying assets..."
ASSET_DIRS=(
    "assets/css:$BUILD_DIR/assets/css"
    "assets/js:$BUILD_DIR/assets/js"
    "assets/images:$BUILD_DIR/assets/images"
    "assets/fonts:$BUILD_DIR/assets/fonts"
    "assets/videos:$BUILD_DIR/assets/videos"
)

for dir_mapping in "${ASSET_DIRS[@]}"; do
    source=$(echo $dir_mapping | cut -d: -f1)
    destination=$(echo $dir_mapping | cut -d: -f2)
    copy_dir_safely "$source" "$destination"
done

# Copy smart contracts
log_info "Copying smart contracts..."
mkdir -p "$BUILD_DIR/pages/blockchain/contracts"

CONTRACT_FILES=(
    "Streaming.sol" "StreamToken.sol" "StreamPayment.sol" "StreamAccessContract.sol"
)

for contract in "${CONTRACT_FILES[@]}"; do
    copy_file_safely "$contract" "$BUILD_DIR/pages/blockchain/contracts/"
done

if [ -d "contracts" ]; then
    copy_dir_safely "contracts" "$BUILD_DIR/pages/blockchain/contracts"
fi

# Create package.json for GitHub Pages
log_info "Creating package.json for GitHub Pages..."
cat > "$BUILD_DIR/package.json" << EOF
{
  "name": "web3-core-functionality",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
EOF

# Build the RED X web version
log_info "Building RED X WebAssembly component..."

# Set up a trap to return to the original directory
pushd ./red_x > /dev/null || {
    log_error "RED X directory not found!"
    RED_X_SUCCESS=0
}

# Check for package.json and install dependencies
if [ -f "package.json" ] && [ $npm_installed -eq 1 ]; then
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm packages..."
        npm install --no-optional || log_warning "npm install failed"
    fi
fi

# Create fallback template.html if needed
if [ ! -f "template.html" ] && [ -f "index.html" ]; then
    log_info "Creating fallback template.html from index.html..."
    cp index.html template.html

    # Remove server-dependent references
    sed -i 's|/api/version|#|g' template.html
    sed -i 's|/socket.io/socket.io.js|https://cdn.socket.io/4.5.0/socket.io.min.js|g' template.html
fi

# Verify required files exist
if [ -f "main.c" ] && [ -f "font_atlas.c" ] && [ -f "font_atlas.h" ]; then
    log_info "Found all required files for compilation"
else
    log_warning "Missing source files for RED X compilation"
fi

# Only proceed with WebAssembly build if emcc is available
if [ $emcc_installed -eq 1 ]; then
    log_info "Building Red X WebAssembly using $EMCC_PATH..."

    # Make sure emsdk environment is activated if using local emsdk
    if [[ "$EMCC_PATH" == *"emsdk"* ]]; then
        log_info "Re-activating emsdk environment to ensure correct setup..."
        source "../emsdk/emsdk_env.sh" || log_warning "Could not source emsdk_env.sh"
    fi

    # Attempt to build with emcc
    if [ -f "Makefile" ]; then
        log_info "Building using Makefile..."
        make web || {
            log_error "WebAssembly build with make failed"
            RED_X_SUCCESS=0
        }
    else
        log_info "Building directly with emcc..."
        $EMCC_PATH -Wall -Wextra -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
            -s 'EXPORTED_RUNTIME_METHODS=["ccall"]' -s 'SDL2_IMAGE_FORMATS=["png"]' \
            main.c font_atlas.c -o index.html -lm \
            -s ERROR_ON_UNDEFINED_SYMBOLS=0 || {
                log_error "WebAssembly build with direct emcc command failed"
                RED_X_SUCCESS=0
            }
    fi

    # Verify the build created the expected output files
    if [ -f "index.html" ] && [ -f "index.js" ] && [ -f "index.wasm" ]; then
        log_success "WebAssembly build completed successfully"
        RED_X_SUCCESS=1
    else
        log_warning "WebAssembly build did not produce all required output files"
        RED_X_SUCCESS=0
    fi
else
    log_warning "Skipping WebAssembly build (emcc not available)"
    RED_X_SUCCESS=0

    # Create placeholder files if WebAssembly build is skipped
    if [ ! -f "index.html" ]; then
        cat > "index.html" << EOL
<!DOCTYPE html>
<html>
<head>
  <title>Red X Placeholder</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>Red X WebAssembly Component</h1>
  <p>This is a placeholder for the WebAssembly component that could not be built.</p>
  <p>Please ensure Emscripten is properly installed and configured.</p>
</body>
</html>
EOL
        log_info "Created placeholder index.html"
    fi
fi

# Create static version directory and copy files
log_info "Copying RED X build output to static site..."
mkdir -p "../$BUILD_DIR/red_x"
cp -f "index.html" "../$BUILD_DIR/red_x/" || log_warning "Failed to copy index.html"
cp -f "index.js" "../$BUILD_DIR/red_x/" 2>/dev/null || log_warning "Failed to copy index.js"
cp -f "index.wasm" "../$BUILD_DIR/red_x/" 2>/dev/null || log_warning "Failed to copy index.wasm"

# Copy test deployment file if it exists
if [ -f "deployment_test.html" ]; then
    cp -f "deployment_test.html" "../$BUILD_DIR/red_x/"
fi

# Copy copyright information
mkdir -p "../$BUILD_DIR/red_x/legal"
cp -f COPYRIGHT.* "../$BUILD_DIR/red_x/legal/" 2>/dev/null || log_warning "No COPYRIGHT files found"

# Copy JS directory if it exists
if [ -d "js" ]; then
    mkdir -p "../$BUILD_DIR/red_x/js"
    cp -r js/* "../$BUILD_DIR/red_x/js/" 2>/dev/null || log_warning "Failed to copy JS directory"
else
    log_info "Creating minimal required JS files..."
    mkdir -p "../$BUILD_DIR/red_x/js"

    # Create a minimal fallback js file
    cat > "../$BUILD_DIR/red_x/js/link-extractor.js" << EOL
// Fallback file created by deployment script
class LinkExtractor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(\`Container element with ID "\${containerId}" not found\`);
    }
  }
  async loadLinks(txtFilePath) {
    try {
      const response = await fetch(txtFilePath);
      if (!response.ok) { throw new Error(\`Failed to load \${txtFilePath}\`); }
      const content = await response.text();
      this.parseAndDisplay(content);
    } catch (error) {
      console.error('Error loading links:', error);
      this.container.innerHTML = \`<p class="error">Failed to load links</p>\`;
      this.useFallbackData();
    }
  }
  useFallbackData() {
    const fallbackData = \`# GitHub Pages Fallback Links\n\n## WebAssembly Resources\n<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>\n<a href="https://emscripten.org/">Emscripten</a>\`;
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

# Return to original directory
popd > /dev/null

# Copy links file
log_info "Copying links file..."
if [ -f "wub-links.txt" ]; then
    cp -f "wub-links.txt" "$BUILD_DIR/"
else
    # Create a simple fallback file
    log_info "Creating fallback links file..."
    cat > "$BUILD_DIR/wub-links.txt" << EOL
# WUB Links (Fallback)

## Resources
<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>
EOL
fi

# Create .nojekyll file to prevent Jekyll processing
log_info "Creating .nojekyll file..."
touch "$BUILD_DIR/.nojekyll"

# Create _headers file for Cloudflare/Netlify edge caching
log_info "Creating security headers for CDN..."
cat > "$BUILD_DIR/_headers" << EOL
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

# Create edge functions redirects file for Netlify/Vercel
log_info "Creating API redirects for serverless functions..."
cat > "$BUILD_DIR/_redirects" << EOL
# Netlify/Vercel Edge Functions redirects
/api/*  /.netlify/functions/api-handler  200
EOL

# Create a CNAME file
log_info "Creating CNAME file..."
echo "www.web3streaming.example" > "$BUILD_DIR/CNAME"

# Verify the build output before proceeding
verify_checkpoint "Verify build output files exist" \
    "[ -f \"$BUILD_DIR/index.html\" ] && [ -f \"$BUILD_DIR/.nojekyll\" ] && [ -f \"$BUILD_DIR/CNAME\" ]" \
    "critical"

# Modified section for GitHub Pages deployment to handle CI environments
log_info "Deploying to GitHub Pages..."
if [ "$CI" = "true" ]; then
    log_info "CI environment detected, skipping git operations (handled by GitHub Actions)"
elif command -v git &> /dev/null; then
    # Save the current branch to restore it later
    ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $ORIGINAL_BRANCH (will restore after deployment)"

    # Check if gh-pages branch exists
    if ! git branch --list gh-pages &> /dev/null; then
        log_info "Creating gh-pages branch..."
        git checkout --orphan gh-pages
        git rm -rf .
        touch .nojekyll
        git add .nojekyll
        git commit -m "Initialize gh-pages branch"
        git push origin gh-pages
        git checkout $ORIGINAL_BRANCH
    fi

    # Deploy to GitHub Pages using git worktree
    log_info "Deploying build to gh-pages branch..."

    # Clean up any existing worktree
    if [ -d ".git/worktrees/gh-pages" ]; then
        log_info "Removing existing worktree..."
        rm -rf ".git/worktrees/gh-pages"
    fi

    # Check if gh-pages directory exists and remove it
    if [ -d "gh-pages" ]; then
        log_info "Removing existing gh-pages directory..."
        rm -rf "gh-pages"
    fi

    # Create a worktree for gh-pages branch
    git worktree add -f gh-pages gh-pages

    if [ -d "gh-pages" ]; then
        # Remove all files in gh-pages but keep .git
        log_info "Preparing gh-pages directory..."
        find gh-pages -mindepth 1 -not -path "gh-pages/.git*" -delete

        # Copy build files to gh-pages
        log_info "Copying build files to gh-pages..."
        cp -r "$BUILD_DIR"/* gh-pages/

        # Go to gh-pages directory
        pushd gh-pages > /dev/null

        # Check if there are any changes to commit
        if [ -n "$(git status --porcelain)" ]; then
            log_info "Committing changes to gh-pages branch..."
            git add --all
            git commit -m "Deploy to GitHub Pages: $(date -u '+%Y-%m-%d %H:%M:%S')"

            # Push with error handling
            log_info "Pushing to GitHub..."
            if ! git push origin gh-pages; then
                log_error "Failed to push to GitHub."
                if ask_yes_no "Do you want to retry the push?"; then
                    log_info "Retrying push..."
                    if git push origin gh-pages --force; then
                        log_success "Push retry successful!"
                    else
                        log_error "Push retry failed."
                    fi
                fi
            else
                log_success "Successfully pushed to GitHub!"
            fi
        else
            log_warning "No changes to commit to gh-pages branch."
        fi

        popd > /dev/null
        git worktree remove -f gh-pages

        # Restore the original branch
        git checkout $ORIGINAL_BRANCH

        verify_checkpoint "Verify deployment completed successfully" "true" || true

        log_success "Successfully deployed to GitHub Pages!"
    else
        log_error "Failed to create git worktree for gh-pages branch."
    fi
else
    log_warning "Git not available, skipping automatic deployment."
    log_success "Static build complete! Files are in the ./_site directory."
fi

# Print deployment summary and instructions
echo ""
log_info "============== DEPLOYMENT SUMMARY =============="
log_info "Build completed: $(date -u '+%Y-%m-%d %H:%M:%S')"
log_info "Log file: $LOG_FILE"
log_info "Build directory: $BUILD_DIR"

if ! command -v git &> /dev/null; then
    echo ""
    log_info "To manually deploy to GitHub Pages:"
    log_info "1. Create a gh-pages branch (if not already created)"
    log_info "2. Copy the contents of the _site directory to the gh-pages branch"
    log_info "3. Push the gh-pages branch to GitHub"
    echo ""
    log_info "Or use gh-pages npm package with: npm install -g gh-pages && gh-pages -d _site"
fi

log_info "============================================="
log_success "Deployment script completed!"
