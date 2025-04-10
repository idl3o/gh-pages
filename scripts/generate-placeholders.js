#!/usr/bin/env node

/**
 * Placeholder Image Generator
 * 
 * This script generates placeholder images for the project
 */

const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
    const dirname = path.dirname(dirPath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    
    ensureDirectoryExists(dirname);
    fs.mkdirSync(dirname);
}

// Generate SVG placeholder with text
function generateSvgPlaceholder(width, height, text, backgroundColor = '#6366f1') {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${backgroundColor}"/>
    <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

// Generate PNG placeholder with text (simple SVG base64 encoded)
function generatePngPlaceholder(width, height, text) {
    // This is not a real PNG, but a base64 encoded SVG as a placeholder for demo purposes
    const svg = generateSvgPlaceholder(width, height, text);
    const base64 = Buffer.from(svg).toString('base64');
    
    // Write a text file with instructions
    return `This is a placeholder for a ${width}x${height} PNG image.
In a real implementation, you would generate or download an actual PNG file.

You can use online services like:
- https://placeholder.com
- https://placeholder.pics
- https://picsum.photos

Or use the base64 encoded SVG below in an <img> tag:

<img src="data:image/svg+xml;base64,${base64}" alt="${text}" width="${width}" height="${height}">
`;
}

// Create placeholder files
const placeholders = [
    {
        path: 'assets/images/logo.svg',
        content: generateSvgPlaceholder(200, 50, 'STREAM Logo'),
        type: 'svg'
    },
    {
        path: 'assets/images/404-illustration.svg',
        content: generateSvgPlaceholder(400, 300, '404 Not Found'),
        type: 'svg'
    },
    {
        path: 'assets/images/contract-architecture.png',
        content: generatePngPlaceholder(800, 600, 'Contract Architecture'),
        type: 'text'
    },
    {
        path: 'assets/images/stream-access-diagram.png',
        content: generatePngPlaceholder(800, 600, 'Stream Access Diagram'),
        type: 'text'
    }
];

// Team member photos
const teamMembers = [
    'alex-chen',
    'sarah-patel',
    'david-rodriguez',
    'marcus-kim',
    'lucia-morales',
    'raj-patel',
    'tanya-lee'
];

teamMembers.forEach(member => {
    placeholders.push({
        path: `assets/images/team/${member}.jpg`,
        content: generatePngPlaceholder(300, 300, member.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')),
        type: 'text'
    });
});

// Write files
placeholders.forEach(placeholder => {
    const filePath = path.join(__dirname, '..', placeholder.path);
    
    ensureDirectoryExists(filePath);
    
    if (placeholder.type === 'svg') {
        fs.writeFileSync(filePath, placeholder.content);
        console.log(`Created SVG placeholder: ${placeholder.path}`);
    } else {
        fs.writeFileSync(filePath, placeholder.content);
        console.log(`Created placeholder instructions: ${placeholder.path}`);
    }
});

console.log('\nPlaceholder generation complete!');
console.log('Note: For production, replace placeholders with actual images.');
