# Deployment Configuration

This document describes the deployment configuration for the Web3 Crypto Streaming Service website.

## GitHub Pages Deployment

The site is automatically deployed to GitHub Pages using GitHub Actions workflows whenever changes are pushed to the `main` branch.

### Domain Configuration

The site is configured to be deployed at:
- **URL:** https://idl3o.github.io
- **Base Path:** /gh-pages

A CNAME file has been added to the repository root to ensure proper domain configuration. This file is automatically copied to the build directory during deployment.

### Unified Deployment Workflow

The main deployment process is handled by the `.github/workflows/unified-deploy.yml` workflow, which:

1. Checks out the repository code
2. Sets up the Node.js environment
3. Installs dependencies
4. Validates all URLs in HTML files
5. Properly configures domain settings
6. Deploys the site to the `gh-pages` branch

### Manual Deployment

You can manually trigger a deployment by:

1. Going to the "Actions" tab in the GitHub repository
2. Selecting the "Build and Deploy to GitHub Pages" workflow
3. Clicking "Run workflow"
4. Optionally providing a reason for the manual deployment

### Deployment Validation

After deployment, verify that:
- The site is accessible at https://idl3o.github.io/gh-pages/
- All pages render correctly
- All links function properly

## URL Validation

The unified workflow includes URL validation to catch broken links before deployment. While this doesn't prevent deployment if broken links are found, it does flag issues in the workflow logs.

To run URL validation locally:

```bash
node scripts/url-checker.js
```

## Troubleshooting

If deployment fails:

1. Check the GitHub Actions logs for detailed error messages
2. Verify that all HTML is valid
3. Check for path issues (GitHub Pages is case-sensitive)
4. Ensure all dependencies are properly installed

For persistent issues, please open an issue in the repository describing the problem in detail.
