#!/usr/bin/env node

/**
 * Project Initializer
 * 
 * This script sets up the basic project structure and generates placeholder files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define project directories
const directories = [
    'assets/css',
    'assets/js',
    'assets/images',
    'assets/images/team',
    'docs',
    'docs/root',
    'docs/contracts',
    'docs/resources',
    'docs/analysis',
    'whitepaper',
    'career',
    '_includes',
    '_layouts'
];

// Create directories
console.log('Creating directory structure...');
directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created: ${dir}`);
    } else {
        console.log(`Already exists: ${dir}`);
    }
});

// Run placeholder generation scripts
console.log('\nGenerating placeholder images...');
try {
    // Run the placeholder generation scripts
    execSync('node scripts/generate-placeholders.js', { stdio: 'inherit' });
    execSync('node scripts/generate-platform-diagram.js', { stdio: 'inherit' });
    execSync('node scripts/generate-favicon.js', { stdio: 'inherit' });
} catch (error) {
    console.error('Error running placeholder scripts:', error);
}

console.log('\nProject structure initialized!');
console.log('\nNext steps:');
console.log('1. Edit _config.yml to set up your GitHub Pages configuration');
console.log('2. Update placeholder images with actual content');
console.log('3. Complete documentation pages');
console.log('4. Test locally and then commit to GitHub');
