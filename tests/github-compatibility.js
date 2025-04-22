/**
 * GitHub Compatibility Test Script
 * This script verifies that the project is compatible with GitHub Pages
 */

const fs = require('fs');
const path = require('path');

console.log('Starting GitHub compatibility checks...');

// Check for required files
const requiredFiles = [
  'index.html',
  'package.json',
  '.github/workflows/pages-build-deployment.yml'
];

let hasErrors = false;

// Check each required file
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing required file: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found required file: ${file}`);
  }
});

// Check for GitHub Pages configuration
const ghPagesConfig = path.join(process.cwd(), '_config.yml');
if (fs.existsSync(ghPagesConfig)) {
  console.log('✅ GitHub Pages configuration found (_config.yml)');

  // Read config file
  const configContent = fs.readFileSync(ghPagesConfig, 'utf8');

  // Check for common GitHub Pages settings
  if (!configContent.includes('baseurl:')) {
    console.warn('⚠️ No baseurl setting found in _config.yml');
  }

  if (!configContent.includes('url:')) {
    console.warn('⚠️ No url setting found in _config.yml');
  }
} else {
  console.log('ℹ️ No GitHub Pages configuration found (_config.yml), assuming static HTML site');
}

// Check for valid package.json
try {
  const packageJson = require('../package.json');
  console.log('✅ package.json is valid JSON');

  // Check for essential scripts
  const requiredScripts = ['build', 'test'];
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      console.warn(`⚠️ Missing recommended script in package.json: ${script}`);
    } else {
      console.log(`✅ Found script in package.json: ${script}`);
    }
  }
} catch (error) {
  console.error('❌ Invalid package.json file:', error.message);
  hasErrors = true;
}

// Check for workflow files
const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
if (fs.existsSync(workflowsDir)) {
  const workflows = fs
    .readdirSync(workflowsDir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
  console.log(`✅ Found ${workflows.length} GitHub workflow files`);

  // Check each workflow file for GitHub Pages deployment
  let hasDeployWorkflow = false;
  for (const workflow of workflows) {
    const content = fs.readFileSync(path.join(workflowsDir, workflow), 'utf8');
    if (content.includes('actions/deploy-pages') || content.includes('deploy to github pages')) {
      hasDeployWorkflow = true;
      console.log(`✅ Found GitHub Pages deployment in workflow: ${workflow}`);
    }
  }

  if (!hasDeployWorkflow) {
    console.warn('⚠️ No GitHub Pages deployment workflow found');
  }
} else {
  console.error('❌ No .github/workflows directory found');
  hasErrors = true;
}

// Summary
if (hasErrors) {
  console.error('❌ GitHub compatibility check failed with errors');
  process.exit(1);
} else {
  console.log('✅ GitHub compatibility check passed');
  process.exit(0);
}
