#!/usr/bin/env node

/**
 * License Header Adder
 * 
 * This script adds license header comments to files that don't already have them.
 * It uses the license header template from license-header.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Read the license header template
const HEADER_PATH = path.join(__dirname, 'license-header.js');
const LICENSE_HEADER = fs.readFileSync(HEADER_PATH, 'utf8');

// File patterns to include
const FILE_PATTERNS = [
  'controllers/**/*.js',
  'models/**/*.js',
  'services/**/*.js',
  'assets/js/**/*.js',
  'assets/js/**/*.ts',
  'scripts/**/*.js',
  '!scripts/license-header.js',
  '!scripts/add-license-headers.js',
  '!node_modules/**',
  '!dist/**',
  '!**/vendor/**'
];

// Check if a file already has a license header
function hasLicenseHeader(content) {
  return content.includes('@license') || 
         (content.includes('Copyright') && content.includes('MIT license'));
}

// Add the license header to a file
function addHeaderToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if file already has a license header
    if (hasLicenseHeader(content)) {
      return { status: 'skipped', path: filePath };
    }
    
    // Add header based on file type
    let newContent;
    if (filePath.endsWith('.css')) {
      newContent = LICENSE_HEADER.replace(/\/\*\*/g, '/*').replace(/\*\//g, '*/') + '\n\n' + content;
    } else if (filePath.endsWith('.html')) {
      newContent = '<!--\n' + LICENSE_HEADER.replace(/\/\*\*/g, '').replace(/\*\//g, '') + '\n-->\n\n' + content;
    } else {
      newContent = LICENSE_HEADER + '\n\n' + content;
    }
    
    fs.writeFileSync(filePath, newContent);
    return { status: 'updated', path: filePath };
  } catch (err) {
    return { status: 'error', path: filePath, error: err.message };
  }
}

// Main function to process all files
async function main() {
  console.log('Adding license headers to source files...');
  
  const files = await glob.glob(FILE_PATTERNS, { cwd: path.join(__dirname, '..') });
  
  const results = {
    updated: [],
    skipped: [],
    errors: []
  };
  
  for (const relativeFilePath of files) {
    const filePath = path.join(__dirname, '..', relativeFilePath);
    const result = addHeaderToFile(filePath);
    
    if (result.status === 'updated') {
      results.updated.push(result.path);
    } else if (result.status === 'skipped') {
      results.skipped.push(result.path);
    } else {
      results.errors.push({ path: result.path, error: result.error });
    }
  }
  
  console.log(`\nLicense headers added to ${results.updated.length} files`);
  console.log(`Skipped ${results.skipped.length} files (already have headers)`);
  
  if (results.errors.length > 0) {
    console.error(`\nEncountered ${results.errors.length} errors:`);
    results.errors.forEach(err => {
      console.error(`- ${err.path}: ${err.error}`);
    });
  }
}

main().catch(err => {
  console.error('An error occurred:', err);
  process.exit(1);
});