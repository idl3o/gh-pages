/**
 * MCP Schema Generator
 * Generates JSON schema definitions for key data structures in the project
 */

const fs = require('fs');
const path = require('path');
const mcpConfig = require('../mcp.config');

// Output directory for generated schemas
const OUTPUT_DIR = path.join(__dirname, '..', 'mcp-schemas');

/**
 * Generate schema files based on the definitions in MCP config
 */
function generateSchemaFiles() {
  const { schemaDefinitions } = mcpConfig;

  if (!schemaDefinitions) {
    console.error('No schema definitions found in MCP config');
    return;
  }

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate a separate schema file for each definition
  for (const [schemaName, schemaObject] of Object.entries(schemaDefinitions)) {
    // Create a complete JSON Schema document
    const fullSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: toTitleCase(schemaName),
      description: `Schema definition for ${schemaName}`,
      ...schemaObject
    };

    // Write to file
    const outputPath = path.join(OUTPUT_DIR, `${schemaName}.schema.json`);
    fs.writeFileSync(outputPath, JSON.stringify(fullSchema, null, 2));

    console.log(`✅ Generated schema for ${schemaName} at: ${outputPath}`);
  }
}

/**
 * Generate an index schema that references all other schemas
 */
function generateIndexSchema() {
  const { schemaDefinitions } = mcpConfig;

  if (!schemaDefinitions) {
    return;
  }

  // Create a schema that references all others
  const indexSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'StreamChain Schema Definitions',
    description: 'Index of all schema definitions for the StreamChain project',
    type: 'object',
    properties: {}
  };

  // Add references to each schema
  for (const schemaName of Object.keys(schemaDefinitions)) {
    indexSchema.properties[schemaName] = {
      $ref: `./${schemaName}.schema.json`
    };
  }

  // Write to file
  const outputPath = path.join(OUTPUT_DIR, 'index.schema.json');
  fs.writeFileSync(outputPath, JSON.stringify(indexSchema, null, 2));

  console.log(`✅ Generated index schema at: ${outputPath}`);
}

/**
 * Convert a camelCase or snake_case string to Title Case
 * @param {string} str - The string to convert
 * @returns {string} - The converted string
 */
function toTitleCase(str) {
  // Replace camelCase with spaces before uppercase letters
  str = str.replace(/([A-Z])/g, ' $1');
  // Replace snake_case with spaces
  str = str.replace(/_/g, ' ');
  // Title case each word
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Starting MCP schema generation...');

    // Generate individual schema files
    generateSchemaFiles();

    // Generate index schema
    generateIndexSchema();

    console.log('MCP schema generation completed successfully!');
  } catch (error) {
    console.error('Error generating MCP schemas:', error.message);
    process.exit(1);
  }
}

// Run schema generation if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSchemaFiles,
  generateIndexSchema
};
