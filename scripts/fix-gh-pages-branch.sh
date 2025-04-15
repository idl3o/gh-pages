#!/bin/bash
# Script to fix divergent branches in gh-pages

# Check if we're in the git repository
if [ ! -d ".git" ]; then
  echo "Error: This script must be run from the root of the git repository."
  exit 1
fi

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Make sure we have the latest code
echo "Fetching latest changes from remote..."
git fetch origin

# Option 1: Force push approach (safest for gh-pages since it's a generated branch)
if [ "$1" == "force" ]; then
  echo "Creating a fresh gh-pages branch..."
  
  # Check if _site directory exists
  if [ ! -d "_site" ]; then
    echo "Building site first..."
    npm run build
  fi
  
  # Create a new orphan branch
  git checkout --orphan temp-gh-pages
  
  # Remove everything
  git rm -rf .
  
  # Copy built site content
  cp -r _site/* .
  
  # Add necessary files
  echo "Adding files to new branch..."
  git add .
  
  # Commit changes
  git commit -m "Reset gh-pages branch with latest build"
  
  # Delete old gh-pages branch
  git branch -D gh-pages 2>/dev/null || true
  
  # Rename current branch
  git branch -m gh-pages
  
  # Force push to remote
  echo "Force pushing new gh-pages branch..."
  git push -f origin gh-pages
  
  # Return to original branch
  git checkout $CURRENT_BRANCH
  echo "Done! gh-pages branch has been reset and force pushed."

# Option 2: Configure pull strategy (for when you want to keep history)
else
  echo "Configuring git pull strategy..."
  
  # Set pull strategy to merge for this repo
  git config pull.rebase false
  
  echo "Now you can run: git checkout gh-pages && git pull origin gh-pages"
  echo "Or to force reset local branch: git checkout gh-pages && git reset --hard origin/gh-pages"
fi

echo ""
echo "If you want to completely recreate the branch, run this script with 'force':"
echo "  ./scripts/fix-gh-pages-branch.sh force"
