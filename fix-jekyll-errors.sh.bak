#!/bin/bash
# Script to fix Jekyll Liquid template errors

echo "===== Fixing Jekyll Template Errors ====="

# Fix common Liquid syntax errors in templates
find ./_layouts -type f -name "*.html" -exec sed -i.bak 's/page\.url="" ="doc\.url"/page.url == doc.url/g' {} \;

# Clean up backup files
find ./_layouts -name "*.bak" -delete

echo "===== Jekyll Template Fixes Complete ====="
echo ""
echo "Run this before your next build to fix Liquid syntax errors."
