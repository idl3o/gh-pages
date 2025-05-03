# Project Backups

This directory contains backup files for the StreamChain Web3 platform.

## Backup Types

- **site\_[timestamp].zip** - Backups of the built site (contents of \_site directory)
- **docs\_[timestamp].zip** - Backups of the documentation
- **config\_[timestamp].zip** - Backups of configuration files

## How to Create Backups

```bash
# Backup the site
npm run backup:site

# Backup documentation
npm run backup:docs

# Backup configuration files
npm run backup:config

# Backup everything
npm run backup:all
```

## How to Restore Backups

```bash
# List all available backups
npm run restore:list

# Restore from a specific backup file
npm run restore -- "filename.zip"

# Restore the latest backups of each type
npm run restore:latest
```

## Automatic Backups

The system is configured to create automatic backups before major deployments or updates.
These backups ensure you can restore to a previous state if needed.
