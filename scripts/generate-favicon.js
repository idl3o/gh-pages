#!/usr/bin/env node

/**
 * Favicon Generator
 * 
 * Creates a simple favicon placeholder
 */

const fs = require('fs');
const path = require('path');

// Simple SVG favicon - in production, use a real favicon generator
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#6366f1"/>
  <text x="16" y="20" font-family="Arial" font-size="18" fill="white" text-anchor="middle">W</text>
</svg>`;

// Create directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Write SVG favicon (as a placeholder)
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSvg);
console.log('Created placeholder favicon.svg');

console.log('\nNOTE: For production, generate a proper favicon.ico using a tool like:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://favicon.io/');
console.log('- https://www.favicon-generator.org/');
