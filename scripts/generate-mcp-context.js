/**
 * MCP Context Generator
 * Generates contextual information for AI models based on the MCP configuration
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ModelContextProvider = require('../model-context-provider');
const mcpConfig = require('../mcp.config');

// Output directory for generated context
const OUTPUT_DIR = path.join(__dirname, '..', 'mcp-context');

/**
 * Create a domain-specific context file
 * @param {string} domainName - Name of the knowledge domain
 * @param {ModelContextProvider} contextProvider - Provider instance
 */
async function generateDomainContext(domainName, contextProvider) {
  try {
    console.log(`Generating context for domain: ${domainName}...`);

    // Get context from the provider
    const context = await contextProvider.getDomainContext(domainName);

    // Create output file path
    const outputPath = path.join(OUTPUT_DIR, `${domainName}-context.json`);

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(context, null, 2));

    console.log(`✅ Context for domain '${domainName}' generated at: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating context for domain '${domainName}':`, error.message);
  }
}

/**
 * Create an overview context of the project
 * @param {ModelContextProvider} contextProvider - Provider instance
 */
async function generateProjectOverview(contextProvider) {
  try {
    console.log('Generating project overview context...');

    // Get project structure
    const structure = await contextProvider.getProjectStructure();

    // Get high-level statistics
    const stats = await generateProjectStats();

    // Create an overview object
    const overview = {
      project: {
        name: mcpConfig.projectName,
        description: mcpConfig.description,
        version: mcpConfig.version
      },
      structure,
      statistics: stats,
      knowledgeDomains: mcpConfig.knowledgeDomains.map(domain => ({
        name: domain.name,
        description: domain.description
      })),
      generatedAt: new Date().toISOString()
    };

    // Create output file path
    const outputPath = path.join(OUTPUT_DIR, 'project-overview.json');

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(overview, null, 2));

    console.log(`✅ Project overview generated at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating project overview:', error.message);
  }
}

/**
 * Generate basic statistics about the project
 */
async function generateProjectStats() {
  // Count files by type
  const fileStats = {
    js: glob.sync('**/*.js', { ignore: mcpConfig.contextBoundaries.excludedPaths }).length,
    md: glob.sync('**/*.md', { ignore: mcpConfig.contextBoundaries.excludedPaths }).length,
    html: glob.sync('**/*.html', { ignore: mcpConfig.contextBoundaries.excludedPaths }).length,
    css: glob.sync('**/*.css', { ignore: mcpConfig.contextBoundaries.excludedPaths }).length,
    sol: glob.sync('**/*.sol', { ignore: mcpConfig.contextBoundaries.excludedPaths }).length
  };

  return {
    fileStats,
    totalFiles: Object.values(fileStats).reduce((sum, count) => sum + count, 0)
  };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting MCP context generation...');

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Create context provider
    const contextProvider = new ModelContextProvider(mcpConfig);

    // Generate the project overview
    await generateProjectOverview(contextProvider);

    // Generate context for each knowledge domain
    for (const domain of mcpConfig.knowledgeDomains) {
      await generateDomainContext(domain.name, contextProvider);
    }

    console.log('MCP context generation completed successfully!');
  } catch (error) {
    console.error('Error generating MCP context:', error.message);
    process.exit(1);
  }
}

// Run context generation if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateDomainContext,
  generateProjectOverview,
  generateProjectStats
};
