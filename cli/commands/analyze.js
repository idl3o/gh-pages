/**
 * Analyze Commands
 *
 * Commands for analyzing site performance and metrics
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');
const { Spinner, ProgressBar } = require('../utils/ui-helpers');

/**
 * Register analyze commands
 * @param {object} program Commander program instance
 */
function registerAnalyzeCommands(program) {
  const analyze = program.command('analyze').description('Site analysis commands');

  analyze
    .command('performance')
    .description('Run performance analysis')
    .option('-u, --url <url>', 'URL to analyze (default: local build)')
    .option('-d, --detailed', 'Show detailed analysis')
    .action(async options => {
      const spinner = new Spinner('Preparing performance analysis...').start();

      try {
        // Check if we have required tools
        let hasLighthouse = false;

        try {
          execSync('npx lighthouse --version', { stdio: 'ignore' });
          hasLighthouse = true;
        } catch (e) {
          // Lighthouse not available
        }

        if (!hasLighthouse) {
          spinner.setText('Installing Lighthouse (one-time)...');
          execSync('npm install -g lighthouse', { stdio: 'ignore' });
        }

        // Check if we should use local server or remote URL
        const url = options.url || 'http://localhost:3000';
        let localServer = null;

        if (!options.url) {
          spinner.setText('Starting local server...');

          // Start local server in background
          localServer = require('child_process').spawn(
            'npx',
            ['http-server', '.', '-p', '3000', '-c-1'],
            {
              stdio: 'ignore',
              detached: true
            }
          );

          // Give server time to start
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        spinner.setText(`Running performance audit on ${url}...`);

        // Create output directory
        const outputDir = path.join(process.cwd(), 'performance-reports');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const outputPath = path.join(outputDir, `performance-${timestamp}.html`);

        // Run Lighthouse
        try {
          execSync(`npx lighthouse ${url} --quiet --output html --output-path "${outputPath}"`, {
            stdio: ['ignore', 'pipe', 'ignore']
          });

          spinner.succeed('Performance analysis complete');

          // Parse the results to show summary in console
          const summaryJson = path.join(outputDir, 'summary.json');
          try {
            execSync(`npx lighthouse ${url} --quiet --output json --output-path "${summaryJson}"`, {
              stdio: ['ignore', 'pipe', 'ignore']
            });

            if (fs.existsSync(summaryJson)) {
              const results = JSON.parse(fs.readFileSync(summaryJson, 'utf8'));

              // Display summary results
              console.log('\n' + chalk.cyan('Performance Results:'));

              const categories = results.categories;
              Object.keys(categories).forEach(key => {
                const score = Math.round(categories[key].score * 100);
                let color = chalk.red;

                if (score >= 90) color = chalk.green;
                else if (score >= 50) color = chalk.yellow;

                console.log(`${categories[key].title}: ${color(`${score}/100`)}`);
              });

              // Show detailed results if requested
              if (options.detailed && results.audits) {
                console.log('\n' + chalk.cyan('Key Metrics:'));

                const metrics = [
                  'first-contentful-paint',
                  'largest-contentful-paint',
                  'total-blocking-time',
                  'cumulative-layout-shift',
                  'speed-index',
                  'interactive'
                ];

                metrics.forEach(metric => {
                  if (results.audits[metric]) {
                    const audit = results.audits[metric];
                    console.log(`${chalk.gray(audit.title)}: ${audit.displayValue}`);
                  }
                });

                // Show opportunities for improvement
                if (results.categories.performance && results.categories.performance.score < 0.9) {
                  console.log('\n' + chalk.cyan('Opportunities for Improvement:'));

                  const opportunities = Object.values(results.audits).filter(
                    audit => audit.details && audit.details.type === 'opportunity' && !audit.score
                  );

                  opportunities.sort(
                    (a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0)
                  );

                  opportunities.forEach(op => {
                    let savings = '';
                    if (op.details.overallSavingsMs) {
                      savings = ` (save ${op.details.overallSavingsMs}ms)`;
                    }

                    console.log(`${chalk.gray(op.title)}${chalk.gray(savings)}`);
                  });
                }
              }

              // Clean up summary file
              fs.unlinkSync(summaryJson);
            }
          } catch (e) {
            // Ignore JSON summary error, we still have HTML report
          }

          console.log(chalk.green(`\nFull report saved to: ${outputPath}`));
          console.log(chalk.gray('Open this file in a browser to see the complete analysis.'));

          // Offer to open the report
          console.log('');
          if (process.platform === 'win32') {
            console.log(`Run: ${chalk.cyan(`start "${outputPath}"`)}`);
          } else if (process.platform === 'darwin') {
            console.log(`Run: ${chalk.cyan(`open "${outputPath}"`)}`);
          } else {
            console.log(`Run: ${chalk.cyan(`xdg-open "${outputPath}"`)}`);
          }
        } catch (error) {
          spinner.fail(`Lighthouse audit failed: ${error.message}`);
        }

        // Kill local server if we started one
        if (localServer) {
          if (process.platform === 'win32') {
            execSync(`taskkill /pid ${localServer.pid} /f /t`, { stdio: 'ignore' });
          } else {
            process.kill(-localServer.pid);
          }
        }
      } catch (error) {
        spinner.fail(`Performance analysis failed: ${error.message}`);
      }
    });

  analyze
    .command('links')
    .description('Check for broken links')
    .option('-u, --url <url>', 'URL to analyze (default: local build)', 'http://localhost:3000')
    .option('--external', 'Check external links too (slower)', false)
    .action(async options => {
      const spinner = new Spinner('Preparing link checker...').start();

      try {
        // Check if we have required package
        try {
          execSync('npx broken-link-checker --version', { stdio: 'ignore' });
        } catch (e) {
          spinner.setText('Installing link checker (one-time)...');
          execSync('npm install -g broken-link-checker', { stdio: 'ignore' });
        }

        // Start local server if using localhost
        let localServer = null;

        if (options.url.includes('localhost')) {
          spinner.setText('Starting local server...');

          // Start local server in background
          localServer = require('child_process').spawn(
            'npx',
            ['http-server', '.', '-p', '3000', '-c-1'],
            {
              stdio: 'ignore',
              detached: true
            }
          );

          // Give server time to start
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        spinner.setText(`Checking links on ${options.url}...`);

        // Run link checker with appropriate flags
        const checkExternalFlag = options.external ? '' : '--exclude-external';

        const cmd = `npx broken-link-checker ${options.url} ${checkExternalFlag} --ordered --recursive --verbose`;

        let results = { brokenLinks: [], validLinks: [] };

        await new Promise(resolve => {
          const linkCheck = require('child_process').exec(cmd);

          linkCheck.stdout.on('data', data => {
            // Parse output to count links
            const lines = data.toString().split('\n');

            lines.forEach(line => {
              spinner.setText(
                `Checking links... (${results.validLinks.length + results.brokenLinks.length} links found)`
              );

              if (line.includes('─BROKEN─')) {
                results.brokenLinks.push(line.trim());
              } else if (line.includes('─OK─')) {
                results.validLinks.push(line.trim());
              }
            });
          });

          linkCheck.on('close', resolve);
        });

        if (localServer) {
          // Kill local server if we started one
          if (process.platform === 'win32') {
            execSync(`taskkill /pid ${localServer.pid} /f /t`, { stdio: 'ignore' });
          } else {
            process.kill(-localServer.pid);
          }
        }

        // Display results
        spinner.succeed(
          `Link check complete: ${results.validLinks.length} valid, ${results.brokenLinks.length} broken`
        );

        if (results.brokenLinks.length > 0) {
          console.log('\n' + chalk.red('Broken links found:'));

          results.brokenLinks.forEach(link => {
            // Extract useful info from the complex log line
            const matches = link.match(/─BROKEN─ (.*?) .*?(\d{3})/) || [];
            if (matches.length >= 3) {
              console.log(`${chalk.gray(matches[1])} - ${chalk.red(`Status ${matches[2]}`)}`);
            } else {
              console.log(chalk.gray(link));
            }
          });
        } else {
          console.log(chalk.green('\nNo broken links found!'));
        }

        console.log(
          `\nTotal links checked: ${results.validLinks.length + results.brokenLinks.length}`
        );

        if (!options.external) {
          console.log(chalk.gray('\nTip: Use --external flag to check external links too.'));
        }
      } catch (error) {
        spinner.fail(`Link analysis failed: ${error.message}`);
      }
    });

  analyze
    .command('code-quality')
    .description('Run code quality analysis')
    .option('-d, --dir <directory>', 'Directory to analyze', '.')
    .action(async options => {
      const spinner = new Spinner('Preparing code quality analysis...').start();

      try {
        // Check if we have required tools
        let hasEslint = true;
        let hasHtmlvalidate = true;

        try {
          execSync('npx eslint --version', { stdio: 'ignore' });
        } catch (e) {
          hasEslint = false;
        }

        try {
          execSync('npx html-validate --version', { stdio: 'ignore' });
        } catch (e) {
          hasHtmlvalidate = false;
        }

        // Install missing tools if needed
        if (!hasEslint) {
          spinner.setText('Installing ESLint (one-time)...');
          execSync('npm install -g eslint', { stdio: 'ignore' });
        }

        if (!hasHtmlvalidate) {
          spinner.setText('Installing HTML Validator (one-time)...');
          execSync('npm install -g html-validate', { stdio: 'ignore' });
        }

        // Run JavaScript analysis
        spinner.setText('Analyzing JavaScript files...');

        const jsResults = { errors: 0, warnings: 0, files: 0 };

        try {
          const jsOutput = execSync(`npx eslint "${options.dir}" --ext .js,.jsx,.ts,.tsx -f json`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
          });

          const eslintResults = JSON.parse(jsOutput);

          eslintResults.forEach(file => {
            if (file.messages.length > 0) {
              jsResults.files++;

              file.messages.forEach(msg => {
                if (msg.severity === 2) jsResults.errors++;
                else if (msg.severity === 1) jsResults.warnings++;
              });
            }
          });
        } catch (e) {
          // ESLint exits with error code if it finds issues
          try {
            const output = e.stdout;
            if (output) {
              const eslintResults = JSON.parse(output);

              eslintResults.forEach(file => {
                if (file.messages.length > 0) {
                  jsResults.files++;

                  file.messages.forEach(msg => {
                    if (msg.severity === 2) jsResults.errors++;
                    else if (msg.severity === 1) jsResults.warnings++;
                  });
                }
              });
            }
          } catch (_) {
            // Ignore parse errors
          }
        }

        // Run HTML analysis
        spinner.setText('Analyzing HTML files...');

        const htmlResults = { errors: 0, warnings: 0, files: 0 };

        try {
          const htmlOutput = execSync(
            `npx html-validate "${options.dir}/**/*.html" --formatter json`,
            {
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'ignore']
            }
          );

          const htmlValidateResults = JSON.parse(htmlOutput);

          Object.keys(htmlValidateResults.results).forEach(file => {
            const fileResults = htmlValidateResults.results[file];
            if (fileResults.messages.length > 0) {
              htmlResults.files++;

              fileResults.messages.forEach(msg => {
                if (msg.severity === 2) htmlResults.errors++;
                else if (msg.severity === 1) htmlResults.warnings++;
              });
            }
          });
        } catch (e) {
          // HTML validator might exit with error
          try {
            const output = e.stdout;
            if (output) {
              const htmlValidateResults = JSON.parse(output);

              Object.keys(htmlValidateResults.results).forEach(file => {
                const fileResults = htmlValidateResults.results[file];
                if (fileResults.messages.length > 0) {
                  htmlResults.files++;

                  fileResults.messages.forEach(msg => {
                    if (msg.severity === 2) htmlResults.errors++;
                    else if (msg.severity === 1) htmlResults.warnings++;
                  });
                }
              });
            }
          } catch (_) {
            // Ignore parse errors
          }
        }

        spinner.succeed('Code quality analysis complete');

        // Display results
        console.log('\n' + chalk.cyan('JavaScript Quality:'));
        if (jsResults.errors > 0) {
          console.log(chalk.red(`✗ ${jsResults.errors} errors`));
        } else {
          console.log(chalk.green('✓ No errors'));
        }
        console.log(chalk.yellow(`⚠ ${jsResults.warnings} warnings`));
        console.log(chalk.gray(`Files with issues: ${jsResults.files}`));

        console.log('\n' + chalk.cyan('HTML Quality:'));
        if (htmlResults.errors > 0) {
          console.log(chalk.red(`✗ ${htmlResults.errors} errors`));
        } else {
          console.log(chalk.green('✓ No errors'));
        }
        console.log(chalk.yellow(`⚠ ${htmlResults.warnings} warnings`));
        console.log(chalk.gray(`Files with issues: ${htmlResults.files}`));

        console.log('\n' + chalk.cyan('Next steps:'));
        if (jsResults.errors > 0 || jsResults.warnings > 0) {
          console.log(`- Run ${chalk.cyan('npx eslint')} to see JavaScript issues in detail`);
        }
        if (htmlResults.errors > 0 || htmlResults.warnings > 0) {
          console.log(`- Run ${chalk.cyan('npx html-validate')} to see HTML issues in detail`);
        }

        // Return error code if we found errors
        if (jsResults.errors > 0 || htmlResults.errors > 0) {
          process.exitCode = 1;
        }
      } catch (error) {
        spinner.fail(`Code quality analysis failed: ${error.message}`);
        process.exitCode = 1;
      }
    });

  analyze
    .command('size')
    .description('Analyze site file sizes')
    .option('-d, --dir <directory>', 'Directory to analyze', '_site')
    .action(async options => {
      const spinner = new Spinner(`Analyzing file sizes in ${options.dir}...`).start();

      try {
        // Check if directory exists
        if (!fs.existsSync(options.dir)) {
          spinner.fail(`Directory not found: ${options.dir}`);
          console.log(chalk.yellow('Have you built the site? Try running `npm run build` first.'));
          return;
        }

        // Helper function to get all files recursively
        function getAllFiles(dir, fileList = []) {
          const files = fs.readdirSync(dir);

          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              fileList = getAllFiles(filePath, fileList);
            } else {
              fileList.push({
                path: filePath,
                size: stat.size,
                extension: path.extname(filePath).toLowerCase()
              });
            }
          });

          return fileList;
        }

        const files = getAllFiles(options.dir);
        spinner.succeed(`Analysis complete: ${files.length} files found`);

        // Calculate total size
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        // Group by file type
        const fileTypes = {};
        files.forEach(file => {
          const ext = file.extension || 'unknown';
          if (!fileTypes[ext]) {
            fileTypes[ext] = {
              count: 0,
              totalSize: 0,
              files: []
            };
          }

          fileTypes[ext].count++;
          fileTypes[ext].totalSize += file.size;
          fileTypes[ext].files.push(file);
        });

        // Display summary
        console.log('\n' + chalk.cyan('Site Size Analysis:'));
        console.log(chalk.gray(`Total size: ${formatSize(totalSize)}`));
        console.log(chalk.gray(`Total files: ${files.length}`));

        // Display file types by size (descending)
        console.log('\n' + chalk.cyan('Size by File Type:'));

        const Table = require('cli-table3');
        const table = new Table({
          head: ['File Type', 'Count', 'Total Size', '% of Site'],
          style: { head: ['cyan'] }
        });

        Object.entries(fileTypes)
          .sort((a, b) => b[1].totalSize - a[1].totalSize)
          .forEach(([ext, info]) => {
            table.push([
              ext === '' ? '(no extension)' : ext,
              info.count.toString(),
              formatSize(info.totalSize),
              ((info.totalSize / totalSize) * 100).toFixed(1) + '%'
            ]);
          });

        console.log(table.toString());

        // Find largest files
        console.log('\n' + chalk.cyan('Largest Files:'));

        const largestFilesTable = new Table({
          head: ['Size', 'Path'],
          style: { head: ['cyan'] },
          colWidths: [15, 60]
        });

        files
          .sort((a, b) => b.size - a.size)
          .slice(0, 10)
          .forEach(file => {
            largestFilesTable.push([formatSize(file.size), path.relative(options.dir, file.path)]);
          });

        console.log(largestFilesTable.toString());

        // Performance suggestions
        console.log('\n' + chalk.cyan('Performance Suggestions:'));

        // Check for large images
        const largeImages = files.filter(
          file =>
            ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.extension) &&
            file.size > 200 * 1024 // 200 KB
        );

        if (largeImages.length > 0) {
          console.log(
            `${chalk.yellow('⚠')} Found ${largeImages.length} large images that could be optimized`
          );
          console.log(chalk.gray('   Consider using image optimization tools or WebP format'));
        } else {
          console.log(`${chalk.green('✓')} No excessively large images found`);
        }

        // Check for large JavaScript
        const largeJs = files.filter(
          file => ['.js'].includes(file.extension) && file.size > 100 * 1024 // 100 KB
        );

        if (largeJs.length > 0) {
          console.log(`${chalk.yellow('⚠')} Found ${largeJs.length} large JavaScript files`);
          console.log(chalk.gray('   Consider code splitting or minification'));
        } else {
          console.log(`${chalk.green('✓')} JavaScript files are reasonably sized`);
        }

        // Check for large CSS
        const largeCss = files.filter(
          file => ['.css'].includes(file.extension) && file.size > 50 * 1024 // 50 KB
        );

        if (largeCss.length > 0) {
          console.log(`${chalk.yellow('⚠')} Found ${largeCss.length} large CSS files`);
          console.log(chalk.gray('   Consider splitting or removing unused CSS'));
        } else {
          console.log(`${chalk.green('✓')} CSS files are reasonably sized`);
        }

        // Check for favicons
        const hasFavicon = files.some(file => path.basename(file.path).includes('favicon'));

        if (!hasFavicon) {
          console.log(`${chalk.yellow('⚠')} No favicon detected`);
        } else {
          console.log(`${chalk.green('✓')} Favicon found`);
        }
      } catch (error) {
        spinner.fail(`Analysis failed: ${error.message}`);
      }

      // Helper function to format file sizes
      function formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
      }
    });

  return analyze;
}

module.exports = registerAnalyzeCommands;
