#!/usr/bin/env node

/**
 * Platform Architecture Diagram Generator
 * 
 * Creates placeholder diagram images for the documentation
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

// Generate SVG diagram with placeholder architecture elements
function generatePlatformDiagram() {
    return `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="100%" height="100%" fill="#f0f4f8"/>
    
    <!-- Title -->
    <text x="400" y="40" font-family="Arial" font-size="24" fill="#111827" text-anchor="middle" font-weight="bold">Web3 Crypto Streaming Service Architecture</text>
    
    <!-- Content Creator Layer -->
    <rect x="100" y="100" width="600" height="80" rx="5" fill="#6366f1" fill-opacity="0.2" stroke="#6366f1" stroke-width="2"/>
    <text x="400" y="145" font-family="Arial" font-size="18" fill="#111827" text-anchor="middle" font-weight="bold">Content Creator Layer</text>
    
    <!-- Inside Creator Layer -->
    <rect x="150" y="120" width="120" height="40" rx="5" fill="white" stroke="#6366f1" stroke-width="1"/>
    <text x="210" y="145" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Upload Studio</text>
    
    <rect x="330" y="120" width="120" height="40" rx="5" fill="white" stroke="#6366f1" stroke-width="1"/>
    <text x="390" y="145" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Analytics</text>
    
    <rect x="510" y="120" width="120" height="40" rx="5" fill="white" stroke="#6366f1" stroke-width="1"/>
    <text x="570" y="145" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Monetization</text>
    
    <!-- Smart Contract Layer -->
    <rect x="100" y="220" width="600" height="80" rx="5" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="2"/>
    <text x="400" y="265" font-family="Arial" font-size="18" fill="#111827" text-anchor="middle" font-weight="bold">Smart Contract Layer</text>
    
    <!-- Inside Smart Contract Layer -->
    <rect x="130" y="240" width="120" height="40" rx="5" fill="white" stroke="#10b981" stroke-width="1"/>
    <text x="190" y="265" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Access Control</text>
    
    <rect x="280" y="240" width="120" height="40" rx="5" fill="white" stroke="#10b981" stroke-width="1"/>
    <text x="340" y="265" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Payment</text>
    
    <rect x="430" y="240" width="120" height="40" rx="5" fill="white" stroke="#10b981" stroke-width="1"/>
    <text x="490" y="265" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Governance</text>
    
    <rect x="580" y="240" width="90" height="40" rx="5" fill="white" stroke="#10b981" stroke-width="1"/>
    <text x="625" y="265" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Registry</text>
    
    <!-- Storage Layer -->
    <rect x="100" y="340" width="600" height="80" rx="5" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
    <text x="400" y="385" font-family="Arial" font-size="18" fill="#111827" text-anchor="middle" font-weight="bold">Storage Layer</text>
    
    <!-- Inside Storage Layer -->
    <rect x="150" y="360" width="120" height="40" rx="5" fill="white" stroke="#f59e0b" stroke-width="1"/>
    <text x="210" y="385" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">IPFS</text>
    
    <rect x="330" y="360" width="120" height="40" rx="5" fill="white" stroke="#f59e0b" stroke-width="1"/>
    <text x="390" y="385" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">CDN</text>
    
    <rect x="510" y="360" width="120" height="40" rx="5" fill="white" stroke="#f59e0b" stroke-width="1"/>
    <text x="570" y="385" font-family="Arial" font-size="14" fill="#111827" text-anchor="middle">Metadata</text>
    
    <!-- Connectors -->
    <line x1="400" y1="180" x2="400" y2="220" stroke="#111827" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="400" y1="300" x2="400" y2="340" stroke="#111827" stroke-width="2" stroke-dasharray="5,5"/>
    
    <!-- Legend -->
    <rect x="600" y="440" width="15" height="15" fill="#6366f1" fill-opacity="0.2" stroke="#6366f1" stroke-width="2"/>
    <text x="625" y="452" font-family="Arial" font-size="12" fill="#111827">Client</text>
    
    <rect x="600" y="460" width="15" height="15" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="2"/>
    <text x="625" y="472" font-family="Arial" font-size="12" fill="#111827">Blockchain</text>
    
    <rect x="600" y="480" width="15" height="15" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
    <text x="625" y="492" font-family="Arial" font-size="12" fill="#111827">Infrastructure</text>
</svg>`;
}

// Main execution
const outputPath = path.join(__dirname, '..', 'assets', 'images', 'platform-architecture.png');
ensureDirectoryExists(outputPath);

// Write SVG as placeholder (in a real project, convert to PNG)
const svgContent = generatePlatformDiagram();
const svgPath = path.join(__dirname, '..', 'assets', 'images', 'platform-architecture.svg');

fs.writeFileSync(svgPath, svgContent);
console.log(`Created SVG diagram: ${svgPath}`);

// Write a placeholder note for the PNG version
const pngNote = `This is a placeholder for platform architecture diagram.
In a production environment, this would be a properly rendered PNG image.

The SVG version of this diagram is available at: ../assets/images/platform-architecture.svg`;

fs.writeFileSync(outputPath, pngNote);
console.log(`Created PNG placeholder note: ${outputPath}`);

console.log('\nDiagram generation complete!');
