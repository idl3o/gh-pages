#!/bin/bash

# Script to fix common markdown linting issues

echo "Fixing markdown lint issues..."

# Count total markdown files
MD_FILES=$(find . -type f -name "*.md" | wc -l)
echo "Found $MD_FILES markdown files"

# Fix issues
COUNT=0
FIXED=0

for file in $(find . -type f -name "*.md"); do
  COUNT=$((COUNT + 1))
  echo "Processing ($COUNT/$MD_FILES): $file"

  # Create a temp file
  TEMP_FILE="${file}.tmp"

  # Fix common linting issues

  # 1. Ensure exactly one newline at end of file
  cat "$file" | sed -e '$a\' > "$TEMP_FILE"

  # 2. Remove trailing whitespace
  sed -i 's/[ \t]*$//' "$TEMP_FILE"

  # 3. Ensure consistent heading syntax (##, not ##<space>)
  sed -i 's/^#\{1,6\}\([^ ]\)/#\1/' "$TEMP_FILE"
  sed -i 's/^#\{1,6\}$//' "$TEMP_FILE"

  # 4. Add space after heading markers (# Title)
  sed -i 's/^#\{1,6\}\([^ ]\)/#\1/' "$TEMP_FILE"
  sed -i 's/^#\{1,6\}$//' "$TEMP_FILE"

  # 5. Convert tabs to spaces in indentation
  sed -i 's/^\t/    /g' "$TEMP_FILE"

  # 6. Ensure blank lines before headings
  sed -i '/^#/{/./!d;x;s/^\n$//;x;i \ ' "$TEMP_FILE"

  # 7. Fix unordered list items (ensure space after marker)
  sed -i 's/^[ ]*[-+*]\([^ ]\)/- \1/g' "$TEMP_FILE"

  # 8. Fix ordered list items (ensure space after marker)
  sed -i 's/^[ ]*[0-9]\+\.\([^ ]\)/\1. \2/g' "$TEMP_FILE"

  # 9. Remove multiple blank lines
  sed -i '/^$/N;/^\n$/D' "$TEMP_FILE"

  # 10. Fix code block fences (ensure proper spacing)
  sed -i 's/^```\([^ ]*\)$/```\1/g' "$TEMP_FILE"

  # Check if changes were made
  if ! cmp -s "$file" "$TEMP_FILE"; then
    mv "$TEMP_FILE" "$file"
    FIXED=$((FIXED + 1))
    echo "Fixed issues in: $file"
  else
    rm "$TEMP_FILE"
  fi
done

echo "Completed fixing markdown issues in $FIXED out of $MD_FILES files"
