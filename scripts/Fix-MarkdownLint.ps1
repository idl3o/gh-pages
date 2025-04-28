# PowerShell script to fix common markdown linting issues

Write-Host "Fixing markdown lint issues..."

# Get all markdown files
$mdFiles = Get-ChildItem -Path . -Filter "*.md" -Recurse
$totalFiles = $mdFiles.Count
Write-Host "Found $totalFiles markdown files"

# Fix issues
$count = 0
$fixed = 0

foreach ($file in $mdFiles) {
    $count++
    Write-Host "Processing ($count/$totalFiles): $($file.FullName)"

    # Read the file content
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content

    # 1. Ensure exactly one newline at end of file
    if ($content -notmatch "\n$") {
        $content = $content + "`n"
    } elseif ($content -match "\n\n$") {
        $content = $content -replace "\n+$", "`n"
    }

    # 2. Remove trailing whitespace
    $content = $content -replace "[ \t]+$", "" -split "`n" -join "`n"

    # 3 & 4. Fix heading syntax (ensure space after #)
    $content = $content -replace "(?m)^(#+)([^ #])", '$1 $2'

    # 5. Convert tabs to spaces in indentation
    $content = $content -replace "(?m)^(\t+)", {param($m) "    " * $m.Value.Length}

    # 6. Ensure blank lines before headings (except at the beginning of file)
    $content = $content -replace "(?m)(?<!^)(?<!\n\n)(^#+ )", "`n`$1"

    # 7. Fix unordered list items (ensure space after marker)
    $content = $content -replace "(?m)^([ ]*[-+*])([^ ])", '$1 $2'

    # 8. Fix ordered list items (ensure space after marker)
    $content = $content -replace "(?m)^([ ]*[0-9]+\.)([^ ])", '$1 $2'

    # 9. Remove multiple blank lines
    $content = $content -replace "(?m)^\n{3,}", "`n`n"

    # 10. Fix code block fences (ensure proper spacing)
    $content = $content -replace "(?m)^```(\S*)$", "```$1"

    # Check if changes were made
    if ($content -ne $originalContent) {
        # Write the modified content back to the file
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Add-Content -Path $file.FullName -Value ""  # Add the final newline
        $fixed++
        Write-Host "Fixed issues in: $($file.FullName)"
    }
}

Write-Host "Completed fixing markdown issues in $fixed out of $totalFiles files"
