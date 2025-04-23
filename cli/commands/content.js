/**
 * Content Commands
 *
 * Commands for managing site content
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const ora = require('ora');
const { Spinner } = require('../utils/ui-helpers');

/**
 * Get all content files from a directory
 * @param {string} dir Directory to scan
 * @param {Array<string>} fileList List to populate
 * @param {Array<string>} extensions File extensions to include
 * @returns {Array<string>} List of files
 */
function getContentFiles(dir, fileList = [], extensions = ['.md', '.html']) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fileList = getContentFiles(filePath, fileList, extensions);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get file details
 * @param {string} filePath Path to file
 * @returns {Object} File details
 */
function getFileDetails(filePath) {
  const stats = fs.statSync(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse title from HTML or Markdown
  let title = '';
  if (filePath.endsWith('.html')) {
    const match = content.match(/<title>(.*?)<\/title>/i);
    title = match ? match[1] : path.basename(filePath, '.html');
  } else if (filePath.endsWith('.md')) {
    const match = content.match(/^#\s+(.*?)$/m);
    title = match ? match[1] : path.basename(filePath, '.md');
  }

  // Count words
  const wordCount = content
    .replace(/(<([^>]+)>)/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  // Check for images
  const imageCount = content.match(/<img|!\[/g)?.length || 0;

  return {
    path: relativePath,
    title,
    size: stats.size,
    lastModified: stats.mtime,
    wordCount,
    imageCount
  };
}

/**
 * Register content commands
 * @param {object} program Commander program instance
 */
function registerContentCommands(program) {
  const content = program.command('content').description('Content management commands');

  content
    .command('list')
    .description('List all content files')
    .option('-f, --format <format>', 'Output format (table, json)', 'table')
    .option('-t, --type <type>', 'Filter by content type (md, html, all)', 'all')
    .action(async options => {
      const spinner = new Spinner('Scanning content files...').start();

      try {
        // Determine extensions to look for
        let extensions = [];
        if (options.type === 'md' || options.type === 'all') extensions.push('.md');
        if (options.type === 'html' || options.type === 'all') extensions.push('.html');

        // Get all content files
        const files = getContentFiles(process.cwd(), [], extensions);

        // Get details for each file
        const filesDetails = [];
        files.forEach(file => {
          try {
            filesDetails.push(getFileDetails(file));
          } catch (error) {
            console.error(`Error processing ${file}: ${error.message}`);
          }
        });

        spinner.succeed(`Found ${filesDetails.length} content files`);

        // Output based on format option
        if (options.format === 'json') {
          console.log(JSON.stringify(filesDetails, null, 2));
        } else {
          // Import here to prevent loading table when not needed
          const Table = require('cli-table3');

          // Create nice table
          const table = new Table({
            head: ['Title', 'Path', 'Words', 'Images', 'Last Modified'],
            style: { head: ['cyan'] }
          });

          filesDetails.forEach(file => {
            table.push([
              chalk.white(file.title),
              chalk.gray(file.path),
              file.wordCount.toString(),
              file.imageCount.toString(),
              new Date(file.lastModified).toLocaleDateString()
            ]);
          });

          console.log(table.toString());
        }

        // Summary stats
        console.log('\n' + chalk.cyan('Content Summary:'));
        console.log(chalk.gray(`Total Content Files: ${filesDetails.length}`));

        const mdFiles = filesDetails.filter(f => f.path.endsWith('.md')).length;
        const htmlFiles = filesDetails.filter(f => f.path.endsWith('.html')).length;

        console.log(chalk.gray(`Markdown Files: ${mdFiles}`));
        console.log(chalk.gray(`HTML Files: ${htmlFiles}`));

        const totalWords = filesDetails.reduce((sum, file) => sum + file.wordCount, 0);
        console.log(chalk.gray(`Total Word Count: ${totalWords.toLocaleString()}`));
      } catch (error) {
        spinner.fail(`Failed to scan content: ${error.message}`);
      }
    });

  content
    .command('create')
    .description('Create new content')
    .argument('[type]', 'Content type (post, page)', 'page')
    .action(async type => {
      console.log(chalk.cyan(`Creating new ${type}...`));

      // Interactive prompt to gather content details
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter content title:',
          validate: input => (input.trim() ? true : 'Title is required')
        },
        {
          type: 'input',
          name: 'description',
          message: 'Enter content description:'
        },
        {
          type: 'list',
          name: 'format',
          message: 'Select content format:',
          choices: ['markdown', 'html'],
          default: 'markdown'
        },
        {
          type: 'input',
          name: 'path',
          message: 'Enter content path:',
          default: answers => {
            const slug = answers.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');

            if (type === 'post') {
              return `posts/${slug}.${answers.format === 'markdown' ? 'md' : 'html'}`;
            }
            return `pages/${slug}.${answers.format === 'markdown' ? 'md' : 'html'}`;
          }
        }
      ]);

      const spinner = new Spinner('Creating content...').start();

      try {
        // Ensure directory exists
        const dir = path.dirname(answers.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Current date in ISO format
        const date = new Date().toISOString();

        // Create content file based on format
        let content = '';
        if (answers.format === 'markdown') {
          content = `# ${answers.title}\n\n`;
          content += `> ${answers.description}\n\n`;
          content += `*Created: ${date}*\n\n`;
          content += `Write your content here...\n`;
        } else {
          content = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
          content += `  <meta charset="UTF-8">\n`;
          content += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
          content += `  <title>${answers.title}</title>\n`;
          content += `  <meta name="description" content="${answers.description}">\n`;
          content += `</head>\n<body>\n`;
          content += `  <h1>${answers.title}</h1>\n`;
          content += `  <p><em>Created: ${date}</em></p>\n\n`;
          content += `  <p>Write your content here...</p>\n`;
          content += `</body>\n</html>`;
        }

        // Write file
        fs.writeFileSync(answers.path, content);

        spinner.succeed(`Content created at: ${answers.path}`);

        // Ask if user wants to open the file
        const { openFile } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'openFile',
            message: 'Do you want to open this file now?',
            default: true
          }
        ]);

        if (openFile) {
          // Try to open with appropriate command based on platform
          try {
            if (process.platform === 'win32') {
              execSync(`start ${answers.path}`);
            } else if (process.platform === 'darwin') {
              execSync(`open ${answers.path}`);
            } else {
              execSync(`xdg-open ${answers.path}`);
            }
          } catch (error) {
            console.error(chalk.yellow(`Could not open file: ${error.message}`));
          }
        }
      } catch (error) {
        spinner.fail(`Failed to create content: ${error.message}`);
      }
    });

  content
    .command('analyze')
    .description('Analyze content quality')
    .argument('[path]', 'Path to content file or directory')
    .option('-d, --detailed', 'Show detailed analysis', false)
    .action(async (contentPath, options) => {
      const targetPath = contentPath || process.cwd();
      const spinner = new Spinner(`Analyzing content at ${targetPath}...`).start();

      try {
        // Determine if target is file or directory
        const stats = fs.statSync(targetPath);
        let filesToAnalyze = [];

        if (stats.isDirectory()) {
          filesToAnalyze = getContentFiles(targetPath);
        } else if (targetPath.endsWith('.md') || targetPath.endsWith('.html')) {
          filesToAnalyze = [targetPath];
        } else {
          spinner.fail(`File type not supported for analysis: ${targetPath}`);
          return;
        }

        spinner.setText(`Analyzing ${filesToAnalyze.length} files...`);

        // Perform analysis on each file
        const analysisResults = filesToAnalyze.map(file => {
          const details = getFileDetails(file);
          const content = fs.readFileSync(file, 'utf8');
          const textContent = content.replace(/(<([^>]+)>)/gi, ' ');

          // Calculate readability (Flesch-Kincaid Grade Level approximation)
          const words = textContent.split(/\s+/).filter(Boolean);
          const sentences = textContent.split(/[.!?]+/).filter(Boolean);
          const syllables = words.reduce((count, word) => {
            return count + countSyllables(word);
          }, 0);

          let readabilityScore = 0;
          let readabilityLevel = 'Unknown';

          if (sentences.length > 0 && words.length > 0) {
            // Simple Flesch-Kincaid Grade Level formula
            readabilityScore =
              0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;

            // Determine readability level
            if (readabilityScore <= 6) {
              readabilityLevel = 'Easy';
            } else if (readabilityScore <= 12) {
              readabilityLevel = 'Moderate';
            } else {
              readabilityLevel = 'Difficult';
            }
          }

          // SEO basics
          const hasTitle = file.endsWith('.html')
            ? content.includes('<title>')
            : textContent.split('\n').some(line => line.startsWith('# '));

          const hasDescription = file.endsWith('.html')
            ? content.includes('name="description"')
            : textContent.includes('> '); // Use blockquotes as description in MD

          const hasHeadings = file.endsWith('.html')
            ? content.match(/<h[2-6][^>]*>/g)?.length > 0
            : textContent.split('\n').some(line => line.match(/^#{2,6} /));

          // Calculate keyword density (simplified)
          const words2 = textContent.toLowerCase().split(/\s+/).filter(Boolean);
          const wordFreq = {};
          words2.forEach(word => {
            // Skip very short words
            if (word.length <= 2) return;

            wordFreq[word] = (wordFreq[word] || 0) + 1;
          });

          // Find most frequent words
          const sortedWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          return {
            ...details,
            readabilityScore: readabilityScore.toFixed(1),
            readabilityLevel,
            averageSentenceLength: words.length / sentences.length,
            hasTitle,
            hasDescription,
            hasHeadings,
            topKeywords: sortedWords.map(([word, freq]) => ({
              word,
              count: freq,
              density: ((freq / words.length) * 100).toFixed(1) + '%'
            }))
          };
        });

        spinner.succeed(`Analysis complete for ${filesToAnalyze.length} files`);

        // Show analysis results
        if (options.detailed) {
          analysisResults.forEach(result => {
            console.log('\n' + chalk.cyan(`Analysis for ${result.title} (${result.path}):`));
            console.log(chalk.gray(`Word count: ${result.wordCount}`));
            console.log(chalk.gray(`Image count: ${result.imageCount}`));
            console.log(
              chalk.gray(`Readability: ${result.readabilityLevel} (${result.readabilityScore})`)
            );
            console.log(
              chalk.gray(`Avg. sentence length: ${result.averageSentenceLength.toFixed(1)} words`)
            );

            // SEO checklist
            console.log('\n' + chalk.cyan('SEO Checklist:'));
            console.log(`${result.hasTitle ? '✅' : '❌'} Has title`);
            console.log(`${result.hasDescription ? '✅' : '❌'} Has description`);
            console.log(`${result.hasHeadings ? '✅' : '❌'} Has subheadings`);

            // Top keywords
            console.log('\n' + chalk.cyan('Top Keywords:'));
            result.topKeywords.forEach(k => {
              console.log(`${chalk.gray(k.word)}: ${k.count} occurrences (${k.density})`);
            });

            console.log(chalk.gray('─'.repeat(50)));
          });
        } else {
          // Simple table view for non-detailed mode
          const Table = require('cli-table3');

          const table = new Table({
            head: ['Title', 'Words', 'Readability', 'SEO Score'],
            style: { head: ['cyan'] }
          });

          analysisResults.forEach(result => {
            // Calculate simple SEO score (0-10)
            const seoChecks = [
              result.hasTitle,
              result.hasDescription,
              result.hasHeadings,
              result.imageCount > 0,
              result.wordCount >= 300
            ];

            const seoScore = seoChecks.filter(Boolean).length * 2;

            table.push([
              chalk.white(result.title),
              result.wordCount.toString(),
              result.readabilityLevel,
              `${seoScore}/10`
            ]);
          });

          console.log(table.toString());
          console.log(chalk.gray('\nRun with --detailed for more information'));
        }
      } catch (error) {
        spinner.fail(`Analysis failed: ${error.message}`);
      }
    });

  // Helper function to roughly count syllables
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 0;

    // Count vowel groups
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    let count = 0;
    let prevIsVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !prevIsVowel) {
        count++;
      }
      prevIsVowel = isVowel;
    }

    // Adjust for common patterns
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) count++;
    if (word.endsWith('es') || word.endsWith('ed')) count--;

    // Ensure at least one syllable
    return Math.max(1, count);
  }

  return content;
}

module.exports = registerContentCommands;
