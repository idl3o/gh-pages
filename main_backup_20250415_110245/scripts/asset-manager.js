/**
 * RED X MODSIAS - Asset Manager Utility
 * Full-spectrum UI asset management for Web3 Crypto Streaming Service
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const config = {
  assetDirectory: path.join(__dirname, '..', 'assets'),
  manifestPath: path.join(__dirname, '..', 'assets', 'manifest.json'),
  cdnBase: 'https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets',
  githubRepo: 'modsias/red_x',
  categories: ['images', 'icons', 'fonts', 'videos', 'animations', 'components'],
  enterpriseCategories: ['branding', 'premium', 'templates']
};

// Asset manifest to track all downloaded resources
let assetManifest = {
  lastUpdated: new Date().toISOString(),
  categories: {},
  totalAssets: 0
};

/**
 * Initialize asset directories and load manifest
 */
function initialize() {
  console.log('🚀 Initializing RED X Asset Manager...');

  // Create asset directories if they don't exist
  config.categories.forEach(category => {
    const categoryPath = path.join(config.assetDirectory, category);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
      console.log(`Created directory: ${category}`);
    }
  });

  // Load existing manifest if available
  if (fs.existsSync(config.manifestPath)) {
    try {
      assetManifest = JSON.parse(fs.readFileSync(config.manifestPath, 'utf8'));
      console.log(`Loaded asset manifest with ${assetManifest.totalAssets} assets`);
    } catch (err) {
      console.error('Error loading manifest, creating new one:', err.message);
    }
  }
}

/**
 * Download a single asset file
 * @param {string} url - Source URL
 * @param {string} destPath - Destination file path
 * @returns {Promise<boolean>} - Success status
 */
function downloadAsset(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', err => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Download assets for a specific category
 * @param {string} category - Asset category
 * @param {boolean} isEnterprise - Whether to download enterprise assets
 */
async function downloadCategoryAssets(category, isEnterprise = false) {
  console.log(`📦 Downloading ${category} assets...`);

  try {
    // Create category in manifest if it doesn't exist
    if (!assetManifest.categories[category]) {
      assetManifest.categories[category] = {
        items: [],
        lastUpdated: new Date().toISOString()
      };
    }

    // Download category index
    const indexUrl = isEnterprise
      ? `${config.cdnBase}/enterprise/${category}/index.json`
      : `${config.cdnBase}/${category}/index.json`;

    // Fetch the index using Node.js https module
    const indexData = await new Promise((resolve, reject) => {
      https.get(indexUrl, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download index: ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error('Invalid JSON in index file'));
          }
        });
      }).on('error', reject);
    });

    console.log(`Found ${indexData.assets.length} assets in ${category}`);

    // Download each asset
    const categoryDir = path.join(
      config.assetDirectory,
      isEnterprise ? 'enterprise' : '',
      category
    );

    // Ensure directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    // Track progress
    let completed = 0;

    // Process assets in batches of 5 for better performance
    const batchSize = 5;
    for (let i = 0; i < indexData.assets.length; i += batchSize) {
      const batch = indexData.assets.slice(i, i + batchSize);

      await Promise.all(batch.map(async asset => {
        const assetUrl = isEnterprise
          ? `${config.cdnBase}/enterprise/${category}/${asset.filename}`
          : `${config.cdnBase}/${category}/${asset.filename}`;

        const destPath = path.join(categoryDir, asset.filename);

        try {
          await downloadAsset(assetUrl, destPath);

          // Update manifest
          const existingIndex = assetManifest.categories[category].items
            .findIndex(item => item.id === asset.id);

          if (existingIndex >= 0) {
            assetManifest.categories[category].items[existingIndex] = {
              ...asset,
              localPath: path.relative(config.assetDirectory, destPath),
              downloadedAt: new Date().toISOString()
            };
          } else {
            assetManifest.categories[category].items.push({
              ...asset,
              localPath: path.relative(config.assetDirectory, destPath),
              downloadedAt: new Date().toISOString()
            });
            assetManifest.totalAssets++;
          }

          completed++;

          // Show progress every 10 assets or when all are done
          if (completed % 10 === 0 || completed === indexData.assets.length) {
            const progress = Math.floor((completed / indexData.assets.length) * 100);
            console.log(`Progress: ${progress}% (${completed}/${indexData.assets.length})`);
          }
        } catch (err) {
          console.error(`Failed to download ${asset.filename}: ${err.message}`);
        }
      }));
    }

    // Update category last updated timestamp
    assetManifest.categories[category].lastUpdated = new Date().toISOString();

  } catch (err) {
    console.error(`Error downloading ${category} assets:`, err.message);
    return false;
  }

  return true;
}

/**
 * Save the current asset manifest
 */
function saveManifest() {
  assetManifest.lastUpdated = new Date().toISOString();

  fs.writeFileSync(
    config.manifestPath,
    JSON.stringify(assetManifest, null, 2),
    'utf8'
  );

  console.log(`📝 Asset manifest updated (${assetManifest.totalAssets} total assets)`);
}

/**
 * Check if user has enterprise access
 */
function checkEnterpriseAccess() {
  try {
    // Check for license file
    const licensePath = path.join(__dirname, '..', 'enterprise-license.key');
    if (fs.existsSync(licensePath)) {
      return true;
    }

    // Check GitHub Enterprise access as fallback
    try {
      const output = execSync('gh auth status', { encoding: 'utf8' });
      return output.includes('github.com') && output.includes('Logged in');
    } catch (err) {
      return false;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Main function to run the asset manager
 */
async function main() {
  initialize();

  console.log('========================================');
  console.log('🎨 RED X MODSIAS UI ASSET MANAGER');
  console.log('Full-Stack Web Development Suite');
  console.log('========================================');

  const hasEnterpriseAccess = checkEnterpriseAccess();
  console.log(`Access level: ${hasEnterpriseAccess ? '🔑 Enterprise' : '🌐 Community'}`);

  console.log('\nDownloading standard assets...');

  // Download standard assets
  for (const category of config.categories) {
    await downloadCategoryAssets(category, false);
  }

  // Download enterprise assets if available
  if (hasEnterpriseAccess) {
    console.log('\nDownloading enterprise assets...');
    for (const category of config.enterpriseCategories) {
      await downloadCategoryAssets(category, true);
    }
  }

  // Save the updated manifest
  saveManifest();

  console.log('\n✅ Asset download complete!');
  console.log(`Total assets: ${assetManifest.totalAssets}`);
  console.log(`Assets directory: ${config.assetDirectory}`);
  console.log('\nEnjoy your coffee break! ☕');
}

// Run the script when executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error running asset manager:', err);
    process.exit(1);
  });
}

module.exports = {
  downloadAsset,
  downloadCategoryAssets,
  initialize,
  checkEnterpriseAccess
};
