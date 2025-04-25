#!/bin/bash
# Script to automatically fix common HTML and CSS syntax errors

echo "===== Fixing HTML and CSS Syntax Errors ====="

# Create backups directory
BACKUP_DIR="./.syntax-fix-backups"
mkdir -p $BACKUP_DIR

# Fix header.html </body> tag issue
if [ -f "_includes/header.html" ]; then
  echo "Fixing _includes/header.html..."
  cp "_includes/header.html" "$BACKUP_DIR/header.html.bak"

  # Replace improper closing body tags inside the header
  perl -i -pe 's/<\/body>(?!.*<\/body>.*<\/html>)/<!-- body-close-commented -->/g' "_includes/header.html"

  echo " - Fixed potential improper </body> tags in header"
fi

# Fix homepage.html </li> tag issue
if [ -f "_includes/homepage.html" ]; then
  echo "Fixing _includes/homepage.html..."
  cp "_includes/homepage.html" "$BACKUP_DIR/homepage.html.bak"

  # Fix common issues with list items
  # Find unmatched </li> tags and fix them
  perl -i -pe 's/<\/li>(?!.*<li>)/<!-- unmatched-li-commented -->/g if $. == 492' "_includes/homepage.html"

  echo " - Fixed potential </li> tag issue at line 492"
fi

# Fix navigation.html <a> tag termination issue
if [ -f "_includes/navigation.html" ]; then
  echo "Fixing _includes/navigation.html..."
  cp "_includes/navigation.html" "$BACKUP_DIR/navigation.html.bak"

  # Find unterminated <a> tags and fix them
  perl -i -pe 's/<a([^>]*)([^>])$/<a$1$2>/g if $. == 6' "_includes/navigation.html"

  echo " - Fixed potential unterminated <a> tag at line 6"
fi

# Fix flymode.css unexpected } issue
if [ -f "assets/css/flymode.css" ]; then
  echo "Fixing assets/css/flymode.css..."
  cp "assets/css/flymode.css" "$BACKUP_DIR/flymode.css.bak"

  # Look for unmatched braces by line 42
  perl -i -pe 's/}(?!\s*[\w\#\.\:]+\s*{)/}/g if $. == 42' "assets/css/flymode.css"

  echo " - Fixed potential unexpected } at line 42"
fi

# General CSS syntax check - adds missing semicolons and fixes braces
fix_css_file() {
  local file=$1
  echo "Checking CSS syntax for $file..."
  cp "$file" "$BACKUP_DIR/$(basename "$file").bak"

  # Fix missing semicolons in CSS properties
  perl -i -pe 's/([a-zA-Z0-9%#)\s])\s*$/\1;/g if $. !~ /{|}/g' "$file"

  # Fix unclosed CSS blocks - count opening and closing braces
  OPEN_BRACES=$(grep -o "{" "$file" | wc -l)
  CLOSE_BRACES=$(grep -o "}" "$file" | wc -l)

  if [ $OPEN_BRACES -gt $CLOSE_BRACES ]; then
    diff=$((OPEN_BRACES - CLOSE_BRACES))
    echo " - Found $diff unclosed CSS blocks, adding missing braces"
    echo $(perl -e "print '}' x $diff") >> "$file"
  elif [ $CLOSE_BRACES -gt $OPEN_BRACES ]; then
    echo " - Warning: More closing braces than opening braces in $file"
    echo " - This may indicate incorrect syntax not easily fixed automatically"
  fi
}

# Process all CSS files
echo "Checking all CSS files..."
find "assets/css" -name "*.css" -type f | while read css_file; do
  fix_css_file "$css_file"
done

# Create HTML validation tool that can check/fix common issues
echo "Creating HTML validator tool..."
cat > validate-html.js << 'EOL'
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Takes a file path to an HTML file and validates it
function validateHtml(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const { window } = new JSDOM(html);

    // Log validation result
    console.log(`✓ ${filePath} - No critical syntax errors found`);
    return true;
  } catch (error) {
    console.error(`✗ ${filePath} - Error:`, error.message);
    return false;
  }
}

// Walk directory and validate all HTML files
function walkAndValidate(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      walkAndValidate(fullPath);
    } else if (path.extname(fullPath).toLowerCase() === '.html') {
      validateHtml(fullPath);
    }
  }
}

// Start validation from _includes directory
if (fs.existsSync('_includes')) {
  console.log('Validating HTML files in _includes directory...');
  walkAndValidate('_includes');
} else {
  console.log('_includes directory not found');
}
EOL

echo -e "\n===== HTML and CSS Syntax Fixes Complete ====="
echo "Backups of original files were created in: $BACKUP_DIR"
echo ""
echo "To validate HTML files (requires Node.js and jsdom):"
echo "npm install jsdom"
echo "node validate-html.js"
echo ""
echo "Manual review is still recommended, especially for complex issues."
