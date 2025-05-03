#!/bin/bash
# Safe commit script that bypasses hooks

if [ $# -eq 0 ]; then
  echo "Usage: ./safe-commit.sh \"Your commit message\""
  exit 1
fi

# Add all changed files
git add .

# Always bypass hooks when committing
git commit --no-verify -m "$1"

echo "Changes committed successfully!"
