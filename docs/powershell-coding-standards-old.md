# PowerShell Coding Standards

## Parameter Naming

### Avoid PowerShell Reserved Parameter Names

Never use these PowerShell common parameter names in your scripts as they can cause conflicts:

- `Debug` - Use `DebugMode` or `DebugParam` instead
- `ErrorAction` - Use `ErrorActionPreference` instead
- `ErrorVariable` - Use `ErrorVar` instead
- `InformationAction` - Use `InfoAction` instead
- `InformationVariable` - Use `InfoVar` instead
- `OutBuffer` - Use `OutputBuffer` instead
- `OutVariable` - Use `OutputVar` instead
- `PipelineVariable` - Use `PipelineVar` instead
- `Verbose` - Use `VerboseMode` or `VerboseParam` instead
- `WarningAction` - Use `WarningActionPreference` instead
- `WarningVariable` - Use `WarningVar` instead
- `WhatIf` - Use `WhatIfMode` instead
- `Confirm` - Use `ConfirmMode` instead

These parameter names are automatically added by PowerShell to all cmdlets and advanced functions, so reusing them can cause unexpected behavior.

### Automated Checking

Run the `Check-PowerShellParameters.ps1` script to automatically detect and fix parameter naming conflicts.

```powershell
# Check for naming conflicts
.\Check-PowerShellParameters.ps1

# Automatically fix naming conflicts
.\Check-PowerShellParameters.ps1 -Fix
```

## General Style Guidelines

### Command Chaining in PowerShell

When working with PowerShell scripts, remember that PowerShell uses different syntax for command chaining than Bash/Unix shells:

#### ❌ Don't use Bash-style command chaining in PowerShell:

```powershell
# This is INCORRECT in PowerShell
npm install && npm start
```

#### ✅ Instead, use PowerShell semicolons for sequential execution:

```powershell
# This is CORRECT in PowerShell
npm install; npm start
```

#### ✅ Or use separate lines for better readability:

```powershell
# This is also CORRECT in PowerShell
npm install
npm start
```

#### ✅ For conditional execution, use PowerShell's operators:

```powershell
# Conditional execution in PowerShell (only run second command if first succeeds)
$result = npm install
if ($LASTEXITCODE -eq 0) { npm start }
```

## Function Design

### Verb-Noun Order

Use a `Verb-Noun` format for function names to clearly indicate the action and the target. This is a standard PowerShell practice that improves readability and discoverability of functions.

#### ✅ Good Examples:

```powershell
Get-Process
Set-Location
New-Item
```

#### ❌ Avoid using other naming conventions:

```powershell
# Bad Examples:
ProcessGet
LocationSet
Item-New
```

### Use of CmdletBinding

For advanced functions, use the `CmdletBinding` attribute to enable cmdlet features such as common parameters, and to specify the function as an advanced function.

```powershell
function Get-Something {
    [CmdletBinding()]
    param (
        [string]$Name
    )
    # Function code here
}
```

### Comment-Based Help

Include comment-based help in your functions to provide users with information about the function's purpose, parameters, and usage examples. This help can be accessed through the `Get-Help` cmdlet.

```powershell
function Get-Something {
    <#
    .SYNOPSIS
    Short description of the function

    .DESCRIPTION
    A longer description of the function

    .PARAMETER Name
    Description of the Name parameter

    .EXAMPLE
    Get-Something -Name 'Value'
    #>
    [CmdletBinding()]
    param (
        [string]$Name
    )
    # Function code here
}
```
