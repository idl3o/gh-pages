#!/bin/bash
# Consolidated build script to prepare project for GitHub Pages deployment

set -e  # Exit immediately if a command fails

echo "🚀 Starting consolidated build process..."

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# 1. Setup environment
echo "📦 Setting up environment..."
if [ ! -f "package-lock.json" ]; then
  echo "Generating package-lock.json..."
  npm install --package-lock-only
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install
bundle install

# 3. Clean previous build
echo "🧹 Cleaning previous builds..."
rm -rf _site
rm -rf .jekyll-cache

# 4. Build the site
echo "🔨 Building the site..."
JEKYLL_ENV=production npm run build

# 5. Optional: Generate required files for GitHub Pages
echo "📄 Generating GitHub Pages specific files..."
touch _site/.nojekyll  # Ensure GitHub doesn't process the site with Jekyll again

# 6. Display build information
echo "✅ Build completed successfully!"
echo "📂 Site built in: $PROJECT_ROOT/_site"
echo ""
echo "To test locally: bundle exec jekyll serve"
echo "To deploy: git push origin main (GitHub Actions will handle deployment)"
echo ""

# Optional flags
if [ "$1" == "--serve" ]; then
  echo "🌐 Starting local server..."
  bundle exec jekyll serve
fi
