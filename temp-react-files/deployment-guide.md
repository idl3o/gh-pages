# Deployment Guide for React Application

This guide covers several deployment options for your standalone React application, allowing you to choose the option that best fits your needs and access.

## Option 1: Netlify Deployment

Netlify offers a straightforward deployment process with a generous free tier and built-in CI/CD.

### Setup Steps:

1. **Sign up/login to Netlify**: Visit [netlify.com](https://www.netlify.com/) and create an account or log in

2. **Connect your GitHub repository**:
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Select your `react-webapp` repository

3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Set any required environment variables

4. **Deploy site**:
   - Click "Deploy site"
   - Netlify will build and deploy your application

5. **Set up custom domain** (optional):
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Follow the steps to configure DNS

6. **Enable Netlify CI/CD with GitHub Actions**:
   - Get your Netlify Site ID from Site settings > General > Site details
   - Generate a Netlify Personal Access Token in User Settings > Applications
   - Add secrets to GitHub repository:
     - `NETLIFY_SITE_ID`
     - `NETLIFY_AUTH_TOKEN`
   - Place the GitHub Actions workflow file (already created) in `.github/workflows/`

## Option 2: Vercel Deployment

Vercel (creators of Next.js) also offers excellent React hosting with a generous free tier.

### Setup Steps:

1. **Sign up/login to Vercel**: Visit [vercel.com](https://vercel.com/) and create an account or log in

2. **Import your GitHub repository**:
   - Click "New Project"
   - Select your GitHub repository
   - Authorize Vercel if needed

3. **Configure project**:
   - Vercel will automatically detect React/Vite settings
   - Adjust if needed:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Output directory: `dist`
   - Add any environment variables

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

5. **Set up custom domain** (optional):
   - Go to Project Settings > Domains
   - Add your domain and follow the DNS configuration instructions

## Option 3: GitHub Pages Deployment

If you want to use GitHub Pages but keep your React app separate from the original project:

### Setup Steps:

1. **Update your `vite.config.ts` file**:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/react-webapp/', // Your repository name
   })
   ```

2. **Add a deploy script to `package.json`**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Install the gh-pages package**:
   ```bash
   npm install --save-dev gh-pages
   ```

4. **Deploy manually**:
   ```bash
   npm run deploy
   ```

5. **Or set up GitHub Actions**:
   - Place the included GitHub Actions workflow file in `.github/workflows/` 
   - Modify it to use GitHub Pages instead of Netlify

## Option 4: Traditional Web Hosting

For hosting on traditional web servers:

1. **Build your application**:
   ```bash
   npm run build
   ```

2. **Upload the contents of the `dist` folder** to your web host using FTP or their provided upload tool

3. **Configure server for SPA routing**:
   - For Apache, create a `.htaccess` file in the `dist` folder:
     ```
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```
   - For Nginx, configure in server block:
     ```
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```

## Recommended Approach for Your Project

Based on your requirements:
1. **Netlify** is the simplest option with the most features on the free tier
2. **Vercel** is excellent especially if you might migrate to Next.js later
3. **GitHub Pages** works if you prefer keeping everything on GitHub

## Environment Variables

Regardless of platform, you'll need to set these environment variables:
- `VITE_API_URL`: URL to your API services
- Any API keys required by your application (securely)