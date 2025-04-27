# Code Cleanup Guide

This guide walks through the process of cleaning up duplicate files and consolidating CSS in the repository.

## Prerequisites

- Node.js 14+ installed
- Git access to the repository

## Setup

1. Make sure you're in the repository root directory
2. Install dependencies if needed:
   ```
   npm install
   ```

## Step-by-Step Cleanup Process

### 1. Identify Duplicate Files

Run the script to identify files with " 2.md", " 2.html", etc. suffixes:

```bash
npm run cleanup:find-duplicates
# or directly:
node scripts/identify-duplicates.js
```

This will:

- Search the repository for duplicate files
- Generate a report of duplicates in `scripts/duplicates.json`
- Display a summary in the console

### 2. Consolidate Duplicate Files

Review and consolidate duplicate files interactively:

```bash
npm run cleanup:consolidate
# or directly:
node scripts/consolidate-files.js
```

This will:

- Load the duplicates found in step 1
- Compare each duplicate with its original file
- Let you choose what to do with each duplicate:
  - Keep both files
  - Delete the duplicate
  - Replace the original with the duplicate
  - Choose the newest file
  - Skip the file

**Note:** By default, file operations are commented out for safety. Uncomment the relevant lines in the script when you're ready to make actual changes.

### 3. Consolidate CSS Files

Analyze and consolidate CSS files:

```bash
npm run cleanup:css
# or directly:
node scripts/consolidate-css.js
```

This will:

- Analyze all CSS files in the repository
- Identify duplicate selectors
- Generate a consolidated CSS file in `assets/css/consolidated.css`
- Create a CSS analysis report in `scripts/css-report.json`

### 4. Update the Consolidation Checklist

Update the CONSOLIDATION.md file to reflect completed tasks:

```bash
npm run cleanup:update-checklist
# or directly:
node scripts/update-consolidation-checklist.js
```

### 5. Run All Cleanup Steps

To run all steps in sequence:

```bash
npm run cleanup
```

## Verification

After running the cleanup scripts:

1. Check that `assets/css/consolidated.css` was created
2. Verify that duplicate files have been properly handled
3. Review the updated CONSOLIDATION.md file
4. Run the site locally to ensure everything still works

## Reverting Changes

If you need to revert changes:

```bash
git checkout -- .
```

Or to revert specific files:

```bash
git checkout -- path/to/file
```

## Committing Changes

Once you're satisfied with the cleanup:

```bash
git add .
git commit -m "Cleanup: Remove duplicate files and consolidate CSS"
git push
```
