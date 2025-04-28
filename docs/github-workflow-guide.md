# GitHub Workflow Guide

This guide explains the consolidated GitHub Actions workflows for the StreamChain project. We've simplified the CI/CD process by reducing from 24 workflows to just 2 key workflows.

## Workflow Structure

Our CI/CD process now consists of two main workflows:

1. **Unified Testing Workflow (`unified-testing.yml`)**
2. **Unified Deployment Workflow (`unified-deploy.yml`)**

This consolidation helps reduce conflicts, improves maintainability, and provides a more consistent deployment process.

## Testing Workflow

The `unified-testing.yml` workflow handles all testing aspects of the codebase:

### Jobs

- **Lint**: Code quality checks including linting and PowerShell script validation
- **Unit Tests**: Core tests, GitHub compatibility tests, and security audits
- **Compatibility**: Browser compatibility tests (Chrome, Firefox, Safari, Edge)
- **Responsive**: Responsive design testing across different device sizes
- **Verify Links**: Link validation throughout the site

### Triggering the Testing Workflow

The testing workflow runs automatically on:
- Any push to any branch (except documentation changes)
- Pull requests targeting the main branch

You can also run it manually with different scopes:
1. Go to the GitHub Actions tab
2. Select "Unified Testing Workflow"
3. Click "Run workflow"
4. Choose a test scope:
   - `all`: Run all tests
   - `quick`: Run minimal tests for faster feedback
   - `compatibility`: Focus on browser compatibility
   - `responsive`: Focus on responsive design testing

## Deployment Workflow

The `unified-deploy.yml` workflow handles building and deploying the site to GitHub Pages:

### Jobs

- **Build**: Prepares the environment, builds the site, and validates URLs
- **Deploy**: Deploys the built site to GitHub Pages
- **Notify**: Records the deployment status

### Triggering the Deployment Workflow

The deployment workflow runs automatically on:
- Pushes to the main branch

You can also run it manually:
1. Go to the GitHub Actions tab
2. Select "Build and Deploy to GitHub Pages"
3. Click "Run workflow"
4. Optionally provide a reason for the manual deployment

## Workflow Files Organization

Previous workflow files have been archived to the `workflow-backups` directory to reduce clutter while preserving history. Use the cleanup script if needed:

```powershell
# Run from the project root directory
.\scripts\cleanup-workflows.ps1
```

## Troubleshooting

If you encounter workflow issues:

1. Check the workflow run logs in GitHub Actions
2. Verify that you're not creating new workflow files that might conflict
3. For persistent issues, refer to the `GITHUB_ACTIONS_TROUBLESHOOTING.md` document

## Best Practices

1. **Don't Create New Workflow Files**: Add new jobs to the unified workflows instead
2. **Use Branch Protection**: Ensure the main branch is protected to prevent direct pushes
3. **Regularly Update Dependencies**: Use `npm audit` and keep Node.js versions current
4. **Test Locally**: Run tests locally before pushing with `npm run test:quick-test`