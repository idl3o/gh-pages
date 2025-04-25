#!/bin/bash
# Script to search backup branches for missing functionality

echo "=== Available backup branches ==="
echo "1) remotes/origin/backup-april-2025"
echo "2) remotes/origin/backup-functional-demo"

echo -e "\nWhich backup branch would you like to check? (Enter 1 or 2):"
read CHOICE

if [ "$CHOICE" == "1" ]; then
  BACKUP_BRANCH="origin/backup-april-2025"
elif [ "$CHOICE" == "2" ]; then
  BACKUP_BRANCH="origin/backup-functional-demo"
else
  echo "Invalid choice. Exiting."
  exit 1
fi

echo "Selected branch: $BACKUP_BRANCH"

# Check if we can access the branch
if ! git rev-parse --verify $BACKUP_BRANCH >/dev/null 2>&1; then
  echo "Cannot access $BACKUP_BRANCH. Please check if the branch exists and you have access."
  exit 1
fi

echo -e "\n=== Files in $BACKUP_BRANCH that are missing from main ==="
git diff --name-only --diff-filter=D main..$BACKUP_BRANCH

# Find Java files that exist in backup branch but not in main
echo -e "\n=== Java files in $BACKUP_BRANCH that are missing from main ==="
MISSING_JAVA=$(git diff --name-only --diff-filter=D main..$BACKUP_BRANCH -- "*.java")
if [ -z "$MISSING_JAVA" ]; then
  echo "No Java files missing from main"
else
  echo "$MISSING_JAVA"

  # Ask if user wants to restore these Java files
  echo -e "\nDo you want to restore these Java files? (y/n)"
  read RESTORE
  if [ "$RESTORE" == "y" ] || [ "$RESTORE" == "Y" ]; then
    echo "Restoring Java files..."
    git diff --name-only --diff-filter=D main..$BACKUP_BRANCH -- "*.java" | xargs -I{} git checkout $BACKUP_BRANCH -- {}
    echo "Java files restored."
  fi
fi

# Check for other important files
echo -e "\n=== Important infrastructure files check ==="
IMPORTANT_FILES=("pom.xml" "build.gradle" "settings.gradle" "package.json" "webpack.config.js")

for FILE in "${IMPORTANT_FILES[@]}"; do
  if git ls-tree -r --name-only $BACKUP_BRANCH | grep -q "$FILE"; then
    if [ ! -f "$FILE" ]; then
      echo "Found $FILE in $BACKUP_BRANCH that is missing from main."
      echo "To restore: git checkout $BACKUP_BRANCH -- $FILE"

      # Show file content preview
      echo -e "\n$FILE preview from $BACKUP_BRANCH:"
      git show "$BACKUP_BRANCH:$FILE" | head -n 10
      echo "..."

      # Ask if user wants to restore this file
      echo -e "\nDo you want to restore $FILE? (y/n)"
      read RESTORE_FILE
      if [ "$RESTORE_FILE" == "y" ] || [ "$RESTORE_FILE" == "Y" ]; then
        git checkout $BACKUP_BRANCH -- $FILE
        echo "$FILE restored."
      fi
    fi
  fi
done

# Find and list directories with Java files in backup branch
echo -e "\n=== Java project directories in $BACKUP_BRANCH ==="
JAVA_DIRS=$(git ls-tree -r --name-only $BACKUP_BRANCH | grep "\.java$" | xargs -I{} dirname {} | sort -u)
if [ -z "$JAVA_DIRS" ]; then
  echo "No Java directories found."
else
  echo "$JAVA_DIRS"

  echo -e "\nDo you want to restore the complete Java project structure? (y/n)"
  read RESTORE_STRUCTURE
  if [ "$RESTORE_STRUCTURE" == "y" ] || [ "$RESTORE_STRUCTURE" == "Y" ]; then
    for DIR in $JAVA_DIRS; do
      mkdir -p "$DIR"
      git diff --name-only --diff-filter=D main..$BACKUP_BRANCH -- "$DIR/*.java" | xargs -I{} git checkout $BACKUP_BRANCH -- {}
    done
    echo "Java project structure restored."
  fi
fi

echo -e "\n=== Recovery process completed ==="
echo "You may need to review the restored files and adjust your project configuration accordingly."
