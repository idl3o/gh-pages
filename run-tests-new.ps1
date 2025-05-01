param (
    [switch]$SkipLint = $false,
    [switch]$SkipBuild = $false,
    [switch]$SkipWorkflowValidation = $false
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"
$ErrorCount = 0
$WarningCount = 0

function Write-Header {
    param([string]$text)

    Write-Host "`n====== $text ======" -ForegroundColor Cyan
}

function Write-Result {
    param(
        [int]$exitCode,
        [string]$successMessage,
        [string]$errorMessage
    )

    if ($exitCode -eq 0) {
        Write-Host "âœ“ $successMessage" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "âœ— $errorMessage" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

Write-Header "GitHub Pages Test Suite"
$startTime = Get-Date

# Check if required tools are installed
$requiredTools = @{
    "git" = "Git is required for version control operations";
    "npm" = "Node.js/npm is required for linting and other tools";
}

$allToolsInstalled = $true
foreach ($tool in $requiredTools.Keys) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "âœ— $tool is not installed or not in PATH. $($requiredTools[$tool])" -ForegroundColor Red
        $allToolsInstalled = $false
        $ErrorCount++
    }
}

if (-not $allToolsInstalled) {
    Write-Host "`nPlease install the missing tools and try again." -ForegroundColor Red
    exit 1
}

# Set Ruby Environment
$env:PATH = 'C:\Ruby27-x64\bin;' + $env:PATH

# 1. Run Linting if not skipped
if (-not $SkipLint) {
    Write-Header "Running Code Linting"

    # HTML Linting with HTMLProofer (if available)
    if (Get-Command "bundle" -ErrorAction SilentlyContinue) {
        try {
            if (-not (Test-Path -Path "_site")) {
                Write-Host "Building Jekyll site for HTML validation..." -ForegroundColor Yellow
                bundle exec jekyll build --quiet
            }

            Write-Host "Running HTMLProofer to validate HTML..." -ForegroundColor Yellow
            $htmlproofOutput = bundle exec htmlproofer ./_site --disable-external --allow-hash-href --check-html 2>&1
            Write-Result -exitCode $LASTEXITCODE -successMessage "HTML validation passed!" -errorMessage "HTML validation failed!"
        }
        catch {
            Write-Host "HTML validation failed or HTMLProofer not installed." -ForegroundColor Yellow
            Write-Host "Consider installing HTMLProofer with: bundle add html-proofer --group=development" -ForegroundColor Yellow
            $WarningCount++
        }
    }

    # JavaScript/TypeScript Linting with ESLint (if available)
    if (Test-Path -Path "package.json") {
        $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json

        if ($packageJson.devDependencies.eslint -or $packageJson.dependencies.eslint) {
            Write-Host "Running ESLint for JavaScript/TypeScript..." -ForegroundColor Yellow
            npm run lint
            Write-Result -exitCode $LASTEXITCODE -successMessage "JavaScript/TypeScript linting passed!" -errorMessage "JavaScript/TypeScript linting failed!"
        }
        else {
            Write-Host "ESLint not found in package.json, skipping JavaScript/TypeScript linting." -ForegroundColor Yellow
            $WarningCount++
        }
    }

    # YAML Linting for _config.yml and workflows (if yamllint is installed)
    if (Get-Command "yamllint" -ErrorAction SilentlyContinue) {
        Write-Host "Running YAML linting..." -ForegroundColor Yellow

        $yamlFiles = @(
            "./_config.yml",
            "./.github/workflows/*.yml"
        )

        foreach ($yamlPattern in $yamlFiles) {
            if (Test-Path -Path $yamlPattern) {
                yamllint $yamlPattern
                Write-Result -exitCode $LASTEXITCODE -successMessage "YAML linting passed for $yamlPattern!" -errorMessage "YAML linting failed for $yamlPattern!"
            }
        }
    }
    else {
        Write-Host "yamllint not found in PATH, skipping YAML validation." -ForegroundColor Yellow
        $WarningCount++
    }

    # Markdown Linting (if markdownlint is installed)
    if (Get-Command "markdownlint" -ErrorAction SilentlyContinue) {
        Write-Host "Running Markdown linting..." -ForegroundColor Yellow
        markdownlint .
        Write-Result -exitCode $LASTEXITCODE -successMessage "Markdown linting passed!" -errorMessage "Markdown linting failed!"
    }
    else {
        Write-Host "markdownlint not found in PATH, skipping Markdown validation." -ForegroundColor Yellow
        Write-Host "Consider installing with: npm install -g markdownlint-cli" -ForegroundColor Yellow
        $WarningCount++
    }
}

# 2. Validate GitHub Workflows
if (-not $SkipWorkflowValidation) {
    Write-Header "Validating GitHub Workflows"

    $workflowsDir = "./.github/workflows"
    if (Test-Path -Path $workflowsDir) {
        $workflowFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"

        if ($workflowFiles.Count -eq 0) {
            Write-Host "No workflow files found in $workflowsDir" -ForegroundColor Yellow
            $WarningCount++
        }
        else {
            if (Get-Command "actionlint" -ErrorAction SilentlyContinue) {
                Write-Host "Running actionlint to validate GitHub Actions workflows..." -ForegroundColor Yellow
                actionlint
                Write-Result -exitCode $LASTEXITCODE -successMessage "GitHub Actions workflow validation passed!" -errorMessage "GitHub Actions workflow validation failed!"
            }
            else {
                Write-Host "actionlint not found in PATH, performing basic YAML validation only." -ForegroundColor Yellow
                Write-Host "Consider installing actionlint: https://github.com/rhysd/actionlint/releases" -ForegroundColor Yellow
                $WarningCount++

                # Basic validation by checking if the YAML can be parsed
                foreach ($file in $workflowFiles) {
                    try {
                        $content = Get-Content -Path $file.FullName -Raw
                        $null = ConvertFrom-Yaml -Yaml $content
                        Write-Host "âœ“ Basic YAML validation passed for $($file.Name)" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "âœ— YAML parsing failed for $($file.Name): $_" -ForegroundColor Red
                        $ErrorCount++
                    }
                }
            }
        }
    }
    else {
        Write-Host "GitHub workflows directory not found at $workflowsDir" -ForegroundColor Yellow
        $WarningCount++
    }
}

# 3. Test Jekyll build
if (-not $SkipBuild) {
    Write-Header "Testing Jekyll Build"

    if (Get-Command "bundle" -ErrorAction SilentlyContinue) {
        Write-Host "Building Jekyll site..." -ForegroundColor Yellow
        bundle exec jekyll build --safe
        if (Write-Result -exitCode $LASTEXITCODE -successMessage "Jekyll build successful!" -errorMessage "Jekyll build failed!") {
            # Count the number of files in _site directory
            $siteFiles = Get-ChildItem -Path "_site" -Recurse -File
            $fileCount = $siteFiles.Count
            Write-Host "Generated $fileCount files in _site directory" -ForegroundColor Green
        }
    }
    else {
        Write-Host "Bundle not found in PATH, skipping Jekyll build test." -ForegroundColor Yellow
        $WarningCount++
    }

    # Test TypeScript build if applicable
    if (Test-Path -Path "ts") {
        Write-Host "Building TypeScript SDK..." -ForegroundColor Yellow
        Push-Location ts
        npm run build
        Write-Result -exitCode $LASTEXITCODE -successMessage "TypeScript build successful!" -errorMessage "TypeScript build failed!"
        Pop-Location
    }
}

# Calculate summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Header "Test Summary"
Write-Host "Tests completed in $($duration.TotalSeconds.ToString('0.00')) seconds." -ForegroundColor Cyan
Write-Host "Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $WarningCount" -ForegroundColor $(if ($WarningCount -gt 0) { "Yellow" } else { "Green" })

if ($ErrorCount -gt 0) {
    Write-Host "`nTest suite failed with $ErrorCount errors." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
    exit 0
}
