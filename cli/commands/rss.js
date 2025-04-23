/**
 * RSS Feed Commands
 *
 * Commands for generating and managing RSS feeds for content syndication
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const { Spinner } = require('../utils/ui-helpers');
const cheerio = require('cheerio');

/**
 * Register RSS commands
 * @param {object} program Commander program instance
 */
function registerRSSCommands(program) {
  const rss = program.command('rss').description('RSS feed generation and management');

  rss
    .command('generate')
    .description('Generate RSS feed from content')
    .option('-d, --dir <directory>', 'Content directory to scan', './content')
    .option('-o, --output <file>', 'Output RSS file', './feed.xml')
    .option('-t, --title <title>', 'Feed title', 'StreamChain Updates')
    .option('-d, --description <desc>', 'Feed description', 'Latest updates from StreamChain')
    .option('-u, --url <url>', 'Site URL', 'https://streamchain.example.com')
    .option('--max-items <number>', 'Maximum items in feed', '20')
    .action(async options => {
      const spinner = new Spinner('Scanning content directory...').start();

      try {
        // Check if directory exists
        const contentDir = path.resolve(process.cwd(), options.dir);
        if (!fs.existsSync(contentDir)) {
          spinner.fail(`Content directory not found: ${options.dir}`);
          return;
        }

        // Scan for content files
        const contentFiles = scanContentFiles(contentDir);
        spinner.setText(`Found ${contentFiles.length} content files. Processing...`);

        // Parse content files
        const feedItems = await parseContentFiles(contentFiles, options.url);

        // Sort by date (newest first)
        feedItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limit to max items
        const maxItems = parseInt(options.maxItems) || 20;
        const limitedItems = feedItems.slice(0, maxItems);

        // Generate RSS XML
        const rssXml = generateRSSFeed(limitedItems, {
          title: options.title,
          description: options.description,
          url: options.url,
          lastBuildDate: new Date().toUTCString(),
          language: 'en-us'
        });

        // Write to file
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, rssXml);

        spinner.succeed(`RSS feed generated with ${limitedItems.length} items`);
        console.log(chalk.green(`Feed saved to: ${outputPath}`));
      } catch (error) {
        spinner.fail(`Failed to generate RSS feed: ${error.message}`);
      }
    });

  rss
    .command('validate')
    .description('Validate an RSS feed')
    .argument('<file>', 'RSS file to validate')
    .action(async file => {
      const spinner = new Spinner(`Validating RSS feed: ${file}...`).start();

      try {
        const filePath = path.resolve(process.cwd(), file);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          spinner.fail(`RSS file not found: ${file}`);
          return;
        }

        // Read file
        const rssContent = fs.readFileSync(filePath, 'utf8');

        // Perform validation
        const validationResult = validateRSSContent(rssContent);

        if (validationResult.valid) {
          spinner.succeed('RSS feed is valid');
          console.log(chalk.green(`Found ${validationResult.itemCount} feed items`));
          console.log(chalk.gray(`Feed title: ${validationResult.title}`));
          console.log(
            chalk.gray(`Last updated: ${validationResult.lastBuildDate || 'Not specified'}`)
          );
        } else {
          spinner.fail('RSS feed validation failed');
          console.log(chalk.red(validationResult.error));
        }
      } catch (error) {
        spinner.fail(`Failed to validate RSS feed: ${error.message}`);
      }
    });

  rss
    .command('preview')
    .description('Preview RSS feed items')
    .argument('<file>', 'RSS file to preview')
    .option('-n, --num <number>', 'Number of items to preview', '5')
    .action(async (file, options) => {
      const spinner = new Spinner(`Reading RSS feed: ${file}...`).start();

      try {
        const filePath = path.resolve(process.cwd(), file);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          spinner.fail(`RSS file not found: ${file}`);
          return;
        }

        // Read file
        const rssContent = fs.readFileSync(filePath, 'utf8');

        // Parse RSS content
        const $ = cheerio.load(rssContent, { xmlMode: true });

        const feedTitle = $('channel > title').text();
        const feedDesc = $('channel > description').text();
        const items = [];

        $('item').each((i, elem) => {
          items.push({
            title: $(elem).find('title').text(),
            link: $(elem).find('link').text(),
            date: $(elem).find('pubDate').text(),
            description: $(elem).find('description').text().substr(0, 100) + '...'
          });
        });

        spinner.succeed(`Found ${items.length} items in the feed`);

        // Display feed info
        console.log(chalk.cyan(`\nFeed: ${feedTitle}`));
        console.log(chalk.gray(feedDesc));
        console.log(chalk.cyan('\nRecent Items:'));

        // Show limited number of items
        const numItems = Math.min(parseInt(options.num), items.length);
        for (let i = 0; i < numItems; i++) {
          const item = items[i];
          console.log(chalk.white(`\n[${i + 1}] ${item.title}`));
          console.log(chalk.gray(`Date: ${item.date}`));
          console.log(chalk.gray(`Link: ${item.link}`));
          console.log(chalk.gray(`${item.description}`));
        }
      } catch (error) {
        spinner.fail(`Failed to preview RSS feed: ${error.message}`);
      }
    });

  return rss;
}

