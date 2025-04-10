# GitHub Pages Setup Guide

## 1. Initialize GitHub Pages

1. Go to your repository on GitHub.com
2. Click on "Settings" tab
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select either:
   - `main` branch (for project site)
   - `gh-pages` branch (dedicated branch for GitHub Pages)
5. Select the folder (root or /docs) where your site content is located
6. Click "Save"

### Choosing Between main and gh-pages Branch

For your project (prx), consider the following:

**Use main branch when**:
- Your repository's primary purpose is the website itself
- You want a simpler workflow with direct updates
- You don't need to separate website files from other code

**Use gh-pages branch when**:
- Your repository contains both code and documentation
- You want to keep website content separate from application code
- You need a dedicated publishing workflow (e.g., build process)
- You want to use GitHub Actions to automatically build and deploy

**Recommendation for maximum functionality**:
Using a gh-pages branch typically offers more flexibility and cleaner organization, especially if your project involves complex publishing workflows or contains both application code and documentation. This approach allows you to:
- Keep source files in main and compiled/generated files in gh-pages
- Use automated workflows for building and deployment
- Maintain clearer separation of concerns

## 2. Theme Configuration

Your site is currently configured to use the `minima` theme as specified in the `_config.yml` file. To change themes:

1. Edit the `_config.yml` file
2. Change the `theme:` line to one of the [supported themes](https://pages.github.com/themes/):
   - jekyll-theme-cayman
   - jekyll-theme-minimal
   - jekyll-theme-leap-day
   - jekyll-theme-merlot
   - jekyll-theme-midnight
   - jekyll-theme-architect
   - jekyll-theme-tactile
   - jekyll-theme-dinky
   - jekyll-theme-hacker
   - jekyll-theme-slate

For a custom theme, you'll need to:

1. Create a `_layouts` directory with custom template files
2. Create a `_sass` or `assets/css` directory for custom styling

## 3. Custom Domain Configuration

To use a custom domain:

1. Go to your repository "Settings" tab
2. Scroll to "GitHub Pages" section
3. Under "Custom domain", enter your domain name (e.g., example.com)
4. Click "Save"
5. Create a file named `CNAME` in the root of your repository with your domain name

DNS Configuration:

- For apex domain (example.com):
  - Create A records pointing to GitHub Pages IP addresses:
    ```
    185.199.108.153
    185.199.109.153
    185.199.110.153
    185.199.111.153
    ```
- For subdomain (blog.example.com):
  - Create a CNAME record pointing to your GitHub Pages URL: yourusername.github.io

## 4. HTTPS Setup

Once your custom domain is configured:

1. Go to your repository "Settings" tab
2. Scroll to "GitHub Pages" section
3. Check the "Enforce HTTPS" checkbox
4. Wait for the certificate to be issued (this may take up to 24 hours)

Note: HTTPS enforcement is automatically enabled for \*.github.io domains, but needs to be manually enabled for custom domains.
