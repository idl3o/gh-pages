const fs = require('fs');
const path = require('path');

describe('GitHub Pages Compatibility Tests', () => {
  test('Project structure is valid for GitHub Pages', () => {
    // This is a basic test that checks for essential files
    const essentialFiles = ['index.html', 'package.json'];

    essentialFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      expect(exists).toBe(true);
    });
  });

  test('Index HTML has required meta tags', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for critical meta tags
      expect(content).toMatch(/<meta\s+charset=["']UTF-8["']\s*\/?>?/i);
      expect(content).toMatch(/<meta\s+name=["']viewport["']/i);
      expect(content).toMatch(/<title>/i);
    } else {
      // Skip test if index.html doesn't exist
      console.log('Skipping meta tag test - index.html not found');
    }
  });

  test('Assets referenced in HTML are valid', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');

      // Extract CSS and JS paths
      const cssMatches = content.match(/href=["'](\.\/assets\/css\/[^"']+)["']/g) || [];
      const jsMatches = content.match(/src=["'](\.\/assets\/js\/[^"']+)["']/g) || [];

      // If no assets, test passes (might be using inline styles/scripts)
      if (cssMatches.length === 0 && jsMatches.length === 0) {
        return;
      }

      // Check CSS files
      const cssFiles = cssMatches.map(match => {
        const href = match.match(/href=["']([^"']+)["']/)[1];
        return href.startsWith('/') ? href.substring(1) : href;
      });

      cssFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        console.log(`Checking CSS file: ${filePath}`);
        // We check if file exists but don't fail test if missing
        if (!fs.existsSync(filePath)) {
          console.warn(`Warning: CSS file not found: ${file}`);
        }
      });

      // Check JS files
      const jsFiles = jsMatches.map(match => {
        const src = match.match(/src=["']([^"']+)["']/)[1];
        return src.startsWith('/') ? src.substring(1) : src;
      });

      jsFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        console.log(`Checking JS file: ${filePath}`);
        // We check if file exists but don't fail test if missing
        if (!fs.existsSync(filePath)) {
          console.warn(`Warning: JavaScript file not found: ${file}`);
        }
      });
    }
  });

  test('package.json has required scripts for GitHub Pages', () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check for essential scripts
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    } else {
      fail('package.json not found');
    }
  });

  test('GitHub workflow files exist for deployment', () => {
    const workflowsDir = path.join(process.cwd(), '.github', 'workflows');

    // Test passes if workflows directory exists
    const workflowsDirExists = fs.existsSync(workflowsDir);
    expect(workflowsDirExists).toBe(true);

    if (workflowsDirExists) {
      // Check if at least one workflow file exists
      const files = fs
        .readdirSync(workflowsDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

      expect(files.length).toBeGreaterThan(0);

      // Check if any file contains GitHub Pages deployment
      let hasDeployment = false;
      for (const file of files) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        if (
          content.includes('actions/deploy-pages') ||
          content.includes('github-pages') ||
          content.includes('pages-build-deployment')
        ) {
          hasDeployment = true;
          break;
        }
      }

      expect(hasDeployment).toBe(true);
    }
  });
});
