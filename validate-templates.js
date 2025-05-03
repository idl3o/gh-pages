/**
 * HTML and Liquid Template Validator
 *
 * This script validates HTML files and Jekyll Liquid templates
 * for common syntax errors.
 */

const fs = require('fs');
const path = require('path');

// Simple HTML syntax checker
function checkHtmlSyntax(content, filePath) {
  const issues = [];

  // Check for unclosed tags
  const openingTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/)(>)/g;
  const closingTagRegex = /<\/([a-zA-Z][a-zA-Z0-9]*)>/g;

  const openingTags = [];
  let match;

  // Skip self-closing tags
  const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*\/>/g;
  const selfClosingTags = [];
  while ((match = selfClosingRegex.exec(content)) !== null) {
    selfClosingTags.push({
      tag: match[1],
      position: match.index
    });
  }

  // Process opening tags
  while ((match = openingTagRegex.exec(content)) !== null) {
    // Skip void elements
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'];
    if (!voidElements.includes(match[1].toLowerCase())) {
      openingTags.push({
        tag: match[1],
        position: match.index
      });
    }
  }

  // Process closing tags
  const matchedOpeningTags = [...openingTags];
  while ((match = closingTagRegex.exec(content)) !== null) {
    const closingTag = match[1];

    // Find matching opening tag (from the end)
    let foundMatchingTag = false;
    for (let i = matchedOpeningTags.length - 1; i >= 0; i--) {
      if (matchedOpeningTags[i].tag.toLowerCase() === closingTag.toLowerCase()) {
        matchedOpeningTags.splice(i, 1);
        foundMatchingTag = true;
        break;
      }
    }

    if (!foundMatchingTag) {
      const line = content.substring(0, match.index).split('\n').length;
      issues.push(`Unmatched closing tag </${closingTag}> at line ${line}`);
    }
  }

  // Check for unmatched opening tags
  matchedOpeningTags.forEach(tag => {
    const line = content.substring(0, tag.position).split('\n').length;
    issues.push(`Unclosed tag <${tag.tag}> at line ${line}`);
  });

  // Check for unterminated tags (missing >)
  const unterminatedTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>\/]*$/gm;
  while ((match = unterminatedTagRegex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    issues.push(`Unterminated tag <${match[1]} at line ${line}`);
  }

  // Check for Liquid syntax errors
  const liquidTagRegex = /\{\{[^}]*\}\}/g;
  while ((match = liquidTagRegex.exec(content)) !== null) {
    const liquidTag = match[0];
    if (liquidTag.includes('==\"') || liquidTag.includes('==\'')) {
      const line = content.substring(0, match.index).split('\n').length;
      issues.push(`Potential Liquid comparison syntax error at line ${line}: ${liquidTag}`);
    }
  }

  return issues;
}

// Simple CSS syntax checker
function checkCssSyntax(content, filePath) {
  const issues = [];

  // Check for unbalanced braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    issues.push(`Unbalanced braces: ${openBraces} opening braces, ${closeBraces} closing braces`);
  }

  // Check for missing semicolons
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip comments, closing braces, and lines that end with a semicolon
    if (!line.trim().startsWith('//') &&
        !line.trim().startsWith('/*') &&
        !line.trim().endsWith('}') &&
        !line.trim().endsWith(';') &&
        !line.trim().endsWith('{') &&
        line.trim().length > 0 &&
        !line.includes('@import') && // Skip import statements
        line.includes(':')) { // Only check property lines
      issues.push(`Possible missing semicolon at line ${index + 1}: ${line.trim()}`);
    }
  });

  return issues;
}

// Walk directory and validate files
function validateFiles(directory, outputFile) {
  const results = [];

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        walkDir(filePath);
      } else {
        // Process HTML files
        if (file.endsWith('.html')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const issues = checkHtmlSyntax(content, filePath);

          if (issues.length > 0) {
            results.push({
              file: filePath,
              issues: issues
            });
          }
        }
        // Process CSS files
        else if (file.endsWith('.css')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const issues = checkCssSyntax(content, filePath);

          if (issues.length > 0) {
            results.push({
              file: filePath,
              issues: issues
            });
          }
        }
      }
    }
  }

  try {
    walkDir(directory);

    // Write results to file
    if (outputFile) {
      const output = results.map(result => {
        return `File: ${result.file}\n${result.issues.map(issue => `  - ${issue}`).join('\n')}\n`;
      }).join('\n');

      fs.writeFileSync(outputFile, output);
      console.log(`Validation results written to ${outputFile}`);
    }

    return results;
  } catch (error) {
    console.error('Error validating files:', error);
    return [];
  }
}

// Run validation if executed directly
if (require.main === module) {
  console.log('Validating HTML and CSS files...');
  const results = validateFiles('.', 'validation-report.txt');

  if (results.length === 0) {
    console.log('No issues found!');
  } else {
    console.log(`Found issues in ${results.length} files. See validation-report.txt for details.`);
  }
}

module.exports = { validateFiles, checkHtmlSyntax, checkCssSyntax };
