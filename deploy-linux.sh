#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== GitHub Pages Deployment Script =====${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed or not in the PATH${NC}"
    exit 1
fi

# Parse arguments
SKIP_BUILD=false
FORCE=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      exit 1
      ;;
  esac
done

# Check git status
if [[ -n "$(git status --porcelain)" ]] && [[ "$FORCE" == "false" ]]; then
    echo -e "${RED}Error: There are uncommitted changes in your working directory.${NC}"
    echo -e "${RED}Please commit or stash your changes before deploying.${NC}"
    echo -e "${YELLOW}Use --force to override this check (not recommended).${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}Current branch: $CURRENT_BRANCH${NC}"

# Build the site if not skipping build
if [[ "$SKIP_BUILD" == "false" ]]; then
    echo -e "${BLUE}Building Jekyll site...${NC}"

    # Install dependencies if needed
    if [[ ! -d "_site" ]]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        bundle install
        if [[ $? -ne 0 ]]; then
            echo -e "${RED}Bundle install failed!${NC}"
            exit 1
        fi
    fi

    # Build the site
    bundle exec jekyll build
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}Jekyll build failed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Jekyll build successful!${NC}"

    # Build TypeScript SDK if it exists
    if [[ -d "ts" ]]; then
        echo -e "${YELLOW}Building TypeScript SDK...${NC}"
        pushd ts
        npm run build
        if [[ $? -ne 0 ]]; then
            echo -e "${RED}TypeScript build failed!${NC}"
            popd
            exit 1
        fi

        # Copy TypeScript build to _site if it exists
        if [[ -d "dist" ]]; then
            mkdir -p "../_site/assets/js/ts-sdk"
            cp -r dist/* "../_site/assets/js/ts-sdk/"
            echo -e "${GREEN}TypeScript SDK copied to _site/assets/js/ts-sdk/${NC}"
        fi

        popd
    fi
fi

# Check if _site directory exists
if [[ ! -d "_site" ]]; then
    echo -e "${RED}Error: _site directory does not exist. Run without --skip-build to build the site.${NC}"
    exit 1
fi

echo -e "${BLUE}Deploying to GitHub Pages...${NC}"

# Save current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create temporary branch
git checkout --orphan temp-gh-pages

# Add built files
git --work-tree=_site add --all

# Commit with timestamp
git --work-tree=_site commit -m "Deploy to GitHub Pages: $(date '+%Y-%m-%d %H:%M:%S')"

# Update the branch (force push)
git push origin HEAD:gh-pages --force

# Clean up
git checkout "${CURRENT_BRANCH}"
git branch -D temp-gh-pages

echo -e "${GREEN}Successfully deployed to GitHub Pages!${NC}"
echo -e "${GREEN}Your site should be available at https://yourusername.github.io/your-repo-name/${NC}"
