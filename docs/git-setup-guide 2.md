- --
layout: default
title: Git Configuration Guide
description: How to properly configure Git when contributing to the Web3 Crypto Streaming Service project
permalink: /docs/git-setup/
- --

# Git Configuration Guide

This guide will help contributors properly set up Git for working with the Web3 Crypto Streaming Service project codebase.

## First-Time Git Setup

After installing Git on your system, you'll need to configure some basic settings. These settings will persist between upgrades and can be changed at any time.

### Configuration Levels

Git stores configuration at three levels:

1. **System level** (`/etc/gitconfig`): Applied to every user and repository on your system
   - Set with `git config --system` (requires admin privileges)

2. **Global level** (`~/.gitconfig` or `~/.config/git/config`): Settings specific to your user account
   - Set with `git config --global`
   - Affects all repositories you work with

3. **Local level** (`.git/config` in each repo): Settings specific to a single repository
   - Set with `git config --local` (the default)

Each level overrides the previous one, so repository-specific settings take precedence over global settings.

### Essential Configuration

#### 1. Set Your Identity

Every commit you make includes your name and email address, which gets permanently embedded in the commit history:

```bash
git config --global user.name "Your Name"
git config --global user.email your.email@example.com
```

> **Project Requirement:** Please use the same email address associated with your GitHub account for consistent attribution.

#### 2. Configure Default Branch Name

Our project uses `main` as the default branch name:

```bash
git config --global init.defaultBranch main
```

#### 3. Configure Line Ending Behavior

For cross-platform compatibility:

* *On macOS/Linux:**
```bash
git config --global core.autocrlf input
```

* *On Windows:**
```bash
git config --global core.autocrlf true
```

#### 4. Set Your Editor

Choose your preferred text editor for commit messages:

```bash
# For VS Code
git config --global core.editor "code --wait"

# For Vim
git config --global core.editor vim

# For Sublime Text
git config --global core.editor "subl -n -w"
```

## Project-Specific Configuration

When working on the Web3 Crypto Streaming Service project, we recommend these additional settings:

### Commit Message Template

Our project follows a structured commit message format. Set up the template:

```bash
git config --local commit.template .github/commit-template.txt
```

### Signing Commits

For security, we encourage signing your commits:

```bash
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true
```

### Pull Strategy

To avoid unnecessary merge commits:

```bash
git config --global pull.rebase true
```

### Useful Aliases

These aliases can improve your workflow:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global alias.unstage "reset HEAD --"
```

## Verify Your Configuration

Check your current configuration:

```bash
# List all settings
git config --list

# Show specific setting
git config user.name

# Show where settings are defined
git config --list --show-origin
```

## Common Issues and Solutions

### Username/Email Not Set Correctly

If your commits show the wrong identity:

```bash
git commit --amend --author="Your Name <your.email@example.com>"
git rebase --continue
```

### Line Ending Problems

If you encounter line ending warnings:

```bash
git add --renormalize .
git status
git commit -m "Fix line endings"
```

### Contribution Process

After configuring Git correctly:

1. Fork the repository on GitHub
2. Clone your fork locally
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/web3streaming/main-repo.git
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Commit your changes following our commit guidelines
6. Push to your fork and submit a pull request

## Additional Resources

- [Official Git Documentation](https://git-scm.com/doc)
- [GitHub Git Cheat Sheet](https://training.github.com/downloads/github-git-cheat-sheet.pdf)
- [Project Contribution Guidelines](/docs/contributing)

For any questions about Git configuration, please ask in our [Discord community](https://discord.gg/web3streaming).

