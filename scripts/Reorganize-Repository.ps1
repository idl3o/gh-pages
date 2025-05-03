#Requires -Version 5.0
<#
.SYNOPSIS
    Repository Structure Reorganization Script
.DESCRIPTION
    This script reorganizes the repository structure by:
    1. Creating logical directories
    2. Identifying and handling duplicate files
    3. Moving files to appropriate directories
    4. Creating backups of the original structure
.NOTES
    Author: GitHub Copilot
    Date: April 28, 2025
#>

$ErrorActionPreference = "Continue"
$repoRoot = (Get-Location).Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Define directories to create
$directoriesToCreate = @(
    "assets/fonts",
    "src/layouts",
    "backups/$timestamp"
)

# Define file extensions for categorization
$fileTypes = @{
    "Scripts"    = @(".js", ".ts", ".jsx", ".tsx")
    "Styles"     = @(".css", ".scss", ".less")
    "Documents"  = @(".md", ".txt", ".pdf", ".doc", ".docx")
    "Templates"  = @(".html", ".hbs", ".ejs", ".pug")
    "Config"     = @(".json", ".yml", ".yaml", ".toml", ".ini", ".config", ".conf")
    "Images"     = @(".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp")
    "Contracts"  = @(".sol")
    "PowerShell" = @(".ps1")
    "BatchFiles" = @(".cmd", ".bat")
    "ShellScripts" = @(".sh")
}

function Write-Log {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string]$Level = "Info"
    )

    $timestamp = Get-Date -Format "HH:mm:ss"

    switch ($Level) {
        "Info" {
            $color = "White"
            $prefix = "[$timestamp]"
        }
        "Warning" {
            $color = "Yellow"
            $prefix = "[$timestamp] WARNING:"
        }
        "Error" {
            $color = "Red"
            $prefix = "[$timestamp] ERROR:"
        }
        "Success" {
            $color = "Green"
            $prefix = "[$timestamp]"
        }
        default {
            $color = "White"
            $prefix = "[$timestamp]"
        }
    }

    Write-Host "$prefix $Message" -ForegroundColor $color
}

function Create-DirectoryStructure {
    Write-Log "Creating directory structure..."

    foreach ($dir in $directoriesToCreate) {
        $path = Join-Path -Path $repoRoot -ChildPath $dir
        if (-not (Test-Path -Path $path)) {
            try {
                New-Item -Path $path -ItemType Directory -Force | Out-Null
                Write-Log "  Creating: $dir" -Level "Success"
            }
            catch {
                Write-Log "  Failed to create directory: $dir - $($_.Exception.Message)" -Level "Error"
            }
        }
    }

    Write-Log "Directory structure created successfully" -Level "Success"
}

