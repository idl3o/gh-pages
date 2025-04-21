# GitHub Actions Guide: Understanding and Fixing Common Failures

GitHub Actions is a powerful CI/CD platform that allows you to automate your software development workflows. However, workflows can fail for various reasons. This guide explains common failure points and how to fix them.

## Common Failure Points

### 1. Environment Setup Issues

**Problem**: Missing or incompatible Node.js, Ruby, or other runtime environments.

**Solution**:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm' # Enable dependency caching
```

### 2. Dependency Management

**Problem**: Missing lock files (package-lock.json, yarn.lock) causing inconsistent builds.

**Solution**: Always commit your lock files to the repository, or generate them during workflow:

```yaml
- name: Create lock file if missing
  run: npm install --package-lock-only
```

### 3. Branch & Permission Configuration

**Problem**: Workflows fail because the service account doesn't have permission to push to protected branches.

**Solution**: Ensure proper permissions are set in the workflow:

```yaml
permissions:
  contents: write # Required for pushing to branches
  pages: write # Required for GitHub Pages
  id-token: write # Required for GitHub Pages
```

### 4. Concurrent Workflow Conflicts

**Problem**: Multiple workflows running simultaneously on the same branch causing conflicts.

**Solution**: Use concurrency to manage workflows:

```yaml
concurrency:
  group: 'pages'
  cancel-in-progress: true
```

### 5. Caching Errors

**Problem**: Corrupted caches or misconfigured cache paths.

**Solution**: Use proper cache keys and paths:

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 6. GitHub Pages Specific Issues

**Problem**: Incorrect build output directory or missing configuration.

**Solution**: Ensure you're using the proper GitHub Pages actions:

```yaml
- name: Setup Pages
  uses: actions/configure-pages@v4

- name: Upload artifact
  uses: actions/upload-pages-artifact@v2
  with:
    path: '_site' # Must match your build output directory

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v3
```

## Debugging Workflow Issues

To diagnose issues with your GitHub Actions workflows:

1. Check the workflow run logs in the GitHub Actions tab
2. Enable debug logging by setting the secret `ACTIONS_STEP_DEBUG` to `true`
3. Use our diagnostic script:
   ```bash
   bash scripts/debug-actions.sh
   ```

## Best Practices

1. **Use specific action versions**: Don't use `@master` or `@main` tags as they may break your workflow with updates
2. **Add step IDs**: Makes it easier to reference steps in conditional logic
3. **Handle errors gracefully**: Use `continue-on-error` for non-critical steps
4. **Use meaningful step names**: Makes it easier to identify where failures occur
5. **Commit lock files**: Ensures consistent dependency versions

By following these guidelines, you'll create more reliable GitHub Actions workflows that are easier to debug when issues arise.
