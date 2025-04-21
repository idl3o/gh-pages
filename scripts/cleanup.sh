#!/bin/bash
# Cleanup script to consolidate redundant files and organize the project

# Create backup of current state
echo "Creating backup of current state..."
mkdir -p ./backups/$(date +%Y%m%d)
cp package.json ./backups/$(date +%Y%m%d)/
cp -r ./_config.yml ./backups/$(date +%Y%m%d)/

# Consolidate duplicate configuration files
echo "Consolidating configuration files..."

# Remove backup duplicates if the original exists
find . -name "*backup*" -o -name "* 2.*" -o -name "*(1)*" | while read file; do
  base_file=$(echo "$file" | sed 's/ 2\././;s/ (1)//;s/\.backup$//')
  if [ -f "$base_file" ]; then
    echo "Removing duplicate: $file (original: $base_file exists)"
    rm "$file"
  fi
done

# Consolidate scripts
echo "Organizing scripts..."
mkdir -p ./scripts/{build,deploy,dev,utils}

# Move build scripts
mv build-and-deploy.sh ./scripts/build/ 2>/dev/null
mv run-build.cmd ./scripts/build/ 2>/dev/null
mv run-app.cmd ./scripts/build/ 2>/dev/null

# Move deploy scripts
mv deploy-gh-pages.sh ./scripts/deploy/ 2>/dev/null
mv deploy-gh-pages.cmd ./scripts/deploy/ 2>/dev/null

# Move utility scripts
mv fix-*.sh ./scripts/utils/ 2>/dev/null
mv ensure-dependencies.sh ./scripts/utils/ 2>/dev/null
mv format-and-lint.sh ./scripts/utils/ 2>/dev/null

echo "Cleanup complete!"