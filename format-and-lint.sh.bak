#!/bin/bash
# Script to format code and fix linting issues

echo "===== Running Code Formatters and Linters ====="

# Check if required tools are installed
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

# Install required dependencies if not already installed
echo "Checking for required dependencies..."
npm list --depth=0 prettier eslint eslint-config-prettier &> /dev/null
if [ $? -ne 0 ]; then
    echo "Installing required dependencies..."
    npm install --save-dev prettier eslint eslint-config-prettier
fi

# Format files with Prettier
echo "Formatting files with Prettier..."
npx prettier --write "**/*.{js,jsx,json,md,html,css}" --ignore-path .eslintignore

# Fix linting issues with ESLint
echo "Fixing linting issues with ESLint..."
npx eslint . --fix

echo "===== Formatting and Linting Complete ====="
echo ""
echo "Note: Some errors may require manual fixes."
echo "Check the output above for any remaining issues."
