# Disabled Workflows

This directory contains workflow files that have been disabled to prevent conflicts with our main `github-pages.yml` workflow.

Multiple workflows attempting to deploy to GitHub Pages simultaneously can cause conflicts and failures. The consolidated workflow handles:

1. Code linting and quality checks
2. Security scanning
3. Building the site
4. Deploying to GitHub Pages

If you need to re-enable any of these workflows, make sure to disable the corresponding functionality in the main workflow to avoid conflicts.

```

```
