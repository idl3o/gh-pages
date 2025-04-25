#!/bin/bash
# Consolidated deployment script
# This script handles the full build and deployment process to GitHub Pages

set -e  # Exit on error

# Display header
echo "====================================="
echo "GitHub Pages Deployment Script"
echo "====================================="
echo "Starting deployment process at $(date)"
echo

# Define functions
function check_prerequisites() {
  echo "Checking prerequisites..."
  # Check for Git
  if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed!" >&2
    exit 1
  fi

  # Check for npm
  if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed!" >&2
    exit 1
  fi

  # Check if we're in a Git repository
  if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a Git repository!" >&2
    exit 1
  fi

  echo "✓ All prerequisites met"
}

function install_dependencies() {
  echo "Installing dependencies..."
  npm ci
  echo "✓ Dependencies installed"
}

function run_tests() {
  echo "Running tests..."
  npm test
  echo "✓ Tests passed"
}

function build_project() {
  echo "Building project..."
  # Use the VS Code task to build
  cd $(git rev-parse --show-toplevel)
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    ./scripts/run-task.cmd build
  else
    # Try to run the make_web task directly if not on Windows
    cd red_x && make web
  fi
  echo "✓ Build complete"
}

function deploy() {
  echo "Deploying to GitHub Pages..."
  # Get current branch
  CURRENT_BRANCH=$(git branch --show-current)

  # Stash any changes
  git stash -m "Pre-deployment stash $(date)"

  # Switch to or create gh-pages branch
  if git show-ref --verify --quiet refs/heads/gh-pages; then
    git checkout gh-pages
  else
    git checkout -b gh-pages
  fi

  # Get the built files - adjust this path as needed
  cp -r ./red_x/dist/* .

  # Add, commit and push
  git add .
  git commit -m "Deploy at $(date)"
  git push origin gh-pages

  # Switch back to original branch
  git checkout $CURRENT_BRANCH

  # Apply stashed changes if any
  git stash pop || true

  echo "✓ Deployment complete"
}

# Main execution
check_prerequisites
install_dependencies
run_tests
build_project
deploy

echo
echo "====================================="
echo "Deployment completed successfully!"
echo "====================================="
