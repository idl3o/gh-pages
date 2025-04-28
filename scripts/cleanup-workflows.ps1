# Workflow Cleanup Script
# This script archives redundant GitHub workflow files while preserving the unified workflows
# April 28, 2025

# Set strict error handling
$ErrorActionPreference = "Stop"

# Define directories
$workflowsDir = Join-Path $PSScriptRoot "..\\.github\\workflows"
$backupDir = Join-Path $PSScriptRoot "..\\workflow-backups"

# Create backup directory if it doesn't exist
if (-not (Test-Path -Path $backupDir)) {
    Write-Host "Creating backup directory: $backupDir"
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Timestamp for the backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveDir = Join-Path $backupDir "workflows_$timestamp"
New-Item -ItemType Directory -Path $archiveDir | Out-Null

# Files to preserve (do not archive these)
$preserveFiles = @(
    "unified-testing.yml",
    "unified-deploy.yml"
)

# Move redundant workflow files to the backup directory
$workflowFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"
$archivedCount = 0

foreach ($file in $workflowFiles) {
    if ($preserveFiles -notcontains $file.Name) {
        Write-Host "Archiving: $($file.Name)"
        Move-Item -Path $file.FullName -Destination (Join-Path $archiveDir $file.Name)
        $archivedCount++
    }
    else {
        Write-Host "Preserving: $($file.Name)" -ForegroundColor Green
    }
}

# Create a README file in the archive directory
$readmeContent = @"
# Archived GitHub Workflows

These workflow files were archived on $(Get-Date -Format "yyyy-MM-dd") as part of the GitHub Actions workflow consolidation project.

They have been replaced by two unified workflows:
- unified-testing.yml: Handles all testing operations
- unified-deploy.yml: Handles site building and deployment to GitHub Pages

DO NOT restore these files to the .github/workflows directory as they may conflict with the unified workflows.
"@

$readmeContent | Out-File -FilePath (Join-Path $archiveDir "README.md") -Encoding utf8

Write-Host "`nWorkflow cleanup complete!" -ForegroundColor Cyan
Write-Host "- Archived $archivedCount workflow files to: $archiveDir"
Write-Host "- Preserved $($preserveFiles.Count) unified workflow files"
Write-Host "`nTo restore an archived file for reference:"
Write-Host "Copy-Item -Path '$archiveDir\[filename].yml' -Destination [target path]"