#!/bin/bash
# Script to rebuild gh-pages from main branch

set -e  # Exit on error

echo "🚀 Rebuilding GitHub Pages from main branch..."

# Get the current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Make sure we're on main
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Switching to main branch..."
  git checkout main
fi

# Pull latest changes
git pull origin main

# Build the site
echo "Building site with Jekyll..."
bundle install
bundle exec jekyll build

# Create/update gh-pages branch
echo "Creating gh-pages branch..."
git checkout -B gh-pages

# Get a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy built files to temp directory
cp -R _site/* $TEMP_DIR/

# Clean out current files (except .git)
find . -mindepth 1 -maxdepth 1 -not -path "./.git" -exec rm -rf {} \;

# Copy the built files back
cp -R $TEMP_DIR/* .

# Clean up temp directory
rm -rf $TEMP_DIR

# Add all files
git add -A

# Commit changes
git commit -m "Deploy GitHub Pages site from main branch"

# Push to remote
echo "Pushing to gh-pages branch..."
git push -f origin gh-pages

# Return to original branch
git checkout $CURRENT_BRANCH

echo "✅ GitHub Pages site has been rebuilt and deployed from main branch!"
echo "Visit your site at: https://idl3o.github.io/gh-pages"
