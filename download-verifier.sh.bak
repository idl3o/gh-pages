#!/bin/bash
# Script to verify availability of required dependencies and downloads

echo "===== Verifying Required Dependencies ====="

# Check npm registry availability
echo "Checking npm registry availability..."
npm ping
if [ $? -ne 0 ]; then
  echo "⚠️ Warning: npm registry might be slow or unavailable"
else
  echo "✓ npm registry is available"
fi

# List of critical npm packages to verify
CRITICAL_PACKAGES=(
  "vite"
  "vite-plugin-node-polyfills"
  "crypto-js"
  "gh-pages"
  "eslint"
  "prettier"
  "jest"
)

# Check each package availability
echo "Verifying npm package availability..."
for pkg in "${CRITICAL_PACKAGES[@]}"; do
  echo "Checking $pkg..."
  npm view $pkg version &>/dev/null
  if [ $? -eq 0 ]; then
    echo "✓ $pkg is available"
  else
    echo "⚠️ Warning: $pkg might be unavailable"
  fi
done

# Check GitHub Actions availability
echo "Verifying GitHub Actions availability..."
ACTIONS=(
  "actions/checkout@v4"
  "actions/setup-node@v4"
  "ruby/setup-ruby@v1"
  "JamesIves/github-pages-deploy-action@v4.4.3"
  "actions/upload-artifact@v4"
)

for action in "${ACTIONS[@]}"; do
  echo "Checking $action..."
  repo=$(echo $action | cut -d'@' -f1)
  version=$(echo $action | cut -d'@' -f2)

  # Use GitHub API to check if the repo exists (rate limited, be cautious)
  if curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/$repo" | grep -q "200"; then
    echo "✓ $repo exists"
  else
    echo "⚠️ Warning: $repo might not exist or might be private"
  fi
done

echo "===== Verification Complete ====="
echo ""
echo "If any warnings were shown, consider updating those dependencies or actions."
echo "For npm packages, try: npm install --save-dev [package-name]"
echo "For GitHub Actions, check for the latest versions at: https://github.com/[action-repo]"
