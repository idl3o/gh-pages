#!/usr/bin/env node

/**
 * GitHub Pages Diagnostics Tool
 * This script checks for common issues with GitHub Pages deployments
 * and provides recommendations for fixing them.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const ISSUES = [];
const FIXES = [];

console.log('GitHub Pages Diagnostics Tool');
console.log('=============================\n');

// Check if running in the correct directory
try {
  console.log('Checking repository structure...');

  // Check repository URL
  let repoUrl = '';
  try {
    repoUrl = execSync('git config --get remote.origin.url', { cwd: ROOT_DIR }).toString().trim();
    console.log(`Repository URL: ${repoUrl}`);

    if (!repoUrl.includes('github.com')) {
      ISSUES.push('Repository does not appear to be hosted on GitHub');
    }
    // eslint-disable-next-line no-unused-vars
  } catch (_) {
    ISSUES.push('Not a git repository or git is not installed');
  }

  // Check for _config.yml
  const configPath = path.join(ROOT_DIR, '_config.yml');
  const configExists = fs.existsSync(configPath);
  console.log(`_config.yml exists: ${configExists}`);

  let baseUrl = '';
  let siteUrl = '';
  let configContent = '';
  // Jekyll status tracking - used in conditional later in the code
  const jekyllEnabled = configExists;

  if (configExists) {
    configContent = fs.readFileSync(configPath, 'utf8');

    // Extract baseurl and url
    const baseUrlMatch = configContent.match(/baseurl:\s*["'](.+?)["']/);
    baseUrl = baseUrlMatch ? baseUrlMatch[1] : '';

    const urlMatch = configContent.match(/url:\s*["'](.+?)["']/);
    siteUrl = urlMatch ? urlMatch[1] : '';

    console.log(`Base URL: ${baseUrl}`);
    console.log(`Site URL: ${siteUrl}`);

    // Check if theme is specified
    const themeMatch = configContent.match(/theme:\s*(.+)/);
    const remoteThemeMatch = configContent.match(/remote_theme:\s*(.+)/);

    if (themeMatch || remoteThemeMatch) {
      console.log(
        `Theme specified: ${themeMatch ? themeMatch[1].trim() : remoteThemeMatch[1].trim()}`
      );
    } else {
      ISSUES.push('No Jekyll theme specified in _config.yml');
      FIXES.push('Add a theme: specification to _config.yml (e.g., theme: minima)');
    }
  } else {
    ISSUES.push('_config.yml not found');
    FIXES.push('Create a _config.yml file with at least title, description, url and baseurl');
  }

  // Check for .nojekyll
  const nojekyllPath = path.join(ROOT_DIR, '.nojekyll');
  const nojekyllExists = fs.existsSync(nojekyllPath);
  console.log(`.nojekyll exists: ${nojekyllExists}`);

  if (nojekyllExists) {
    if (
      jekyllEnabled &&
      configContent &&
      (configContent.includes('theme:') || configContent.includes('remote_theme:'))
    ) {
      ISSUES.push('Jekyll configuration exists but .nojekyll is present (contradiction)');
      FIXES.push(
        'Either remove .nojekyll to enable Jekyll processing OR remove Jekyll theme configurations'
      );
    }
  }

  // Check if index file exists
  const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
  const indexMdPath = path.join(ROOT_DIR, 'index.md');

  const indexHtmlExists = fs.existsSync(indexHtmlPath);
  const indexMdExists = fs.existsSync(indexMdPath);

  console.log(`index.html exists: ${indexHtmlExists}`);
  console.log(`index.md exists: ${indexMdExists}`);

  if (!indexHtmlExists && !indexMdExists) {
    ISSUES.push('No index file found (index.html or index.md)');
    FIXES.push('Create an index.html or index.md file as the entry point for your site');
  }

  if (indexHtmlExists && indexMdExists) {
    ISSUES.push('Both index.html and index.md exist, which may cause confusion');
    FIXES.push('Choose either index.html OR index.md as your main entry point');
  }

  // Check HTML files for correct base paths
  console.log('Checking HTML files for correct base paths...');
  let htmlFiles;

  try {
    htmlFiles = execSync(
      'find . -name "*.html" -not -path "./node_modules/*" -not -path "./_site/*"',
      { cwd: ROOT_DIR }
    )
      .toString()
      .trim()
      .split('\n');
    // eslint-disable-next-line no-unused-vars
  } catch (_) {
    // Fallback for Windows
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory() && file !== 'node_modules' && file !== '_site') {
          getAllFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
          fileList.push(filePath);
        }
      });
      return fileList;
    };

    htmlFiles = getAllFiles(ROOT_DIR).map(file => path.relative(ROOT_DIR, file));
  }

  if (htmlFiles && htmlFiles.length > 0) {
    console.log(`Found ${htmlFiles.length} HTML files`);

    let pathIssues = 0;

    for (const htmlFile of htmlFiles) {
      if (!htmlFile) continue;

      const fullPath = path.join(ROOT_DIR, htmlFile);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for absolute URLs without baseurl
      if (baseUrl && baseUrl !== '' && baseUrl !== '/') {
        const wrongPaths = content.match(/href=["']\/[^"']*["']/g);

        if (wrongPaths && wrongPaths.length > 0) {
          pathIssues += wrongPaths.length;
          ISSUES.push(
            `File ${htmlFile} contains ${wrongPaths.length} absolute paths without baseurl`
          );
        }
      }
    }

    if (pathIssues > 0) {
      FIXES.push(`Fix absolute URLs to include baseurl prefix (${baseUrl})`);
    }
  }

  // Check deployment
  console.log('Checking deployment settings...');

  // Check for GitHub Actions workflow
  const workflowDir = path.join(ROOT_DIR, '.github', 'workflows');
  const workflowExists = fs.existsSync(workflowDir);

  if (!workflowExists) {
    ISSUES.push('No GitHub Actions workflows found');
    FIXES.push('Create a GitHub Actions workflow file for automated deployment');
  } else {
    const workflowFiles = fs.readdirSync(workflowDir);

    if (workflowFiles.length === 0) {
      ISSUES.push('GitHub Actions directory exists but no workflow files found');
      FIXES.push('Create a workflow file in .github/workflows/ for automated deployment');
    } else {
      let hasGHPagesWorkflow = false;

      for (const file of workflowFiles) {
        const content = fs.readFileSync(path.join(workflowDir, file), 'utf8');
        if (content.includes('github-pages') || content.includes('gh-pages')) {
          hasGHPagesWorkflow = true;
          break;
        }
      }

      if (!hasGHPagesWorkflow) {
        ISSUES.push('No GitHub Pages deployment workflow found');
        FIXES.push('Add GitHub Pages deployment steps to your workflow file');
      }
    }
  }

  // Check if GitHub Pages is enabled
  let ghPagesEnabled = false;
  try {
    const ghPagesCheck = execSync('git branch -a', { cwd: ROOT_DIR }).toString().trim();
    ghPagesEnabled = ghPagesCheck.includes('gh-pages') || ghPagesCheck.includes('origin/gh-pages');
    console.log(`GitHub Pages branch detected: ${ghPagesEnabled}`);

    if (!ghPagesEnabled) {
      ISSUES.push('No gh-pages branch found, GitHub Pages might not be enabled');
    }
    // eslint-disable-next-line no-unused-vars
  } catch (_) {
    ISSUES.push('Could not check git branches');
  }

  // Output results
  console.log('\n=============================');
  console.log('Diagnosis Complete');
  console.log('=============================\n');

  if (ISSUES.length === 0) {
    console.log('✅ No issues found with your GitHub Pages setup!');
  } else {
    console.log(`⚠️ Found ${ISSUES.length} potential issues:\n`);

    ISSUES.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });

    console.log('\n📋 Recommended fixes:\n');

    FIXES.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });

    console.log('\nFor more information on GitHub Pages, visit: https://docs.github.com/en/pages');
  }
  // eslint-disable-next-line no-unused-vars
} catch (_) {
  console.error('An error occurred while running diagnostics:');
}
