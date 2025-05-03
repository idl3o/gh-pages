#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const KeyCompressor = require('./key-compressor');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to securely prompt for a password
async function promptPassword(question) {
  // Most secure method would use readline with muting, but for simplicity:
  return await promptQuestion(question);
}

async function main() {
  try {
    console.log('🔐 Private Key Compression Utility 🔐');
    console.log('=====================================');
    
    // Get the input file path
    let inputPath = process.argv[2];
    if (!inputPath) {
      inputPath = await promptQuestion('Enter the path to the private key file: ');
    }
    
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }
    
    // Get the output file path
    let outputPath = process.argv[3];
    if (!outputPath) {
      const defaultOutput = `${path.basename(inputPath)}.compressed`;
      outputPath = await promptQuestion(`Enter output file path (default: ${defaultOutput}): `);
      if (!outputPath.trim()) {
        outputPath = defaultOutput;
      }
    }
    
    // Get the encryption password
    const password = await promptPassword('Enter password for encryption: ');
    if (!password) {
      console.error('Error: Password is required for encryption');
      process.exit(1);
    }
    
    console.log(`\nCompressing key file: ${inputPath}`);
    console.log(`Output will be saved to: ${outputPath}`);
    
    // Compress the file
    await KeyCompressor.compressFile(inputPath, outputPath, password);
    
    console.log('\n✅ Key compressed and encrypted successfully!');
    console.log(`\nTo use this key with the Windows connector, update your .env file:`);
    console.log(`WINDOWS_COMPRESSED_KEY_PATH=${outputPath}`);
    console.log(`WINDOWS_KEY_PASSWORD=your-password-here`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
