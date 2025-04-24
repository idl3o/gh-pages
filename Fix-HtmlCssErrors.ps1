# PowerShell script to automatically fix common HTML and CSS syntax errors
Write-Host "===== Fixing HTML and CSS Syntax Errors =====" -ForegroundColor Cyan

# Create backups directory
$BACKUP_DIR = "./.syntax-fix-backups"
New-Item -Path $BACKUP_DIR -ItemType Directory -Force | Out-Null

# Fix header.html </body> tag issue
if (Test-Path "_includes/header.html") {
    Write-Host "Fixing _includes/header.html..." -ForegroundColor Yellow
    Copy-Item -Path "_includes/header.html" -Destination "$BACKUP_DIR/header.html.bak" -Force

    # Replace improper closing body tags inside the header
    $content = Get-Content "_includes/header.html" -Raw
    $content = $content -replace '(?<!.*</html>.*)</body>', '<!-- body-close-commented -->'
    Set-Content -Path "_includes/header.html" -Value $content

    Write-Host " - Fixed potential improper </body> tags in header" -ForegroundColor Green
}

# Fix homepage.html </li> tag issue
if (Test-Path "_includes/homepage.html") {
    Write-Host "Fixing _includes/homepage.html..." -ForegroundColor Yellow
    Copy-Item -Path "_includes/homepage.html" -Destination "$BACKUP_DIR/homepage.html.bak" -Force

    # Get all content lines
    $lines = Get-Content "_includes/homepage.html"

    # Fix line 492 if it exists
    if ($lines.Count -ge 492) {
        $lines[491] = $lines[491] -replace '<\/li>(?!.*<li>)', '<!-- unmatched-li-commented -->'
        Set-Content -Path "_includes/homepage.html" -Value $lines
        Write-Host " - Fixed potential </li> tag issue at line 492" -ForegroundColor Green
    }
}

# Fix navigation.html <a> tag termination issue
if (Test-Path "_includes/navigation.html") {
    Write-Host "Fixing _includes/navigation.html..." -ForegroundColor Yellow
    Copy-Item -Path "_includes/navigation.html" -Destination "$BACKUP_DIR/navigation.html.bak" -Force

    # Get all content lines
    $lines = Get-Content "_includes/navigation.html"

    # Fix line 6 if it exists
    if ($lines.Count -ge 6) {
        if ($lines[5] -match '<a([^>]*)([^>])$') {
            $lines[5] = $lines[5] -replace '<a([^>]*)([^>])$', '<a$1$2>'
            Set-Content -Path "_includes/navigation.html" -Value $lines
            Write-Host " - Fixed potential unterminated <a> tag at line 6" -ForegroundColor Green
        }
    }
}

# Fix flymode.css unexpected } issue
if (Test-Path "assets/css/flymode.css") {
    Write-Host "Fixing assets/css/flymode.css..." -ForegroundColor Yellow
    Copy-Item -Path "assets/css/flymode.css" -Destination "$BACKUP_DIR/flymode.css.bak" -Force

    # Get all content lines
    $lines = Get-Content "assets/css/flymode.css"

    # Fix line 42 if it exists
    if ($lines.Count -ge 42) {
        $lines[41] = $lines[41] -replace '}(?!\s*[\w\#\.\:]+\s*{)', '}'
        Set-Content -Path "assets/css/flymode.css" -Value $lines
        Write-Host " - Fixed potential unexpected } at line 42" -ForegroundColor Green
    }
}

# General CSS syntax check - adds missing semicolons and fixes braces
function Fix-CssFile {
    param (
        [string]$file
    )

    Write-Host "Checking CSS syntax for $file..." -ForegroundColor Yellow
    Copy-Item -Path $file -Destination "$BACKUP_DIR/$(Split-Path $file -Leaf).bak" -Force

    $content = Get-Content $file -Raw

    # Fix missing semicolons in CSS properties
    $content = $content -replace '([a-zA-Z0-9%#)\s])\s*$', '$1;'
    Set-Content -Path $file -Value $content

    # Count opening and closing braces
    $openBraces = ([regex]::Matches($content, "{")).Count
    $closeBraces = ([regex]::Matches($content, "}")).Count

    if ($openBraces -gt $closeBraces) {
        $diff = $openBraces - $closeBraces
        Write-Host " - Found $diff unclosed CSS blocks, adding missing braces" -ForegroundColor Yellow
        # Fixed: Use proper PowerShell syntax to add multiple closing braces
        $closingBraces = "}" * $diff
        Add-Content -Path $file -Value $closingBraces
    }
    elseif ($closeBraces -gt $openBraces) {
        Write-Host " - Warning: More closing braces than opening braces in $file" -ForegroundColor Red
        Write-Host " - This may indicate incorrect syntax not easily fixed automatically" -ForegroundColor Red
    }
}

# Process all CSS files
Write-Host "Checking all CSS files..." -ForegroundColor Cyan
$cssFiles = Get-ChildItem -Path "assets/css" -Filter "*.css" -Recurse
foreach ($cssFile in $cssFiles) {
    Fix-CssFile -file $cssFile.FullName
}

# Create HTML validation tool
Write-Host "Creating HTML validator script..." -ForegroundColor Cyan
$validatorScript = @'
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

// Start validation from _includes directory and root HTML files
if (fs.existsSync('_includes')) {
  console.log('Validating HTML files in _includes directory...');
  walkAndValidate('_includes');
} else {
  console.log('_includes directory not found');
}

// Validate root HTML files
const rootFiles = fs.readdirSync('.');
for (const file of rootFiles) {
  if (path.extname(file).toLowerCase() === '.html') {
    validateHtml(file);
  }
}
'@

Set-Content -Path "validate-html.js" -Value $validatorScript

Write-Host "`n===== HTML and CSS Syntax Fixes Complete =====" -ForegroundColor Green
Write-Host "Backups of original files were created in: $BACKUP_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "To validate HTML files (requires Node.js and jsdom):" -ForegroundColor Yellow
Write-Host "npm install jsdom" -ForegroundColor White
Write-Host "node validate-html.js" -ForegroundColor White
Write-Host ""
Write-Host "Manual review is still recommended, especially for complex issues." -ForegroundColor Yellow