function Backup-ExistingStructure {
    $backupPath = Join-Path -Path $repoRoot -ChildPath "backups/$timestamp"
    $manifestPath = Join-Path -Path $backupPath -ChildPath "manifest.csv"

    Write-Log "Creating backup of current structure..."

    # Create manifest file
    Add-Content -Path $manifestPath -Value "FilePath,FileHash,FileSize,LastWriteTime"

    # Get all files
    $files = Get-ChildItem -Path $repoRoot -Recurse -File |
        Where-Object {
            -not $_.FullName.Contains("\backups\") -and
            -not $_.FullName.Contains("\node_modules\") -and
            -not $_.FullName.Contains("\.git\")
        }

    $totalFiles = $files.Count
    $processedFiles = 0

    # Progress bar setup
    Write-Progress -Activity "Creating backup manifest" -Status "0% Complete" -PercentComplete 0

    foreach ($file in $files) {
        $processedFiles++
        $percentComplete = [int](($processedFiles / $totalFiles) * 100)

        Write-Progress -Activity "Creating backup manifest" -Status "Processing: $($file.Name)" -PercentComplete $percentComplete

        try {
            # Try to get file hash, but continue if file is locked
            $hash = $null
            try {
                $hash = (Get-FileHash -Path $file.FullName -ErrorAction SilentlyContinue).Hash
            }
            catch {
                $hash = "FILE_LOCKED"
            }

            if ($null -eq $hash) { $hash = "FILE_LOCKED" }

            # Add to manifest
            $relativePath = $file.FullName.Replace($repoRoot + "\", "")
            $fileSize = $file.Length
            $lastModified = $file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")

            Add-Content -Path $manifestPath -Value "$relativePath,$hash,$fileSize,$lastModified"
        }
        catch {
            Write-Log "Error processing $($file.FullName): $($_.Exception.Message)" -Level "Warning"
        }
    }

    Write-Progress -Activity "Creating backup manifest" -Completed
}

function Find-DuplicateFiles {
    Write-Log "Looking for duplicate files..."

    $duplicateReportPath = Join-Path -Path $repoRoot -ChildPath "backups/$timestamp/duplicates.txt"
    Add-Content -Path $duplicateReportPath -Value "Duplicate Files Report - $timestamp`n"

    # Get all files but exclude some directories
    $files = Get-ChildItem -Path $repoRoot -Recurse -File |
        Where-Object {
            -not $_.FullName.Contains("\backups\") -and
            -not $_.FullName.Contains("\node_modules\") -and
            -not $_.FullName.Contains("\.git\")
        }

    # Group files by size first for efficiency
    $sizeGroups = $files | Group-Object -Property Length | Where-Object { $_.Count -gt 1 }

    $totalDuplicateSets = 0
    $count = 0

    foreach ($sizeGroup in $sizeGroups) {
        # For files of the same size, compute hash to confirm they're duplicates
        $hashGroups = $sizeGroup.Group | Group-Object -Property {
            try {
                (Get-FileHash -Path $_.FullName -ErrorAction SilentlyContinue).Hash
            }
            catch {
                # Return a unique value to avoid false duplicates
                "HASH_ERROR_" + (New-Guid).ToString()
            }
        } | Where-Object { $_.Count -gt 1 }

        foreach ($hashGroup in $hashGroups) {
            $count++
            Add-Content -Path $duplicateReportPath -Value "Duplicate Set #$($count):"

            $files = $hashGroup.Group
            foreach ($file in $files) {
                $relativePath = $file.FullName.Replace($repoRoot + "\", "")
                Add-Content -Path $duplicateReportPath -Value "  - $relativePath"
            }

            Add-Content -Path $duplicateReportPath -Value ""
            $totalDuplicateSets++
        }
    }

    if ($totalDuplicateSets -gt 0) {
        Write-Log "Found $totalDuplicateSets sets of duplicate files. See report at backups/$timestamp/duplicates.txt" -Level "Warning"
    }
    else {
        Write-Log "No duplicate files found." -Level "Success"
    }
}

function Find-DuplicateWithNumber {
    param (
        [string]$filePath
    )

    # Check if the file name contains a number (like "file 2.js", "file-2.js", etc.)
    $fileName = Split-Path -Leaf $filePath
    $fileNameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    $fileExt = [System.IO.Path]::GetExtension($fileName)

    # Patterns to check:
    # - "file 2.js" or "file 3.js"
    # - "file-2.js" or "file_2.js"
    # - "file (1).js"
    if ($fileNameWithoutExt -match " \d+$" -or
        $fileNameWithoutExt -match "[\-_]\d+$" -or
        $fileNameWithoutExt -match " \(\d+\)$") {

        # Extract the base name by removing the number pattern
        $baseName = $fileNameWithoutExt -replace " \d+$", "" -replace "[\-_]\d+$", "" -replace " \(\d+\)$", ""

        # Search for files with the base name (without the number)
        $directory = Split-Path -Parent $filePath
        $baseFiles = Get-ChildItem -Path $directory -Filter "$baseName$fileExt"

        if ($baseFiles) {
            return $baseFiles[0].FullName
        }
    }

    return $null
}

function Classify-Files {
    Write-Log "Classifying files by type..."

    $classificationPath = Join-Path -Path $repoRoot -ChildPath "backups/$timestamp/classification.txt"
    Add-Content -Path $classificationPath -Value "File Classification Report - $timestamp`n"

    # Get all files but exclude some directories
    $files = Get-ChildItem -Path $repoRoot -Recurse -File |
        Where-Object {
            -not $_.FullName.Contains("\backups\") -and
            -not $_.FullName.Contains("\node_modules\") -and
            -not $_.FullName.Contains("\.git\")
        }

    $classification = @{}
    foreach ($category in $fileTypes.Keys) {
        $classification[$category] = @()
    }
    $classification["Other"] = @()

    foreach ($file in $files) {
        $ext = $file.Extension.ToLower()
        $relativePath = $file.FullName.Replace($repoRoot + "\", "")
        $classified = $false

        foreach ($category in $fileTypes.Keys) {
            if ($fileTypes[$category] -contains $ext) {
                $classification[$category] += $relativePath
                $classified = $true
                break
            }
        }

        if (-not $classified) {
            $classification["Other"] += $relativePath
        }
    }

    # Write classification to report
    foreach ($category in $classification.Keys) {
        if ($classification[$category].Count -gt 0) {
            Add-Content -Path $classificationPath -Value "$category ($($classification[$category].Count)):"
            foreach ($file in $classification[$category]) {
                Add-Content -Path $classificationPath -Value "  - $file"
            }
            Add-Content -Path $classificationPath -Value ""
        }
    }

    Write-Log "File classification complete. See report at backups/$timestamp/classification.txt" -Level "Success"
}

function Create-ReorganizationPlan {
    Write-Log "Creating reorganization plan..."

    $planPath = Join-Path -Path $repoRoot -ChildPath "backups/$timestamp/reorganization-plan.txt"
    Add-Content -Path $planPath -Value "Repository Reorganization Plan - $timestamp`n"

    # Define directories and matching patterns
    $directoryPlan = @{
        "src/components" = @("*component*.js", "*Component*.js", "*component*.jsx", "*Component*.jsx", "*component*.tsx", "*Component*.tsx")
        "src/layouts" = @("*layout*.js", "*Layout*.js", "*layout*.jsx", "*Layout*.jsx", "*layout*.tsx", "*Layout*.tsx")
        "src/pages" = @("*page*.js", "*Page*.js", "*page*.jsx", "*Page*.jsx", "*page*.tsx", "*Page*.tsx")
        "src/utils" = @("*util*.js", "*Util*.js", "*helper*.js", "*Helper*.js")
        "src/styles" = @("*.css", "*.scss", "*.less")
        "src/contracts" = @("*.sol")
        "docs" = @("*.md", "*.txt")
        "config" = @("*.json", "*.yml", "*.yaml", "*.config")
        "scripts" = @("*.ps1", "*.cmd", "*.bat", "*.sh")
        "public" = @("*.html", "*.ico", "favicon.*")
        "assets/images" = @("*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp")
        "assets/fonts" = @("*.ttf", "*.otf", "*.woff", "*.woff2", "*.eot")
    }

    # Get all files but exclude some directories
    $files = Get-ChildItem -Path $repoRoot -Recurse -File |
        Where-Object {
            -not $_.FullName.Contains("\backups\") -and
            -not $_.FullName.Contains("\node_modules\") -and
            -not $_.FullName.Contains("\.git\")
        }

    $moveOperations = @{}
    foreach ($dir in $directoryPlan.Keys) {
        $patterns = $directoryPlan[$dir]
        $matchedFiles = @()

        foreach ($pattern in $patterns) {
            $matchedFiles += $files | Where-Object { $_.Name -like $pattern }
        }

        $uniqueMatches = $matchedFiles | Select-Object -Property FullName -Unique

        if ($uniqueMatches -and $uniqueMatches.Count -gt 0) {
            $moveOperations[$dir] = @()

            foreach ($match in $uniqueMatches) {
                $relativePath = $match.FullName.Replace($repoRoot + "\", "")
                $moveOperations[$dir] += $relativePath
            }
        }
    }

    # Write plan to file
    foreach ($targetDir in $moveOperations.Keys) {
        if ($moveOperations[$targetDir].Count -gt 0) {
            Add-Content -Path $planPath -Value "Move to `"$targetDir`":"
            foreach ($file in $moveOperations[$targetDir]) {
                Add-Content -Path $planPath -Value "  - $file"
            }
            Add-Content -Path $planPath -Value ""
        }
    }

    Write-Log "Reorganization plan created. See plan at backups/$timestamp/reorganization-plan.txt" -Level "Success"
    return $moveOperations
}

function Execute-ReorganizationPlan {
    param (
        [hashtable]$moveOperations
    )

    Write-Log "Executing reorganization plan..."

    $executionLogPath = Join-Path -Path $repoRoot -ChildPath "backups/$timestamp/execution-log.txt"
    Add-Content -Path $executionLogPath -Value "Execution Log - $timestamp`n"

    $operationsComplete = 0
    $operationsFailed = 0

    foreach ($targetDir in $moveOperations.Keys) {
        # Create target directory if it doesn't exist
        $targetDirPath = Join-Path -Path $repoRoot -ChildPath $targetDir
        if (-not (Test-Path -Path $targetDirPath)) {
            try {
                New-Item -Path $targetDirPath -ItemType Directory -Force | Out-Null
                Add-Content -Path $executionLogPath -Value "Created directory: $targetDir"
            }
            catch {
                Add-Content -Path $executionLogPath -Value "ERROR: Failed to create directory $targetDir - $($_.Exception.Message)"
                $operationsFailed++
                continue
            }
        }

        # Move files to target directory
        foreach ($file in $moveOperations[$targetDir]) {
            $sourcePath = Join-Path -Path $repoRoot -ChildPath $file
            $fileName = Split-Path -Leaf $file
            $destPath = Join-Path -Path $targetDirPath -ChildPath $fileName

            # Skip if source file doesn't exist
            if (-not (Test-Path -Path $sourcePath)) {
                Add-Content -Path $executionLogPath -Value "WARNING: Source file does not exist: $file"
                continue
            }

            # Handle case where destination file already exists
            if (Test-Path -Path $destPath) {
                $newFileName = [System.IO.Path]::GetFileNameWithoutExtension($fileName) + "-old" + [System.IO.Path]::GetExtension($fileName)
                $destPath = Join-Path -Path $targetDirPath -ChildPath $newFileName
                Add-Content -Path $executionLogPath -Value "WARNING: Destination file exists, renaming to $newFileName"
            }

            try {
                Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction Stop
                Add-Content -Path $executionLogPath -Value "Moved: $file -> $targetDir/$fileName"
                $operationsComplete++
            }
            catch {
                Add-Content -Path $executionLogPath -Value "ERROR: Failed to move $file - $($_.Exception.Message)"
                $operationsFailed++
            }
        }
    }

    if ($operationsFailed -gt 0) {
        Write-Log "Reorganization complete with some errors: $operationsComplete operations successful, $operationsFailed failed. See execution log at backups/$timestamp/execution-log.txt" -Level "Warning"
    }
    else {
        Write-Log "Reorganization complete: $operationsComplete operations successful. See execution log at backups/$timestamp/execution-log.txt" -Level "Success"
    }
}

# Main execution
try {
    Write-Host ""
    Write-Host "Repository root: $repoRoot"
    Write-Host "=================================================="
    Write-Host "   Repository Structure Reorganization Script   "
    Write-Host "=================================================="
    Write-Host ""

    # Execute reorganization steps
    Create-DirectoryStructure

    # Backup current structure (no actual file copies, just inventory)
    Backup-ExistingStructure

    # Find duplicate files
    Find-DuplicateFiles

    # Classify files by type
    Classify-Files

    # Create reorganization plan
    $plan = Create-ReorganizationPlan

    # Ask user for confirmation before executing plan
    $confirmation = Read-Host "Do you want to execute the reorganization plan? (Y/N)"

    if ($confirmation -eq "Y" -or $confirmation -eq "y") {
        # Execute the plan
        Execute-ReorganizationPlan -moveOperations $plan
        Write-Host ""
        Write-Host "Repository reorganization complete! A backup of the structure was saved to backups/$timestamp/"
    }
    else {
        Write-Host "Reorganization plan was created but not executed. You can view the plan at backups/$timestamp/reorganization-plan.txt"
    }
}
catch {
    Write-Host ""
    Write-Host "An error occurred during repository reorganization:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Stack Trace: $($_.Exception.StackTrace)" -ForegroundColor Red
}
