# Contributing to Web3 Crypto Streaming Service Documentation

Thank you for your interest in contributing to our documentation! This guide will help you get started with making contributions to the Web3 Crypto Streaming Service documentation site.

## Getting Started

1. **Fork the repository**

   Start by forking the GitHub repository to your own account.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/gh-pages.git
   cd gh-pages
   ```

3. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Environment

For local development:

1. **If using Jekyll:**
   ```bash
   bundle install
   bundle exec jekyll serve
   ```

2. **Without Jekyll:**
   Simply open the HTML files in your browser.

3. **Generate placeholder images:**
   ```bash
   node scripts/generate-placeholders.js
   node scripts/generate-platform-diagram.js
   ```

## Documentation Structure

Our documentation follows a specific structure:

- `/docs/` - Main documentation files
  - `/docs/root/` - Getting started and introduction
  - `/docs/contracts/` - Smart contract documentation
  - `/docs/resources/` - External resources and references
  - `/docs/analysis/` - Analysis and research papers
- `/whitepaper/` - Technical whitepaper
- `/career/` - Career resources and guides
- `/assets/` - Images, CSS, and JavaScript files

## Style Guide

When contributing documentation:

1. **Use clear, concise language** - Avoid jargon when possible
2. **Include code examples** where appropriate
3. **Follow the established visual style** - Use the predefined components and styles
4. **Support dark mode** - Test your changes in both light and dark modes
5. **Make content accessible** - Use proper heading structure, alt text for images, etc.

## Making Changes

1. **Make your changes** in your branch
2. **Test your changes** locally
3. **Commit your changes** with a clear commit message
   ```bash
   git add .
   git commit -m "Add documentation for XYZ feature"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Submit a pull request** to the main repository

## Pull Request Process

1. Fill out the PR template completely
2. Link to any related issues
3. Wait for a maintainer to review your PR
4. Address any requested changes
5. Once approved, your PR will be merged

## Questions?

If you have questions about contributing, please open an issue with the label "question" in the GitHub repository.

Thank you for helping improve our documentation!
