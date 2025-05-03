/**
 * Analyze Commands
 *
 * Commands for analyzing site performance and metrics
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync, spawn, exec } = require('child_process'); // Import exec
const ora = require('ora');
const { Spinner, ProgressBar } = require('../utils/ui-helpers');
const http = require('http'); // Import http for server check

// Helper function to run a command asynchronously using spawn
function runCommandAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'pipe', ...options });
    let stdout = '';
    let stderr = '';

    if (proc.stdout) {
      proc.stdout.on('data', data => {
        stdout += data.toString();
      });
    }

    if (proc.stderr) {
      proc.stderr.on('data', data => {
        stderr += data.toString();
      });
    }

    proc.on('error', error => {
      reject(error);
    });

    proc.on('close', code => {
      if (code !== 0) {
        const errorMessage = stderr || `Process exited with code ${code}`;
        const error = new Error(errorMessage);
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Helper function to check if local server is ready
function checkServerReady(url, retries = 5, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryConnect = () => {
      http
        .get(url, res => {
          // Any response means the server is up
          res.resume(); // Consume response data to free up memory
          resolve(true);
        })
        .on('error', err => {
          attempts++;
          if (attempts >= retries) {
            reject(new Error(`Server check failed after ${retries} attempts: ${err.message}`));
          } else {
            setTimeout(tryConnect, delay);
          }
        });
    };
    tryConnect();
  });
}

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
      let localServer = null;

      try {
        let hasLighthouse = false;

        try {
          execSync('npx lighthouse --version', { stdio: 'ignore' });
          hasLighthouse = true;
        } catch (e) {}

        if (!hasLighthouse) {
          spinner.setText('Installing Lighthouse (one-time)...');
          execSync('npm install -g lighthouse', { stdio: 'ignore' });
        }

        const url = options.url || 'http://localhost:3000';

        if (!options.url) {
          spinner.setText('Starting local server...');
          localServer = spawn('npx', ['http-server', '.', '-p', '3000', '-c-1'], {
            stdio: 'ignore',
            detached: true
          });

          spinner.setText('Waiting for local server to be ready...');
          try {
            await checkServerReady(url); // Use the new check function
            spinner.succeed('Local server is ready.');
          } catch (serverError) {
            spinner.fail(`Local server failed to start: ${serverError.message}`);
            throw serverError; // Stop if server doesn't start
          }
        }

        spinner.setText(`Running performance audit on ${url}...`);

        const outputDir = path.join(process.cwd(), 'performance-reports');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const outputPath = path.join(outputDir, `performance-${timestamp}.html`);

        try {
          spinner.setText(`Running Lighthouse HTML report generation on ${url}...`);
          await runCommandAsync('npx', [
            'lighthouse',
            url,
            '--quiet',
            '--output',
            'html',
            '--output-path',
            outputPath
          ]);

          spinner.succeed('Performance analysis complete');

          const summaryJson = path.join(outputDir, 'summary.json');
          try {
            spinner.setText(`Running Lighthouse JSON report generation on ${url}...`);
            const { stdout: jsonOutput } = await runCommandAsync('npx', [
              'lighthouse',
              url,
              '--quiet',
              '--output',
              'json'
            ]);

            if (jsonOutput) {
              const results = JSON.parse(jsonOutput);

              console.log('\n' + chalk.cyan('Performance Results:'));

              const categories = results.categories;
              Object.keys(categories).forEach(key => {
                const score = Math.round(categories[key].score * 100);
                let color = chalk.red;

                if (score >= 90) color = chalk.green;
                else if (score >= 50) color = chalk.yellow;

                console.log(`${categories[key].title}: ${color(`${score}/100`)}`);
              });

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
            }
          } catch (e) {
            spinner.warn(`Could not generate/parse JSON summary: ${e.message || e}`);
          }

          console.log(chalk.green(`\nFull report saved to: ${outputPath}`));
          console.log(chalk.gray('Open this file in a browser to see the complete analysis.'));

          console.log('');
          if (process.platform === 'win32') {
            console.log(`Run: ${chalk.cyan(`start "${outputPath}"`)}`);
          } else if (process.platform === 'darwin') {
            console.log(`Run: ${chalk.cyan(`open "${outputPath}"`)}`);
          } else {
            console.log(`Run: ${chalk.cyan(`xdg-open "${outputPath}"`)}`);
          }
        } catch (error) {
          spinner.fail(`Lighthouse audit failed: ${error.message || error}`);
          if (error.stderr) {
            console.error(chalk.red(error.stderr));
          }
        }
      } catch (error) {
        spinner.fail(`Performance analysis failed: ${error.message}`);
      } finally {
        if (localServer) {
          spinner.setText('Stopping local server...');
          try {
            if (process.platform === 'win32') {
              execSync(`taskkill /pid ${localServer.pid} /f /t`, { stdio: 'ignore' });
            } else {
              process.kill(-localServer.pid);
            }
            spinner.succeed('Local server stopped.');
          } catch (killError) {
            spinner.warn(
              `Failed to stop local server (PID: ${localServer.pid}): ${killError.message}`
            );
          }
        }
      }
    });

  analyze
    .command('links')
    .description('Check for broken links')
    .option('-u, --url <url>', 'URL to analyze (default: local build)', 'http://localhost:3000')
    .option('--external', 'Check external links too (slower)', false)
    .action(async options => {
      const spinner = new Spinner('Preparing link checker...').start();
      let localServer = null; // Define here for finally block access

      try {
        try {
          execSync('npx broken-link-checker --version', { stdio: 'ignore' });
        } catch (e) {
          spinner.setText('Installing link checker (one-time)...');
          execSync('npm install -g broken-link-checker', { stdio: 'ignore' });
        }

        if (options.url.includes('localhost')) {
          spinner.setText('Starting local server...');
          localServer = spawn('npx', ['http-server', '.', '-p', '3000', '-c-1'], {
            stdio: 'ignore',
            detached: true
          });

          spinner.setText('Waiting for local server to be ready...');
          try {
            await checkServerReady(options.url); // Use the new check function
            spinner.succeed('Local server is ready.');
          } catch (serverError) {
            spinner.fail(`Local server failed to start: ${serverError.message}`);
            throw serverError; // Stop if server doesn't start
          }
        }

        spinner.setText(`Checking links on ${options.url}...`);

        const checkExternalFlag = options.external ? '' : '--exclude-external';

        const cmd = `npx broken-link-checker ${options.url} ${checkExternalFlag} --ordered --recursive --verbose`;

        let results = { brokenLinks: [], validLinks: [] };

        await new Promise((resolve, reject) => {
          const linkCheck = exec(cmd);
          let stdoutBuffer = '';

          linkCheck.stdout.on('data', data => {
            stdoutBuffer += data.toString();
            let lines = stdoutBuffer.split('\n');
            stdoutBuffer = lines.pop();

            lines.forEach(line => {
              spinner.setText(
                `Checking links... (${
                  results.validLinks.length + results.brokenLinks.length
                } links found)`
              );

              if (line.includes('─BROKEN─')) {
                results.brokenLinks.push(line.trim());
              } else if (line.includes('─OK─')) {
                results.validLinks.push(line.trim());
              }
            });
          });

          linkCheck.stderr.on('data', data => {
            console.error(chalk.yellow(`[link-checker stderr] ${data.toString().trim()}`));
          });

          linkCheck.on('error', error => {
            reject(error);
          });

          linkCheck.on('close', code => {
            resolve();
          });
        });

        if (results.brokenLinks.length > 0) {
          console.log('\n' + chalk.red('Broken links found:'));

          results.brokenLinks.forEach(link => {
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
      } finally {
        if (localServer) {
          spinner.setText('Stopping local server...');
          try {
            if (process.platform === 'win32') {
              execSync(`taskkill /pid ${localServer.pid} /f /t`, { stdio: 'ignore' });
            } else {
              process.kill(-localServer.pid);
            }
            spinner.succeed('Local server stopped.');
          } catch (killError) {
            spinner.warn(
              `Failed to stop local server (PID: ${localServer.pid}): ${killError.message}`
            );
          }
        }
      }
    });

  analyze
    .command('code-quality')
    .description('Run code quality analysis')
    .option('-d, --dir <directory>', 'Directory to analyze', '.')
    .action(async options => {
      const spinner = new Spinner('Preparing code quality analysis...').start();

      try {
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

        if (!hasEslint) {
          spinner.setText('Installing ESLint (one-time)...');
          execSync('npm install -g eslint', { stdio: 'ignore' });
        }

        if (!hasHtmlvalidate) {
          spinner.setText('Installing HTML Validator (one-time)...');
          execSync('npm install -g html-validate', { stdio: 'ignore' });
        }

        spinner.setText('Analyzing JavaScript files (ESLint)...');
        const jsResults = { errors: 0, warnings: 0, files: 0 };
        try {
          const { stdout: jsOutput } = await runCommandAsync('npx', [
            'eslint',
            options.dir,
            '--ext',
            '.js,.jsx,.ts,.tsx',
            '-f',
            'json'
          ]);
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
          if (e.stdout) {
            try {
              const eslintResults = JSON.parse(e.stdout);
              eslintResults.forEach(file => {
                if (file.messages.length > 0) {
                  jsResults.files++;
                  file.messages.forEach(msg => {
                    if (msg.severity === 2) jsResults.errors++;
                    else if (msg.severity === 1) jsResults.warnings++;
                  });
                }
              });
            } catch (parseError) {
              spinner.warn(`Could not parse ESLint JSON output after error: ${parseError.message}`);
              console.error(chalk.red(`ESLint raw output:\n${e.stdout}`));
            }
          } else {
            spinner.warn(`ESLint execution failed without output: ${e.message || e}`);
            if (e.stderr) console.error(chalk.red(e.stderr));
          }
        }

        spinner.setText('Analyzing HTML files (html-validate)...');
        const htmlResults = { errors: 0, warnings: 0, files: 0 };
        try {
          const { stdout: htmlOutput } = await runCommandAsync('npx', [
            'html-validate',
            `${options.dir}/**/*.html`,
            '--formatter',
            'json'
          ]);
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
          if (e.stdout) {
            try {
              const htmlValidateResults = JSON.parse(e.stdout);
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
            } catch (parseError) {
              spinner.warn(
                `Could not parse html-validate JSON output after error: ${parseError.message}`
              );
              console.error(chalk.red(`html-validate raw output:\n${e.stdout}`));
            }
          } else {
            spinner.warn(`html-validate execution failed without output: ${e.message || e}`);
            if (e.stderr) console.error(chalk.red(e.stderr));
          }
        }

        spinner.succeed('Code quality analysis complete');

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
        if (!fs.existsSync(options.dir)) {
          spinner.fail(`Directory not found: ${options.dir}`);
          console.log(chalk.yellow('Have you built the site? Try running `npm run build` first.'));
          return;
        }

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

        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

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

        console.log('\n' + chalk.cyan('Site Size Analysis:'));
        console.log(chalk.gray(`Total size: ${formatSize(totalSize)}`));
        console.log(chalk.gray(`Total files: ${files.length}`));

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

        console.log('\n' + chalk.cyan('Performance Suggestions:'));

        const largeImages = files.filter(
          file =>
            ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.extension) &&
            file.size > 200 * 1024
        );

        if (largeImages.length > 0) {
          console.log(
            `${chalk.yellow('⚠')} Found ${largeImages.length} large images that could be optimized`
          );
          console.log(chalk.gray('   Consider using image optimization tools or WebP format'));
        } else {
          console.log(`${chalk.green('✓')} No excessively large images found`);
        }

        const largeJs = files.filter(
          file => ['.js'].includes(file.extension) && file.size > 100 * 1024
        );

        if (largeJs.length > 0) {
          console.log(`${chalk.yellow('⚠')} Found ${largeJs.length} large JavaScript files`);
          console.log(chalk.gray('   Consider code splitting or minification'));
        } else {
          console.log(`${chalk.green('✓')} JavaScript files are reasonably sized`);
        }

        const largeCss = files.filter(
          file => ['.css'].includes(file.extension) && file.size > 50 * 1024
        );

        if (largeCss.length > 0) {
          console.log(`${chalk.yellow('⚠')} Found ${largeCss.length} large CSS files`);
          console.log(chalk.gray('   Consider splitting or removing unused CSS'));
        } else {
          console.log(`${chalk.green('✓')} CSS files are reasonably sized`);
        }

        const hasFavicon = files.some(file => path.basename(file.path).includes('favicon'));

        if (!hasFavicon) {
          console.log(`${chalk.yellow('⚠')} No favicon detected`);
        } else {
          console.log(`${chalk.green('✓')} Favicon found`);
        }
      } catch (error) {
        spinner.fail(`Analysis failed: ${error.message}`);
      }

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
