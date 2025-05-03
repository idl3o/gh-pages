const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load the duplicates data
let duplicates = [];
try {
  duplicates = require('./duplicates.json');
} catch (error) {
  console.error('Error loading duplicates.json. Run identify-duplicates.js first.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and get a response
 * @param {string} question Question to ask
 * @returns {Promise<string>} User's answer
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Display file diff in a simple format
 * @param {string} file1 First file content
 * @param {string} file2 Second file content
 */
function displaySimpleDiff(file1, file2) {
  const lines1 = file1.split('\n');
  const lines2 = file2.split('\n');

  console.log('\nFile differences:');
  console.log('-'.repeat(50));

  if (lines1.length !== lines2.length) {
    console.log(`Line count: Original (${lines1.length}), Duplicate (${lines2.length})`);
  }

  const minLines = Math.min(lines1.length, lines2.length);
  let differencesFound = false;

  for (let i = 0; i < minLines; i++) {
    if (lines1[i] !== lines2[i]) {
      console.log(`Line ${i + 1}:`);
      console.log(`< ${lines1[i]}`);
      console.log(`> ${lines2[i]}`);
      console.log('-'.repeat(50));
      differencesFound = true;

      // Only show up to 5 differences to avoid console overflow
      if (i > 5) {
        console.log('... more differences found (showing first 5 only)');
        break;
      }
    }
  }

  if (!differencesFound && lines1.length === lines2.length) {
    console.log('Files are identical in content.');
  }
}

/**
 * Process each duplicate file
 */
async function processFiles() {
  console.log(`Found ${duplicates.length} duplicate files to process.\n`);

  for (let i = 0; i < duplicates.length; i++) {
    const pair = duplicates[i];
    console.log(`\nProcessing ${i + 1}/${duplicates.length}:`);
    console.log(`Duplicate: ${pair.relativeDuplicate}`);
    console.log(`Original: ${pair.relativeOriginal}`);

    try {
      const originalContent = fs.readFileSync(
        path.join(__dirname, '..', pair.relativeOriginal),
        'utf8'
      );
      const duplicateContent = fs.readFileSync(
        path.join(__dirname, '..', pair.relativeDuplicate),
        'utf8'
      );

      displaySimpleDiff(originalContent, duplicateContent);

      const action = await askQuestion(
        '\nActions:\n[k]eep both\n[d]elete duplicate\n[r]eplace original with duplicate\n[m]erge (keep newest)\n[s]kip\nWhat action? '
      );

      switch (action.toLowerCase()) {
        case 'k':
          console.log('Keeping both files.');
          break;

        case 'd':
          console.log(`Deleting duplicate file: ${pair.relativeDuplicate}`);
          // Uncomment to actually delete:
          // fs.unlinkSync(path.join(__dirname, '..', pair.relativeDuplicate));
          console.log(
            '(Delete operation is commented out for safety. Uncomment in the script to enable actual deletion.)'
          );
          break;

        case 'r':
          console.log(`Replacing original with duplicate content: ${pair.relativeOriginal}`);
          // Uncomment to actually replace:
          // fs.writeFileSync(path.join(__dirname, '..', pair.relativeOriginal), duplicateContent);
          // fs.unlinkSync(path.join(__dirname, '..', pair.relativeDuplicate));
          console.log(
            '(Replace operation is commented out for safety. Uncomment in the script to enable actual replacement.)'
          );
          break;

        case 'm':
          const origStat = fs.statSync(path.join(__dirname, '..', pair.relativeOriginal));
          const dupStat = fs.statSync(path.join(__dirname, '..', pair.relativeDuplicate));

          if (origStat.mtime > dupStat.mtime) {
            console.log(`Original is newer. Keeping original and deleting duplicate.`);
            // Uncomment to actually delete:
            // fs.unlinkSync(path.join(__dirname, '..', pair.relativeDuplicate));
          } else {
            console.log(`Duplicate is newer. Replacing original with duplicate content.`);
            // Uncomment to actually replace:
            // fs.writeFileSync(path.join(__dirname, '..', pair.relativeOriginal), duplicateContent);
            // fs.unlinkSync(path.join(__dirname, '..', pair.relativeDuplicate));
          }
          console.log(
            '(Operations are commented out for safety. Uncomment in the script to enable actual file operations.)'
          );
          break;

        case 's':
          console.log('Skipping this file.');
          break;

        default:
          console.log('Invalid option. Skipping this file.');
      }
    } catch (error) {
      console.error(`Error processing files: ${error.message}`);
    }
  }

  rl.close();
  console.log('\nFile consolidation review complete.');
}

processFiles();
