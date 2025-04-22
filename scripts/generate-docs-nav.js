/**
 * Documentation Navigation Generator
 * Creates a navigation file for documentation pages with proper hyperlinks
 */

const fs = require('fs');
const path = require('path');

const docsDir = path.join(process.cwd(), 'docs');
const navFile = path.join(docsDir, 'nav.html');

// Documentation structure with links
const docStructure = {
  Overview: 'index.html',
  Whitepaper: 'whitepaper.html',
  Architecture: 'architecture.html',
  'Smart Contracts': 'contracts.html',
  'API Reference': {
    Overview: 'api-reference.html',
    Authentication: 'authentication.html',
    Endpoints: {
      Content: 'endpoints/content.html',
      User: 'endpoints/user.html',
      Payment: 'endpoints/payment.html'
    }
  },
  'SDK Documentation': 'sdk-documentation.html',
  'Developer Guides': 'developer-guides.html'
};

// Create navigation HTML
function generateNavHTML(structure, level = 0) {
  const indent = ' '.repeat(level * 2);
  let html = `${indent}<ul class="nav-level-${level}">\n`;

  for (const [label, value] of Object.entries(structure)) {
    if (typeof value === 'string') {
      // It's a link
      html += `${indent}  <li><a href="${value}">${label}</a></li>\n`;
    } else {
      // It's a nested menu
      html += `${indent}  <li class="has-submenu">\n`;
      html += `${indent}    <span>${label}</span>\n`;
      html += generateNavHTML(value, level + 1);
      html += `${indent}  </li>\n`;
    }
  }

  html += `${indent}</ul>\n`;
  return html;
}

// Generate complete nav HTML
function generateCompleteNav() {
  const navHTML = generateNavHTML(docStructure);

  const completeNavHTML = `<!-- Documentation Navigation -->
<div class="docs-navigation">
  <div class="nav-header">
    <h3>StreamChain Docs</h3>
  </div>
  <nav class="nav-container">
${navHTML}
  </nav>
</div>
`;

  fs.writeFileSync(navFile, completeNavHTML);
  console.log(`Navigation file created at ${navFile}`);

  // Also create a simple CSS for the navigation
  const cssDir = path.join(docsDir, 'assets', 'css');
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }

  const navCSSFile = path.join(cssDir, 'docs-nav.css');
  const navCSS = `/* Documentation Navigation Styles */
.docs-navigation {
  width: 250px;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
}

.nav-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.nav-header h3 {
  margin: 0;
  color: #333;
}

.nav-container {
  padding: 15px 0;
}

.nav-container ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-container li {
  margin: 0;
  padding: 0;
}

.nav-container a {
  display: block;
  padding: 8px 20px;
  color: #555;
  text-decoration: none;
  font-size: 14px;
}

.nav-container a:hover {
  background-color: #e9e9e9;
  color: #000;
}

.nav-container .has-submenu > span {
  display: block;
  padding: 8px 20px;
  color: #333;
  font-weight: bold;
  cursor: pointer;
}

.nav-container .has-submenu > span:hover {
  background-color: #e9e9e9;
}

.nav-level-1 {
  padding-left: 15px;
}

.nav-level-2 {
  padding-left: 15px;
}
`;

  fs.writeFileSync(navCSSFile, navCSS);
  console.log(`Navigation CSS created at ${navCSSFile}`);
}

// Main execution
try {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  generateCompleteNav();
} catch (error) {
  console.error('Error generating navigation:', error);
  process.exit(1);
}
