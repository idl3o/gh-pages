#Requires -Version 5.0

[CmdletBinding()]
param(
    [Parameter()]
    [string]$Path = ".",

    [Parameter()]
    [switch]$Fix
)

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

# Get all PowerShell scripts in the specified path
$scripts = Get-ChildItem -Path $Path -Include "*.ps1", "*.psm1", "*.psd1" -Recurse

# Initialize counters
$conflictCount = 0
$fixedCount = 0
$filesWithConflicts = @()

Write-Host "Scanning $(($scripts | Measure-Object).Count) PowerShell files for parameter naming conflicts..."

foreach ($script in $scripts) {
    $content = Get-Content -Path $script.FullName -Raw
    $foundConflict = $false

    # Check for parameter block definitions with reserved names
    foreach ($param in $reservedParams) {
        # Pattern to find parameter declarations with reserved names
        $pattern = "param\s*\([^)]*\s*\`$$param\b|\[Parameter[^\]]*\]\s*\[[^\]]*\]\s*\`$$param\b|\[Parameter[^\]]*\]\s*\`$$param\b"

        if ($content -match $pattern) {
            if (-not $foundConflict) {
                Write-Host "`nFile: $($script.FullName)"
                $foundConflict = $true
                $filesWithConflicts += $script.FullName
            }

            $conflictCount++
            Write-Host "  - Found reserved parameter name: '$param'"

            if ($Fix) {
                $newName = "${param}Param"

                # Replace the parameter with a new name
                $newContent = $content -replace "(\[Parameter[^\]]*\])(\s*\[[^\]]*\])?\s*\`$$param\b", "`$1`$2 `$$newName"
                $newContent = $newContent -replace "param\s*\([^)]*(\s*)\`$$param\b", "param`$1`$1`$$newName"

                if ($newContent -ne $content) {
                    Set-Content -Path $script.FullName -Value $newContent -Encoding UTF8
                    Write-Host "    - Fixed: Renamed parameter '$param' to '$newName'"
                    $fixedCount++
                    $content = $newContent
                }
                else {
                    Write-Host "    - Could not automatically fix the conflict"
                }
            }
        }
    }
}

# Report summary
Write-Host "`n----- Summary -----"
Write-Host "Total scripts analyzed: $(($scripts | Measure-Object).Count)"
Write-Host "Parameter naming conflicts found: $conflictCount"
Write-Host "Files with conflicts: $(($filesWithConflicts | Measure-Object).Count)"

if ($Fix) {
    Write-Host "Conflicts fixed: $fixedCount"
}

# List files with conflicts
if ($filesWithConflicts.Count -gt 0) {
    Write-Host "`nFiles with parameter naming conflicts:"
    foreach ($file in $filesWithConflicts) {
        Write-Host "  $file"
    }

    Write-Host "`nRecommendation: Run with the -Fix parameter to automatically rename conflicting parameters."
    exit 1
}
else {
    Write-Host "`nNo parameter naming conflicts found!"
    exit 0
}
