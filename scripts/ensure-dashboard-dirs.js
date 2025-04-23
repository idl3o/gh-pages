/**
 * Ensure Dashboard Directories
 *
 * This script creates necessary directories and placeholder files for the dashboard
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Setting up dashboard directories'));

// Define directories to create
const directories = ['images', 'css', 'js', 'data'];

// Create each directory if it doesn't exist
const rootDir = path.join(__dirname, '..');

directories.forEach(dir => {
  const dirPath = path.join(rootDir, dir);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(chalk.green(`✅ Created directory: ${dir}`));
  } else {
    console.log(chalk.gray(`Directory already exists: ${dir}`));
  }
});

// Create placeholder images for thumbnails and avatars
const imagePlaceholders = [
  { name: 'thumbnail1.jpg', type: 'thumbnail' },
  { name: 'thumbnail2.jpg', type: 'thumbnail' },
  { name: 'thumbnail3.jpg', type: 'thumbnail' },
  { name: 'thumbnail4.jpg', type: 'thumbnail' },
  { name: 'thumbnail5.jpg', type: 'thumbnail' },
  { name: 'avatar.jpg', type: 'avatar' },
  { name: 'user1.jpg', type: 'avatar' },
  { name: 'user2.jpg', type: 'avatar' },
  { name: 'user3.jpg', type: 'avatar' },
  { name: 'logo.svg', type: 'logo' }
];

const imagesDir = path.join(rootDir, 'images');

// Check if we have any placeholder files
let placeholderMissing = false;
imagePlaceholders.forEach(image => {
  const imagePath = path.join(imagesDir, image.name);
  if (!fs.existsSync(imagePath)) {
    placeholderMissing = true;
  }
});

if (placeholderMissing) {
  console.log(chalk.yellow('⚠️ Some placeholder images are missing'));
  console.log(chalk.yellow('Please add images to the images/ directory with the following names:'));
  imagePlaceholders.forEach(image => {
    console.log(chalk.gray(`- ${image.name} (${image.type})`));
  });
} else {
  console.log(chalk.green('✅ All placeholder images exist'));
}

// Create a simple SVG logo if it doesn't exist
const logoPath = path.join(imagesDir, 'logo.svg');
if (!fs.existsSync(logoPath)) {
  const svgLogo = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#3498DB"/>
  <path d="M10 20L18 12V16C26 16 30 20 30 28C27 24 24 22 18 22V26L10 20Z" fill="white"/>
</svg>`;

  fs.writeFileSync(logoPath, svgLogo);
  console.log(chalk.green('✅ Created placeholder logo.svg'));
}

console.log(chalk.blue('🎉 Dashboard directory setup complete!'));
