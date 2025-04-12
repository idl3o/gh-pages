#!/usr/bin/env node

/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Compliance Backup Script
 * 
 * Creates a timestamped backup of all compliance-related files and documentation.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Files to include in the backup
const COMPLIANCE_FILES = [
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'PRIVACY.md',
  'README.md',
  'SECURITY.md',
  'TERMS.md',
  'DEVELOPER.md',
  'package.json',
  '.github/**',
  'scripts/add-license-headers.js',
  'scripts/check-licenses.js',
  'scripts/license-header.js'
];

// Create a timestamped backup directory name
function getBackupName() {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  
  return `compliance-backup-${timestamp}.zip`;
}

async function createBackup() {
  const rootDir = path.join(__dirname, '..');
  const backupDir = path.join(rootDir, 'backups');
  const backupName = getBackupName();
  const backupPath = path.join(backupDir, backupName);
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Create zip file
  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Pipe archive to file
  archive.pipe(output);
  
  // Add compliance files
  for (const pattern of COMPLIANCE_FILES) {
    if (pattern.includes('*')) {
      // It's a directory pattern
      const baseDir = pattern.split('*')[0];
      archive.directory(path.join(rootDir, baseDir), baseDir);
    } else {
      // It's a file
      const filePath = path.join(rootDir, pattern);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: pattern });
      }
    }
  }
  
  // Add a metadata file with timestamp
  const metadata = {
    createdAt: new Date().toISOString(),
    description: 'Compliance document backup',
    files: COMPLIANCE_FILES
  };
  
  archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });
  
  // Finalize the archive
  await archive.finalize();
  
  console.log(`Backup created: ${backupPath}`);
  return backupPath;
}

// Run the script if called directly
if (require.main === module) {
  createBackup().catch(err => {
    console.error('Error creating backup:', err);
    process.exit(1);
  });
}

module.exports = { createBackup };