#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple utility for processing JSON files
 * - Validates JSON syntax
 * - Pretty prints JSON content
 * - Provides basic statistics about the JSON structure
 */

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: Please provide a JSON file path as an argument');
  console.log('Usage: node process-json.js <path-to-json-file>');
  process.exit(1);
}

try {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Read and parse the JSON file
  const rawData = fs.readFileSync(filePath, 'utf8');
  let jsonData;
  
  try {
    jsonData = JSON.parse(rawData);
    console.log('✅ JSON is valid');
  } catch (e) {
    console.error('❌ Invalid JSON:', e.message);
    process.exit(1);
  }

  // Display basic info
  console.log('\n--- JSON File Information ---');
  console.log(`File: ${path.basename(filePath)}`);
  console.log(`Size: ${(rawData.length / 1024).toFixed(2)} KB`);

  // Analyze JSON structure
  console.log('\n--- JSON Structure ---');
  if (Array.isArray(jsonData)) {
    console.log(`Array with ${jsonData.length} items`);
    if (jsonData.length > 0) {
      console.log(`First item type: ${typeof jsonData[0]}`);
    }
  } else {
    console.log('Object with properties:');
    const keys = Object.keys(jsonData);
    console.log(`- ${keys.length} top-level keys`);
    keys.slice(0, 10).forEach(key => {
      const value = jsonData[key];
      const type = typeof value;
      const display = type === 'object' ? 
        (Array.isArray(value) ? `Array[${value.length}]` : 'Object') : 
        (value === null ? 'null' : type);
      console.log(`- ${key}: ${display}`);
    });
    if (keys.length > 10) {
      console.log(`- ... and ${keys.length - 10} more`);
    }
  }

  // Pretty print the JSON
  console.log('\n--- Formatted JSON ---');
  console.log(JSON.stringify(jsonData, null, 2));

} catch (error) {
  console.error('Error processing JSON file:', error.message);
  process.exit(1);
}
