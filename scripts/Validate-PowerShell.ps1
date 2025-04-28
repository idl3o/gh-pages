#requires -Version 5.0
<#
.SYNOPSIS
    Validates PowerShell scripts to prevent naming conflicts and enforce standards.
.DESCRIPTION
    This script uses PSScriptAnalyzer to scan PowerShell scripts for potential issues,
    including reserved parameter name conflicts and other best practices.
.PARAMETER Path
    The path to scan for PowerShell scripts. Defaults to the current directory.
.PARAMETER Fix
    If specified, attempts to automatically fix some issues.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Path = ".",

    [Parameter()]
    [switch]$Fix
)

# Ensure PSScriptAnalyzer is installed
if (-not (Get-Module -ListAvailable -Name PSScriptAnalyzer)) {
    Write-Host "PSScriptAnalyzer is not installed. Installing..." -ForegroundColor Cyan
    Install-Module -Name PSScriptAnalyzer -Force -Scope CurrentUser
}

# Import the module
Import-Module PSScriptAnalyzer

# Define the settings file path
$settingsPath = Join-Path -Path $PSScriptRoot -ChildPath "PSScriptAnalyzerSettings.psd1"

# Check if settings file exists
if (-not (Test-Path $settingsPath)) {
    Write-Error "PSScriptAnalyzer settings file not found at: $settingsPath"
    exit 1
}

# Get all PowerShell scripts in the specified path
$scripts = Get-ChildItem -Path $Path -Include "*.ps1", "*.psm1", "*.psd1" -Recurse

# Initialize counters
$totalIssues = 0
$fixedIssues = 0
$reservedParamIssues = 0

Write-Host "Scanning $(($scripts | Measure-Object).Count) PowerShell scripts for issues..." -ForegroundColor Cyan

# Define common PowerShell reserved parameters
$reservedParams = @(
    'Debug',
    'ErrorAction',
    'ErrorVariable',
    'InformationAction',
    'InformationVariable',
    'OutBuffer',
    'OutVariable',
    'PipelineVariable',
    'Verbose',
    'WarningAction',
    'WarningVariable',
    'WhatIf',
    'Confirm'
)

# Track files with issues
$filesWithIssues = @()

# Analyze each script
foreach ($script in $scripts) {
    $scriptIssues = Invoke-ScriptAnalyzer -Path $script.FullName -Settings $settingsPath -ErrorAction SilentlyContinue

    if ($scriptIssues) {
        $issueCount = ($scriptIssues | Measure-Object).Count
        $totalIssues += $issueCount
        $filesWithIssues += $script.FullName

        # Count reserved parameter issues specifically
        $paramIssues = $scriptIssues | Where-Object { $_.RuleName -eq 'PSReservedParams' }
        if ($paramIssues) {
            $reservedParamIssues += ($paramIssues | Measure-Object).Count
        }

        Write-Host "`nFile: $($script.FullName)" -ForegroundColor Yellow
        Write-Host "Found $issueCount issues:" -ForegroundColor Yellow

        foreach ($issue in $scriptIssues) {
            Write-Host "  [Line $($issue.Line)] $($issue.RuleName): $($issue.Message)" -ForegroundColor Red
        }

        # Manual check for reserved parameter names in param blocks
        $content = Get-Content -Path $script.FullName -Raw
        foreach ($param in $reservedParams) {
            if ($content -match "param\s*\([^\)]*\`$$param\b") {
                $totalIssues++
                $reservedParamIssues++

                Write-Host "  [Manual Check] Reserved parameter name found: $param" -ForegroundColor Red

                if ($Fix) {
                    $newParamName = "${param}Param"
                    $updatedContent = $content -replace "(\s*)(\[Parameter[^\]]*\])?\s*(\[.*\])?\s*\`$$param\b", "`$1`$2 `$3 `$$newParamName"
                    Set-Content -Path $script.FullName -Value $updatedContent -Encoding UTF8
                    Write-Host "    ✓ Fixed: Renamed parameter '$param' to '$newParamName'" -ForegroundColor Green
                    $fixedIssues++
                }
            }
        }
    }
}

# Report summary
Write-Host "`n----- Summary -----" -ForegroundColor Cyan
Write-Host "Total scripts analyzed: $(($scripts | Measure-Object).Count)" -ForegroundColor White
Write-Host "Total issues found: $totalIssues" -ForegroundColor $(if ($totalIssues -gt 0) { "Yellow" } else { "Green" })
Write-Host "Reserved parameter conflicts: $reservedParamIssues" -ForegroundColor $(if ($reservedParamIssues -gt 0) { "Red" } else { "Green" })
Write-Host "Files with issues: $(($filesWithIssues | Measure-Object).Count)" -ForegroundColor $(if ($filesWithIssues.Count -gt 0) { "Yellow" } else { "Green" })

if ($Fix) {
    Write-Host "Issues automatically fixed: $fixedIssues" -ForegroundColor $(if ($fixedIssues -gt 0) { "Green" } else { "White" })
}

# List files with issues
if ($filesWithIssues.Count -gt 0) {
    Write-Host "`nFiles with issues:" -ForegroundColor Yellow
    foreach ($file in $filesWithIssues) {
        Write-Host "  $file" -ForegroundColor Yellow
    }
}

# Exit with non-zero code if issues were found
if ($totalIssues -gt 0) {
    exit 1
}
else {
    Write-Host "No issues found! All PowerShell scripts meet the coding standards." -ForegroundColor Green
    exit 0
}
