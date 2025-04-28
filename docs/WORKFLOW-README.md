# GitHub Actions Workflow Documentation

## Active Workflows

### pages-build-deployment.yml

This is the primary workflow for deploying content to GitHub Pages. It:

1. Builds the project using `npm run build`
2. Uploads the built files as an artifact
3. Deploys the artifact to GitHub Pages

### lighthouse.yml (if enabled)

This workflow runs Lighthouse performance tests on the deployed site.

### test.yml (if enabled)

This workflow runs tests on the codebase.

## Disabled Workflows

Several workflows have been disabled to prevent deployment conflicts:

- build-deploy.yml
- Multiple "Build and Deploy to GitHub Pages" workflows
- Multiple "Deploy to GitHub Pages" workflows
- GitHub Pages Deployment workflows

## How This Works

GitHub Pages now uses a standardized deployment process with specific permissions and concurrency settings. Our `pages-build-deployment.yml` file follows GitHub's recommended pattern for GitHub Pages deployment to ensure successful builds and deployments.

## Troubleshooting

If you encounter deployment failures:

1. Check that only one workflow is attempting to deploy to GitHub Pages
2. Ensure proper permissions are set in the workflow file
3. Verify that the concurrency settings prevent parallel deployments
4. Confirm that the build script is successfully preparing files for deployment

## Modifying the Workflow

When modifying the GitHub Actions workflow:

1. Test changes in a branch before merging to main
2. Don't enable multiple workflows that deploy to GitHub Pages
3. Keep the permissions and concurrency settings intact

```

```