/**
 * Scan directory for content files
 * @param {string} dir Directory to scan
 * @param {Array<string>} fileList Accumulated file list
 * @returns {Array<string>} List of content file paths
 */
function scanContentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      // Recurse into subdirectories
      fileList = scanContentFiles(filePath, fileList);
    } else if (file.endsWith('.html') || file.endsWith('.md') || file.endsWith('.json')) {
      // Add content files
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Parse content files into feed items
 * @param {Array<string>} files List of files to parse
 * @param {string} siteUrl Base site URL
 * @returns {Array<object>} Feed items
 */
async function parseContentFiles(files, siteUrl) {
  const feedItems = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      const fileUrl = `${siteUrl}/${relativePath.replace(/\\/g, '/').replace(/\.(md|html)$/, '.html')}`;

      let item;

      if (file.endsWith('.html')) {
        // Parse HTML
        item = parseHtmlContent(content, fileUrl, file);
      } else if (file.endsWith('.md')) {
        // Parse Markdown
        item = parseMarkdownContent(content, fileUrl, file);
      } else if (file.endsWith('.json')) {
        // Parse JSON
        item = parseJsonContent(content, fileUrl, file);
      }

      if (item) {
        feedItems.push(item);
      }
    } catch (error) {
      console.error(chalk.yellow(`Error parsing ${file}: ${error.message}`));
    }
  }

  return feedItems;
}

/**
 * Parse HTML content
 * @param {string} content HTML content
 * @param {string} url Item URL
 * @param {string} filePath Original file path
 * @returns {object} Feed item
 */
function parseHtmlContent(content, url, filePath) {
  const $ = cheerio.load(content);

  // Extract metadata
  const title = $('title').text() || $('h1').first().text() || path.basename(filePath, '.html');
  const description =
    $('meta[name="description"]').attr('content') ||
    $('p').first().text() ||
    `Content from ${path.basename(filePath)}`;

  // Look for publication date
  let date;
  // Try common date meta tags
  date =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content');

  if (!date) {
    // Fallback to file modification date
    const stats = fs.statSync(filePath);
    date = stats.mtime;
  }

  // Extract author
  const author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    'StreamChain';

  return {
    title,
    description: description.substr(0, 280), // Truncate for RSS
    link: url,
    date: new Date(date).toUTCString(),
    author,
    content: content.substring(0, 4000), // Limit size
    guid: url
  };
}

/**
 * Parse Markdown content
 * @param {string} content Markdown content
 * @param {string} url Item URL
 * @param {string} filePath Original file path
 * @returns {object} Feed item
 */
