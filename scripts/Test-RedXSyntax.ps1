# Simple script to validate the syntax of the Run-RedX.ps1 script
# without executing the actual build operations

# Instructions for running in Visual Studio Code:
# 1. Make sure you have PowerShell extension installed (Microsoft.PowerShell)
# 2. Press F5 to run the current script (or right-click and select "Run")
# 3. Alternatively, press F1, type "PowerShell: Run Selection" and press Enter
# 4. To run in terminal: right-click in editor and select "Run in Terminal"
# 5. Or open terminal (Ctrl+`) and type: .\Test-RedXSyntax.ps1

Write-Host "Testing Run-RedX.ps1 syntax..." -ForegroundColor Cyan

try {
    # Try parsing the script without executing it
    $scriptContent = Get-Content -Path "$PSScriptRoot\Run-RedX.ps1" -Raw
    $errors = $null

    # Parse the script
    [void][System.Management.Automation.Language.Parser]::ParseInput($scriptContent, [ref]$null, [ref]$errors)

    if ($errors.Count -gt 0) {
        Write-Host "Script has syntax errors:" -ForegroundColor Red

        foreach ($error in $errors) {
            Write-Host "Line $($error.Extent.StartLineNumber): $($error.Message)" -ForegroundColor Red
        }

        exit 1
    }
    else {
        Write-Host "Script syntax is valid!" -ForegroundColor Green
        Write-Host "Try running with: .\Run-RedX.ps1 -Mode build -Verbose" -ForegroundColor Cyan

        # Optionally you can try to load the functions to test more deeply
        Write-Host "Testing module import..." -ForegroundColor Cyan
        $module = Import-Module -Name "$PSScriptRoot\Run-RedX.ps1" -PassThru -DisableNameChecking -ErrorAction Stop
        Write-Host "Module imported successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Host "Error testing script: $_" -ForegroundColor Red
    exit 1
}

Write-Host "All tests passed!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
