# Jekyll Site Structure

This document outlines the structure and key components of the Jekyll site used for the Web3 Streaming Platform.

## Overview

Our Jekyll site serves as the main user interface for the Web3 Streaming Platform. It's built with Jekyll, a static site generator that transforms plain text into static websites and blogs.

## Directory Structure

```
/
├── _config.yml           # Main Jekyll configuration
├── _data/                # Data files (YAML, JSON, CSV)
├── _includes/            # Reusable components
├── _layouts/             # Template files
├── _posts/               # Blog posts
├── _sass/                # Sass partials
├── _site/                # Generated site (don't edit directly)
├── assets/               # Static files (images, CSS, JS)
│   ├── css/              # Main stylesheets
│   ├── images/           # Image files
│   └── js/               # JavaScript files
├── docs/                 # Documentation files
└── index.html            # Site homepage
```

## Key Components

### Configuration

The main configuration for the Jekyll site is in `_config.yml`. It controls site-wide settings, such as:

- Site title and description
- URL and baseurl settings
- Build settings and plugins
- Custom variables

### Layouts

Jekyll uses layouts to define the structure of different page types. These are located in the `_layouts` directory:

- `default.html` - The base layout for all pages
- `home.html` - The layout for the homepage
- `post.html` - The layout for blog posts
- `page.html` - The layout for standard pages
- `docs.html` - The layout for documentation pages

### Includes

The `_includes` directory contains reusable components that are included in multiple layouts:

- `header.html` - Site header with navigation
- `footer.html` - Site footer
- `sidebar.html` - Documentation sidebar navigation
- `web3-connect.html` - Web3 wallet connection component

### Assets

Static assets for the site are in the `assets` directory:

- CSS stylesheets (built from Sass)
- JavaScript files for client-side functionality
- Images and other media

### Front Matter

Each Jekyll page or post includes front matter at the top of the file to define metadata:

```yaml
---
layout: post
title: 'Welcome to Web3 Streaming'
date: 2025-04-25
categories: announcements
author: Web3 Team
---
```

## Building and Serving

The Jekyll site can be built and served locally using:

```bash
npm run start
```

Or using the VS Code task "Start Jekyll (Ruby 2.7)".

This will compile the site and make it available at `http://localhost:4000`.

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch. Manual deployment can be performed using:

```bash
npm run deploy
```

Or using the VS Code task "Deploy to GitHub Pages".

## Web3 Integration

Our Jekyll site integrates with Web3 technologies through:

1. **Web3 Connection Component** - Front-end component for connecting to blockchain wallets
2. **TypeScript SDK Integration** - Connection to our TypeScript SDK for blockchain interactions
3. **Content Loading from IPFS** - Some content is loaded from IPFS for decentralized hosting
4. **Smart Contract Interaction** - Direct integration with blockchain contracts for features like token-gated content

## Customizing

To customize the Jekyll site:

1. Modify the theme settings in `_config.yml`
2. Edit the Sass files in `_sass/` directory
3. Update JavaScript files in `assets/js/`
4. Add new layouts or includes as needed

## Additional Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Liquid Syntax](https://shopify.github.io/liquid/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
