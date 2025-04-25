#!/bin/bash
# GitHub Actions Diagnostic and Repair Tool
# This script helps identify and fix common GitHub Actions issues

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo -e "${BLUE}====================================================${RESET}"
echo -e "${BLUE}   GitHub Actions Diagnostic and Repair Tool        ${RESET}"
echo -e "${BLUE}====================================================${RESET}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not in a git repository root.${RESET}"
  echo "Please run this script from the root of your repository."
  exit 1
fi

# Create workflows directory if it doesn't exist
if [ ! -d ".github/workflows" ]; then
  echo -e "${YELLOW}GitHub Actions workflows directory not found.${RESET}"
  echo -e "Creating .github/workflows directory..."
  mkdir -p .github/workflows
fi

# Check for existing workflows
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" | wc -l)
echo -e "Found ${WORKFLOW_COUNT} workflow files."

# Check for package.json and lock file
if [ -f "package.json" ]; then
  echo -e "${GREEN}✓ Found package.json${RESET}"
  if [ -f "package-lock.json" ]; then
    echo -e "${GREEN}✓ Found package-lock.json${RESET}"
  else
    echo -e "${YELLOW}⚠️ package-lock.json not found. This can cause inconsistent builds.${RESET}"
    read -p "Generate package-lock.json? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npm install --package-lock-only
      echo -e "${GREEN}✓ Generated package-lock.json${RESET}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️ No package.json found. Is this a JavaScript/Node.js project?${RESET}"
fi

# Check GitHub Pages settings
echo -e "\n${BLUE}Checking GitHub Pages settings...${RESET}"
GH_PAGES_BRANCH=$(git branch -a | grep -E 'gh-pages|github-pages' || echo "none")

if [ "$GH_PAGES_BRANCH" == "none" ]; then
  echo -e "${YELLOW}⚠️ No gh-pages branch found. GitHub Pages might not be set up correctly.${RESET}"
else
  echo -e "${GREEN}✓ Found gh-pages branch: $GH_PAGES_BRANCH${RESET}"
fi

# Check for build directory
BUILD_DIRS=("_site" "build" "dist" "public")
BUILD_DIR=""

for dir in "${BUILD_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    BUILD_DIR="$dir"
    echo -e "${GREEN}✓ Found build directory: $BUILD_DIR${RESET}"
    break
  fi
done

if [ -z "$BUILD_DIR" ]; then
  echo -e "${YELLOW}⚠️ No standard build directory found.${RESET}"
  echo "This might cause deployment issues if the workflow can't find your build output."
fi

# Check for deployment workflow
DEPLOYMENT_WORKFLOW_EXISTS=false
for file in .github/workflows/*.yml; do
  if [ -f "$file" ] && grep -q "github-pages\|gh-pages" "$file"; then
    DEPLOYMENT_WORKFLOW_EXISTS=true
    echo -e "${GREEN}✓ Found GitHub Pages deployment workflow: $file${RESET}"
  fi
done

if [ "$DEPLOYMENT_WORKFLOW_EXISTS" == "false" ]; then
  echo -e "${YELLOW}⚠️ No GitHub Pages deployment workflow found.${RESET}"
  read -p "Create a standard GitHub Pages workflow? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > .github/workflows/github-pages.yml << 'EOL'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

concurrency:
  group: "pages"
  cancel-in-progress: true

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Build
        run: npm run build || mkdir -p _site && cp -r *.html assets _site/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '_site'

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v3
EOL
    echo -e "${GREEN}✓ Created .github/workflows/github-pages.yml${RESET}"
  fi
fi

echo -e "\n${GREEN}Diagnostic complete!${RESET}"
echo -e "Check the output above for any warnings or recommendations."
echo -e "For more information, see the GitHub Actions guide: docs/github-actions-guide.md"
