/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#!/usr/bin/env node

/**
 * License Compatibility Checker
 * 
 * This script checks all project dependencies for license compatibility with our MIT license.
 * It flags any potentially problematic licenses that may not be compatible.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of licenses known to be compatible with MIT
const COMPATIBLE_LICENSES = [
  'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 
  'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'Unlicense', '0BSD'
];

// Licenses that might need further review
const REVIEW_LICENSES = [
  'GPL-3.0', 'LGPL-3.0', 'MPL-2.0', 'CDDL-1.0'
];

// Run license-checker to get all dependency licenses
exec('npx license-checker --json', (error, stdout) => {
  if (error) {
    console.error(`Error running license-checker: ${error.message}`);
    process.exit(1);
  }

  const licenses = JSON.parse(stdout);
  const incompatible = [];
  const needsReview = [];
  const unknown = [];

  for (const [pkg, info] of Object.entries(licenses)) {
    const license = info.licenses;
    
    if (!license || license === 'UNKNOWN') {
      unknown.push({ name: pkg, ...info });
    } else if (Array.isArray(license)) {
      // Multiple licenses
      const allCompatible = license.some(lic => COMPATIBLE_LICENSES.includes(lic));
      const needsReviewing = license.some(lic => REVIEW_LICENSES.includes(lic));
      
      if (!allCompatible && needsReviewing) {
        needsReview.push({ name: pkg, ...info });
      } else if (!allCompatible) {
        incompatible.push({ name: pkg, ...info });
      }
    } else if (!COMPATIBLE_LICENSES.includes(license)) {
      if (REVIEW_LICENSES.includes(license)) {
        needsReview.push({ name: pkg, ...info });
      } else {
        incompatible.push({ name: pkg, ...info });
      }
    }
  }

  console.log('\n=== LICENSE COMPATIBILITY REPORT ===\n');
  
  if (incompatible.length === 0 && needsReview.length === 0 && unknown.length === 0) {
    console.log('✅ All licenses are compatible with MIT!\n');
  } else {
    if (incompatible.length > 0) {
      console.log('⚠️ INCOMPATIBLE LICENSES:');
      incompatible.forEach(item => {
        console.log(`- ${item.name}: ${item.licenses}`);
      });
      console.log('');
    }
    
    if (needsReview.length > 0) {
      console.log('🔍 LICENSES NEEDING REVIEW:');
      needsReview.forEach(item => {
        console.log(`- ${item.name}: ${item.licenses}`);
      });
      console.log('');
    }
    
    if (unknown.length > 0) {
      console.log('❓ UNKNOWN LICENSES:');
      unknown.forEach(item => {
        console.log(`- ${item.name}: Unknown license`);
      });
      console.log('');
    }
    
    console.log('Please review these dependencies for license compliance.');
  }
});