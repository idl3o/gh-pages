# GitHub Actions Troubleshooting Guide

This document provides solutions for common GitHub Actions workflow issues encountered in the Web3 Crypto Streaming Service repository.

## Common Issues and Resolutions

### 1. Deployment Failures

#### Symptoms:
- "Error: The deploy step encountered an error"
- Repository content not updating on GitHub Pages

#### Resolutions:

1. **Check Repository Permissions**:
   ```
   Settings > Actions > General > Workflow permissions
   ```
   Ensure "Read and write permissions" is selected to allow workflows to push to the gh-pages branch.

2. **Verify Branch Protection**:
   ```
   Settings > Branches > Branch protection rules
   ```
   Make sure the `gh-pages` branch doesn't have protection rules blocking force pushes from Actions.

3. **Check Deploy Action Configuration**:
   Ensure the deploy action is correctly configured:
   ```yaml
   - name: Deploy to GitHub Pages
     uses: JamesIves/github-pages-deploy-action@v4
     with:
       branch: gh-pages  # Must match GitHub Pages publishing source
       folder: .         # Directory containing built files
   ```

4. **Verify GitHub Pages Source**:
   ```
   Settings > Pages > Build and deployment > Source
   ```
   Ensure it is set to "Deploy from a branch" and the branch is set to "gh-pages".

### 2. URL Validation Failures

#### Symptoms:
- "URL validation failed" message in workflow logs
- Deployment proceeds but with warnings

#### Resolutions:

1. **Run URL Check Locally**:
   ```bash
   node scripts/url-checker.js
   ```
   This will show broken links you need to fix.

2. **Common URL Issues**:
   - Absolute URLs pointing to localhost
   - Missing files in the repository
   - External resources that are temporarily down

3. **Temporarily Bypass Checks**:
   Add URLs to an exclusion list in `scripts/url-checker.js` if they are known to be valid but temporarily failing.

### 3. Workflow Conflicts

#### Symptoms:
- Multiple workflows running simultaneously
- Inconsistent deployment results
- Failed workflows with cryptic errors

#### Resolutions:

1. **Consolidate Workflows**:
   Use the unified workflow (`unified-deploy.yml`) as your primary workflow and disable or remove redundant workflows.

2. **Check Trigger Conditions**:
   Ensure each workflow has unique trigger conditions to avoid conflicts:
   ```yaml
   on:
     push:
       branches: [ main ]
       paths-ignore:
         - 'docs/**'
         - '*.md'
   ```

3. **Use Workflow Concurrency**:
   Add concurrency settings to prevent simultaneous runs:
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

### 4. Node.js and NPM Issues

#### Symptoms:
- "Cannot find module" errors
- Package installation failures

#### Resolutions:

1. **Use Explicit Versioning**:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v3
     with:
       node-version: '18.x'
   ```

2. **Cache Dependencies**:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v3
     with:
       node-version: '18.x'
       cache: 'npm'
   ```

3. **Clean Installation**:
   ```yaml
   - name: Install Dependencies
     run: |
       rm -rf node_modules package-lock.json
       npm install
   ```

### 5. Diagnosis and Debugging

#### Useful Diagnostic Tools:

1. **Workflow Run Logs**:
   Navigate to Actions tab > Select workflow run > Full logs

2. **Debug Logging**:
   Enable detailed logs by setting repository secret:
   ```
   Settings > Secrets > Actions > New repository secret
   Name: ACTIONS_STEP_DEBUG
   Value: true
   ```

3. **Local Workflow Testing**:
   Use [act](https://github.com/nektos/act) to run workflows locally:
   ```bash
   act -j build-and-deploy
   ```

4. **Repository Diagnostic Script**:
   Run the diagnostic script to check for common issues:
   ```bash
   bash scripts/debug-actions.sh
   ```

## Getting Additional Help

If you're still experiencing issues after trying these resolutions:

1. Check [GitHub Status](https://www.githubstatus.com/) for any ongoing service disruptions
2. Search for similar issues in the [GitHub Actions documentation](https://docs.github.com/en/actions)
3. Create an issue in the repository with detailed information:
   - Workflow file content
   - Error message
   - Steps to reproduce
   - Screenshots if applicable
