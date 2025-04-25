#!/bin/bash
# Script to rebuild main deployment from backup-functional-demo branch

BACKUP_BRANCH="origin/backup-functional-demo"
CURRENT_BRANCH=$(git branch --show-current)

echo "===== Rebuilding Main from $BACKUP_BRANCH ====="
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "WARNING: You are not on the main branch. It's recommended to run this from main."
  echo "Would you like to continue anyway? (y/n)"
  read CONTINUE
  if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
    echo "Exiting. Please checkout main branch first."
    exit 1
  fi
fi

# Create backup of current state
echo -e "\n===== Creating backup of current state ====="
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="main_backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
echo "Backing up current files to $BACKUP_DIR/"
rsync -av --exclude="$BACKUP_DIR" --exclude=".git" --exclude="node_modules" ./ "$BACKUP_DIR/"
echo "Backup created at $BACKUP_DIR/"

# Identify missing project structure
echo -e "\n===== Identifying project structure from $BACKUP_BRANCH ====="
PROJECT_DIRS=$(git ls-tree -r --name-only $BACKUP_BRANCH | grep -v "^_site/" | xargs -I{} dirname {} | sort -u | uniq)
echo "Creating directory structure..."
for DIR in $PROJECT_DIRS; do
  if [ "$DIR" != "." ]; then
    mkdir -p "$DIR"
    echo "Created: $DIR"
  fi
done

# Identify files to restore
echo -e "\n===== Identifying files to restore ====="
# Find files that exist in backup branch but not in main
echo "Files in $BACKUP_BRANCH that are missing from main:"
MISSING_FILES=$(git diff --name-only --diff-filter=D main..$BACKUP_BRANCH | grep -v "^_site/")

# Create a temporary file listing important files
cat > important_files.txt << EOF
pom.xml
build.gradle
settings.gradle
package.json
package-lock.json
webpack.config.js
.gitignore
README.md
LICENSE
src/
lib/
app/
api/
server/
Gemfile
Gemfile.lock
.github/workflows/
EOF

# First restore important configuration and structure files
echo -e "\n===== Restoring important configuration and structure files ====="
for FILE in $(grep -f important_files.txt <<< "$MISSING_FILES"); do
  if [ -n "$FILE" ]; then
    echo "Restoring: $FILE"
    git checkout $BACKUP_BRANCH -- "$FILE"
  fi
done

# Restore Java files
echo -e "\n===== Restoring Java files ====="
JAVA_FILES=$(git diff --name-only --diff-filter=D main..$BACKUP_BRANCH -- "*.java")
if [ -n "$JAVA_FILES" ]; then
  echo "Restoring Java files:"
  echo "$JAVA_FILES" | while read FILE; do
    echo "Restoring: $FILE"
    git checkout $BACKUP_BRANCH -- "$FILE"
  done
  echo "Java files restored."
else
  echo "No Java files to restore."
fi

# Restore remaining project files (excluding the ones we've already processed)
echo -e "\n===== Restoring remaining project files ====="
REMAINING_FILES=$(comm -23 <(echo "$MISSING_FILES" | sort) <(echo "$JAVA_FILES" | sort))
if [ -n "$REMAINING_FILES" ]; then
  echo "Restoring remaining files:"
  echo "$REMAINING_FILES" | while read FILE; do
    # Skip already restored files
    if ! grep -q "^$FILE$" <<< "$(git diff --name-only)"; then
      echo "Restoring: $FILE"
      git checkout $BACKUP_BRANCH -- "$FILE"
    fi
  done
  echo "Remaining files restored."
else
  echo "No remaining files to restore."
fi

# Handle potential conflicts
echo -e "\n===== Handling potential conflicts ====="
if [ -n "$(git ls-files -u)" ]; then
  echo "Merge conflicts detected. Please resolve them manually."
  echo "Files with conflicts:"
  git ls-files -u | cut -f 2 | sort | uniq
else
  echo "No conflicts detected."
fi

# Update GitHub workflow
echo -e "\n===== Updating GitHub workflow ====="
if [ -f ".github/workflows/github-pages.yml" ]; then
  echo "GitHub Pages workflow already exists."
else
  echo "GitHub Pages workflow not found. Creating..."
  mkdir -p .github/workflows
  cat > .github/workflows/github-pages.yml << EOF
name: GitHub Pages

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Setup Java JDK
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: maven

      - name: Build with Maven (if needed)
        run: |
          if [ -f "pom.xml" ]; then
            mvn -B package --file pom.xml
          else
            echo "No pom.xml found, skipping Maven build"
          fi

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Build with Jekyll
        uses: jekyll/jekyll-build-action@v1.0.0
        with:
          source: ./
          destination: ./_site

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
EOF
  echo "GitHub Pages workflow created."
fi

# Summary of changes
echo -e "\n===== Summary of Changes ====="
git status

echo -e "\n===== Rebuild Process Completed ====="
echo "To commit these changes, run:"
echo "git add ."
echo "git commit -m \"Rebuild from backup-functional-demo\""
echo "git push origin main"
echo -e "\nA backup of your previous state is available in: $BACKUP_DIR/"
echo "If something went wrong, you can restore from this backup."
