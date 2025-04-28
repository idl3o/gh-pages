/**
 * MCP Configuration Validator
 * Validates the structure and content of MCP configuration
 */

const fs = require('fs');
const path = require('path');

// Path to MCP config
const configPath = path.join(__dirname, '..', 'mcp.config.js');

// Required fields in the config
const requiredFields = [
  'version',
  'projectName',
  'contextBoundaries',
  'knowledgeDomains',
  'modelInteraction'
];

// Required fields in contextBoundaries
const requiredContextFields = ['maxContextSize', 'priorityFiles', 'excludedPaths'];

// Required fields in each knowledge domain
const requiredDomainFields = ['name', 'description', 'relevantPaths'];

/**
 * Validate the structure of the MCP configuration
 * @param {Object} config - The MCP configuration object
 * @returns {Object} - Validation result with success flag and any errors
 */
function validateConfig(config) {
  const errors = [];

  // Check for required top-level fields
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check context boundaries
  if (config.contextBoundaries) {
    for (const field of requiredContextFields) {
      if (!config.contextBoundaries[field]) {
        errors.push(`Missing required field in contextBoundaries: ${field}`);
      }
    }

    // Check max context size is reasonable
    if (config.contextBoundaries.maxContextSize < 1024) {
      errors.push('maxContextSize should be at least 1024 tokens');
    }

    // Check that priorityFiles is an array
    if (!Array.isArray(config.contextBoundaries.priorityFiles)) {
      errors.push('priorityFiles should be an array');
    }

    // Check that excludedPaths is an array
    if (!Array.isArray(config.contextBoundaries.excludedPaths)) {
      errors.push('excludedPaths should be an array');
    }
  }

  // Check knowledge domains
  if (config.knowledgeDomains) {
    if (!Array.isArray(config.knowledgeDomains)) {
      errors.push('knowledgeDomains should be an array');
    } else {
      for (const [i, domain] of config.knowledgeDomains.entries()) {
        for (const field of requiredDomainFields) {
          if (!domain[field]) {
            errors.push(`Missing required field in knowledge domain at index ${i}: ${field}`);
          }
        }

        // Check that relevantPaths is an array
        if (!Array.isArray(domain.relevantPaths)) {
          errors.push(`relevantPaths in domain "${domain.name}" should be an array`);
        }
      }
    }
  }

  // Check model interaction
  if (config.modelInteraction) {
    if (config.modelInteraction.maxCodeBlockSize && config.modelInteraction.maxCodeBlockSize < 10) {
      errors.push('maxCodeBlockSize should be at least 10 lines');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Verify that files referenced in priority list exist
 * @param {Array<string>} priorityFiles - List of priority file paths
 * @returns {Array<string>} - List of missing files
 */
function checkPriorityFilesExist(priorityFiles) {
  const missingFiles = [];

  for (const filePath of priorityFiles) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(filePath);
    }
  }

  return missingFiles;
}

/**
 * Main validation function
 */
function main() {
  try {
    // Load MCP config
    const config = require(configPath);

    console.log('Validating MCP configuration...');

    // Validate config structure
    const validationResult = validateConfig(config);

    if (!validationResult.valid) {
      console.error('❌ MCP configuration validation failed:');
      validationResult.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
      process.exit(1);
    }

    // Check that priority files exist
    const missingFiles = checkPriorityFilesExist(config.contextBoundaries.priorityFiles);
    if (missingFiles.length > 0) {
      console.error('❌ Some priority files do not exist:');
      missingFiles.forEach(file => {
        console.error(`  - ${file}`);
      });
      process.exit(1);
    }

    console.log('✅ MCP configuration is valid!');

    // Additional validations could be added here
  } catch (error) {
    console.error(`Failed to load or validate MCP config: ${error.message}`);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateConfig,
  checkPriorityFilesExist
};
