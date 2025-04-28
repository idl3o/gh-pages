@{
    # Use all built-in rules
    IncludeRules = @('*')

    # Exclude specific rules
    ExcludeRules = @()

    # Configure specific rules
    Rules = @{
        # Check for use of reserved parameters
        PSReservedParams = @{
            Enabled = $true
        }

        # Check for proper parameter usage
        PSAvoidUsingCmdletAliases = @{
            Enabled = $true
        }

        # Ensure all function parameters have types
        PSUseConsistentTypes = @{
            Enabled = $true
        }

        # Enforce parameter naming conventions
        PSUseConsistentWhitespace = @{
            Enabled = $true
        }
    }

    # Severity settings
    Severity = @(
        'Error',
        'Warning',
        'Information'
    )
}