function parseMarkdownContent(content, url, filePath) {
  const lines = content.split('\n');

  // Extract title from markdown (first # heading)
  let title = path.basename(filePath, '.md');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.substring(2).trim();
      break;
    }
  }

  // Get first paragraph for description
  let description = '';
  let inParagraph = false;

  for (const line of lines) {
    // Skip front matter and headings
    if (line.startsWith('#') || line.startsWith('---')) continue;

    if (line.trim() !== '') {
      description = line.trim();
      break;
    }
  }

  if (description === '') {
    description = `Content from ${path.basename(filePath)}`;
  }

  // Look for date in front matter
  let date;
  let inFrontMatter = false;
  let frontMatter = '';

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontMatter = !inFrontMatter;
      continue;
    }

    if (inFrontMatter) {
      frontMatter += line + '\n';

      // Check for date field
      if (line.startsWith('date:')) {
        date = line.substring(5).trim();
      }
    }
  }

  if (!date) {
    // Fallback to file modification date
    const stats = fs.statSync(filePath);
    date = stats.mtime;
  }

  // Extract author from front matter
  let author = 'StreamChain';
  if (frontMatter.includes('author:')) {
    const authorMatch = frontMatter.match(/author:\s*(.+)$/m);
    if (authorMatch && authorMatch[1]) {
      author = authorMatch[1].trim();
    }
  }

  return {
    title,
    description: description.substr(0, 280),
    link: url,
    date: new Date(date).toUTCString(),
    author,
    content: content.substring(0, 4000), // Limit size
    guid: url
  };
}

/**
 * Parse JSON content
 * @param {string} content JSON content
 * @param {string} url Item URL
 * @param {string} filePath Original file path
 * @returns {object} Feed item
 */
function parseJsonContent(content, url, filePath) {
  try {
    const data = JSON.parse(content);

    // Check if this is a content item with required fields
    if (data.title) {
      return {
        title: data.title,
        description: data.description || data.summary || `Content from ${path.basename(filePath)}`,
        link: data.url || url,
        date: data.date ? new Date(data.date).toUTCString() : new Date().toUTCString(),
        author: data.author || 'StreamChain',
        content: JSON.stringify(data).substring(0, 4000), // Limit size
        guid: data.id || url
      };
    }

    // Not a valid content item
    return null;
  } catch (error) {
    console.error(chalk.yellow(`Error parsing JSON ${filePath}: ${error.message}`));
    return null;
  }
}

/**
 * Generate RSS feed XML
 * @param {Array<object>} items Feed items
 * @param {object} channelInfo Channel information
 * @returns {string} RSS XML content
 */
function generateRSSFeed(items, channelInfo) {
  const { title, description, url, lastBuildDate, language } = channelInfo;

  let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(title)}</title>
  <description>${escapeXml(description)}</description>
  <link>${url}</link>
  <atom:link href="${url}/feed.xml" rel="self" type="application/rss+xml" />
  <language>${language}</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
`;

  // Add items
  items.forEach(item => {
    rssContent += `  <item>
    <title>${escapeXml(item.title)}</title>
    <description>${escapeXml(item.description)}</description>
    <link>${item.link}</link>
    <guid isPermaLink="true">${item.guid || item.link}</guid>
    <pubDate>${item.date}</pubDate>
    <author>${escapeXml(item.author)}</author>
  </item>
`;
  });

  rssContent += `</channel>
</rss>`;

  return rssContent;
}

/**
 * Validate RSS content
 * @param {string} content RSS content
 * @returns {object} Validation result
 */
function validateRSSContent(content) {
  try {
    const $ = cheerio.load(content, { xmlMode: true });

    // Check for required elements
    if ($('rss').length === 0) {
      return { valid: false, error: 'Invalid RSS: <rss> tag not found' };
    }

    if ($('channel').length === 0) {
      return { valid: false, error: 'Invalid RSS: <channel> tag not found' };
    }

    if ($('channel > title').length === 0 || $('channel > link').length === 0) {
      return {
        valid: false,
        error: 'Invalid RSS: Missing required channel elements (title, link)'
      };
    }

    // Count items
    const itemCount = $('item').length;

    // Get feed title and lastBuildDate
    const title = $('channel > title').text();
    const lastBuildDate = $('channel > lastBuildDate').text();

    return {
      valid: true,
      itemCount,
      title,
      lastBuildDate
    };
  } catch (error) {
    return { valid: false, error: `XML parsing error: ${error.message}` };
  }
}

/**
 * Escape XML special characters
 * @param {string} str Input string
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return '';

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = registerRSSCommands;
