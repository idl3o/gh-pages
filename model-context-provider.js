/**
 * Model Context Provider
 * Manages context collection and provides structured data for AI models
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const config = require('./mcp.config');

class ModelContextProvider {
  constructor(config) {
    this.config = config;
    this.cache = {
      fileContents: {},
      directoryStructure: null,
      lastUpdated: {}
    };
  }

  /**
   * Get context for a specific knowledge domain
   * @param {string} domainName - Name of the domain to get context for
   * @returns {Object} Domain context information
   */
  async getDomainContext(domainName) {
    const domain = this.config.knowledgeDomains.find(d => d.name === domainName);

    if (!domain) {
      throw new Error(`Domain '${domainName}' not found in configuration`);
    }

    // Get all files matching the relevant paths for this domain
    const files = await this.getFilesForDomain(domain);

    // Build a context object
    const context = {
      domain: {
        name: domain.name,
        description: domain.description
      },
      files: await this.getFilesContent(files, domainName),
      metadata: {
        generatedAt: new Date().toISOString(),
        fileCount: files.length
      }
    };

    return context;
  }

  /**
   * Get content of multiple files with basic caching
   */
  async getFilesContent(files, cacheKey) {
    const results = [];
    const now = Date.now();
    const cacheTimeout = 60000; // 1 minute cache

    for (const file of files) {
      let content;

      // Check if we have a relatively fresh cached version
      if (
        this.cache.fileContents[file] &&
        this.cache.lastUpdated[file] &&
        now - this.cache.lastUpdated[file] < cacheTimeout
      ) {
        content = this.cache.fileContents[file];
      } else {
        // Read content and update cache
        try {
          content = fs.readFileSync(path.resolve(file), 'utf8');
          this.cache.fileContents[file] = content;
          this.cache.lastUpdated[file] = now;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error.message);
          content = `[Error reading file: ${error.message}]`;
        }
      }

      results.push({
        path: file,
        content: content,
        language: this.getFileLanguage(file)
      });
    }

    return results;
  }

  /**
   * Get all files matching domain's relevantPaths
   */
  async getFilesForDomain(domain) {
    const allFiles = [];

    // For each path pattern, find matching files
    for (const pattern of domain.relevantPaths) {
      const files = glob.sync(pattern, {
        ignore: this.config.contextBoundaries.excludedPaths,
        cwd: process.cwd(),
        nodir: true
      });

      allFiles.push(...files);
    }

    // Prioritize files that match priority list
    return Array.from(new Set(allFiles)).sort((a, b) => {
      const aIsPriority = this.config.contextBoundaries.priorityFiles.includes(a);
      const bIsPriority = this.config.contextBoundaries.priorityFiles.includes(b);

      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return 0;
    });
  }

  /**
   * Get programming language from file extension
   */
  getFileLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.md': 'markdown',
      '.sol': 'solidity',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.json': 'json',
      '.sh': 'bash',
      '.ps1': 'powershell',
      '.cmd': 'batch'
    };

    return languageMap[ext] || 'plaintext';
  }

  /**
   * Get basic project structure to provide context
   */
  async getProjectStructure() {
    // Return cached structure if available
    if (this.cache.directoryStructure) {
      return this.cache.directoryStructure;
    }

    // Otherwise build it
    const structure = await this.buildProjectStructure();
    this.cache.directoryStructure = structure;

    return structure;
  }

  /**
   * Build a simplified project structure
   */
  async buildProjectStructure() {
    // This is a simplified structure - in reality would need a proper directory walker
    const rootDirs = ['assets', 'cli', 'config', 'contracts', 'docs', 'red_x', 'scripts', 'utils'];

    const structure = {
      name: 'root',
      type: 'directory',
      children: rootDirs.map(dir => ({
        name: dir,
        type: 'directory',
        path: dir
      }))
    };

    return structure;
  }
}

module.exports = ModelContextProvider;
