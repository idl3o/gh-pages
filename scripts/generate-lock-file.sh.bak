#!/bin/bash
# Script to generate and commit package-lock.json

set -e  # Exit immediately if a command fails

# Check if we're in the git repository
if [ ! -d ".git" ]; then
  echo "Error: This script must be run from the root of the git repository."
  exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed or not in your PATH."
  exit 1
fi

echo "Generating package-lock.json file..."
npm install --package-lock-only

# Check if file was generated
if [ ! -f "package-lock.json" ]; then
  echo "Error: Failed to generate package-lock.json"
  exit 1
fi

echo "✅ package-lock.json successfully generated!"

# Option to automatically commit and push
if [ "$1" = "--commit" ]; then
  echo "Committing package-lock.json to the repository..."
  git add package-lock.json
  git commit -m "Add package-lock.json for dependency management"

  if [ "$2" = "--push" ]; then
    echo "Pushing changes to remote..."
    git push origin main
  else
    echo "Changes committed locally. To push, run: git push origin main"
  fi
else
  echo ""
  echo "To commit this file to your repository, run:"
  echo "  git add package-lock.json"
  echo "  git commit -m \"Add package-lock.json for dependency management\""
  echo "  git push origin main"
  echo ""
  echo "Or run this script with: ./scripts/generate-lock-file.sh --commit --push"
fi

echo ""
echo "This will resolve the 'Dependencies lock file not found' error in GitHub Actions."
