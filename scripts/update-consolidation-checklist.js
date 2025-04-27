const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const consolidationFile = path.join(rootDir, 'CONSOLIDATION.md');

// Read the current consolidation file
const content = fs.readFileSync(consolidationFile, 'utf8');

// Update the checklist
let updatedContent = content.replace(
  /- \[ \] Clean up duplicate files/,
  '- [x] Clean up duplicate files'
);

updatedContent = updatedContent.replace(
  /- \[ \] Consolidate CSS files/,
  '- [x] Consolidate CSS files'
);

// Add a note about the cleanup process
const dateStr = new Date().toISOString().split('T')[0];
const noteToAdd = `

## Cleanup Notes (${dateStr})

The following cleanup tasks have been completed:

1. Removed duplicate files with \` 2.md\` suffix using the scripts in \`scripts/identify-duplicates.js\`
2. Consolidated CSS files into a single \`consolidated.css\` with \`scripts/consolidate-css.js\`
3. Updated the consolidation checklist

Scripts used for this process are available in the \`scripts/\` directory.
`;

// Check if notes section already exists
if (!updatedContent.includes(`## Cleanup Notes (${dateStr})`)) {
  // Find the position to insert the note (before the last section)
  const lastSectionPos = updatedContent.lastIndexOf('## ');

  if (lastSectionPos !== -1) {
    updatedContent =
      updatedContent.substring(0, lastSectionPos) +
      noteToAdd +
      '\n' +
      updatedContent.substring(lastSectionPos);
  } else {
    updatedContent += noteToAdd;
  }
}

// Write the updated content
fs.writeFileSync(consolidationFile, updatedContent);
console.log(`Updated ${path.relative(rootDir, consolidationFile)}`);
