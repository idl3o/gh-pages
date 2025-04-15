#!/bin/bash
# Script to assess the current Husky configuration and status in the project

echo "===== Husky Status Assessment ====="

# Check if Husky is installed in node_modules
if [ -d "node_modules/husky" ]; then
  echo "✅ Husky package is installed"
  HUSKY_VERSION=$(grep '"husky":' package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d ' ')
  echo "   Husky version: $HUSKY_VERSION"
else
  echo "❌ Husky package is not installed in node_modules"
fi

# Check for Husky configuration files
echo -e "\n--- Husky Configuration Files ---"

if [ -f ".huskyrc" ]; then
  echo "✅ .huskyrc file found:"
  cat .huskyrc
else
  echo "❌ No .huskyrc file found"
fi

if [ -d ".husky" ]; then
  echo "✅ .husky directory found with hooks:"
  ls -la .husky

  # Check specific hooks
  if [ -f ".husky/pre-commit" ]; then
    echo -e "\npre-commit hook content:"
    cat .husky/pre-commit
  fi
else
  echo "❌ No .husky directory found"
fi

# Check if Husky is configured in package.json
echo -e "\n--- Husky Configuration in package.json ---"
if grep -q '"husky":' package.json; then
  echo "✅ Husky configuration found in package.json:"
  grep -A 10 '"husky":' package.json
else
  echo "❌ No Husky configuration found in package.json"
fi

# Check if lint-staged is configured
echo -e "\n--- Lint-Staged Configuration ---"
if grep -q '"lint-staged":' package.json; then
  echo "✅ Lint-staged configuration found in package.json:"
  grep -A 10 '"lint-staged":' package.json
else
  echo "❌ No lint-staged configuration found in package.json"
fi

if [ -f ".lintstagedrc" ]; then
  echo "✅ .lintstagedrc file found:"
  cat .lintstagedrc
else
  echo "❌ No .lintstagedrc file found"
fi

# Check Git hooks directory
echo -e "\n--- Git Hooks Status ---"
if [ -d ".git/hooks" ]; then
  echo "Git hooks directory exists:"
  ls -la .git/hooks

  # Check if Husky has installed hooks
  if grep -q "husky" .git/hooks/pre-commit 2>/dev/null; then
    echo "✅ Husky has installed the pre-commit hook"
  else
    echo "❌ Husky has not installed the pre-commit hook"
  fi
else
  echo "❌ .git/hooks directory not found"
fi

echo -e "\n===== Recommendation ====="
echo "Based on the assessment, here's what you should consider:"

if [ -f ".huskyrc" ] && grep -q "disabled" .huskyrc; then
  echo "1. Your Husky hooks are currently DISABLED by the .huskyrc file we created earlier."
  echo "2. To re-enable Husky hooks with modern configuration, run:"
  echo "   npm uninstall husky && npm install --save-dev husky && npx husky install && npx husky add .husky/pre-commit 'npx lint-staged'"
fi

echo -e "\nTo test if pre-commit hooks are working:"
echo "1. Make a small change to any file"
echo "2. Try to commit it: git add . && git commit -m \"test hooks\""
echo "3. If you see linting or other checks running, hooks are working"
echo "4. If the commit happens immediately without checks, hooks are disabled"

echo -e "\n===== Assessment Complete ====="
