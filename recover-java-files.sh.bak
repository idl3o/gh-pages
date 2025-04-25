#!/bin/bash
# Script to help recover Java files from git history

# List all commits that modified Java files
echo "Commits that modified Java files:"
git log --all --name-status -- "*.java"

# Find deleted Java files
echo -e "\nDeleted Java files:"
git log --diff-filter=D --summary | grep "\.java"

# To recover a specific file from a previous commit:
# git checkout <commit-hash> -- path/to/your/JavaFile.java
