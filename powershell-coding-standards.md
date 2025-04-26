# PowerShell Coding Standards for SxS CLI

## Command Chaining in PowerShell

When working with PowerShell scripts for the SxS CLI, remember that PowerShell uses different syntax for command chaining than Bash/Unix shells:

### ❌ Don't use Bash-style command chaining in PowerShell:

```powershell
# This is INCORRECT in PowerShell
npm install && npm start
```

### ✅ Instead, use PowerShell semicolons for sequential execution:

```powershell
# This is CORRECT in PowerShell
npm install; npm start
```

### ✅ Or use separate lines for better readability:

```powershell
# This is also CORRECT in PowerShell
npm install
npm start
```

### ✅ For conditional execution, use PowerShell's operators:

```powershell
# Conditional execution in PowerShell (only run second command if first succeeds)
$result = npm install
if ($LASTEXITCODE -eq 0) { npm start }
```

## Setting Up SxS CLI in PowerShell

To set up the SxS CLI using PowerShell:

1. Navigate to the red_x directory:

```powershell
Set-Location -Path "c:\Users\Sam\Documents\GitHub\gh-pages\red_x"
```

2. Copy the package.json file:

```powershell
Copy-Item -Path "sxs-package.json" -Destination "package.json"
```

3. Install the dependencies:

```powershell
npm install
```

4. Make the CLI globally accessible (optional):

```powershell
npm run install-global
```

5. Run the SxS CLI:

```powershell
node ./sxs-cli.js help
```

## Cross-Platform Development

Remember that the SxS CLI is designed to work across platforms, so when contributing code:

1. Use the correct command syntax for each platform
2. Test your changes in both PowerShell and Bash environments when possible
3. Leverage the cross-platform abstractions provided by the SxS CLI system

## Additional Resources

For more information on PowerShell best practices:

- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [PowerShell GitHub Style Guide](https://github.com/PowerShell/PowerShell/blob/master/docs/dev-process/coding-guidelines.md)
