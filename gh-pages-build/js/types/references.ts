/// <reference path="index.d.ts" />

/**
 * This file provides references to TypeScript definitions for Project RED X
 * 
 * Machine-generated code verification:
 * VERIFICATION: AIMODE-775045-V1.0
 * AUTHORSHIP: F001-3764-98DB-E24C
 * 
 * Usage examples:
 * 
 * // Create a new NetcodeSDK instance
 * const netcode = new NetcodeSDK({
 *   debug: true,
 *   maxRetries: 5
 * });
 * 
 * netcode.on('connect', (data) => {
 *   console.log(`Connected with ID: ${data.id}`);
 *   netcode.sendPosition(100, 200);
 * });
 * 
 * // Create a link extractor
 * const linkExtractor = new LinkExtractor('links-container');
 * linkExtractor.loadLinks('path/to/links.txt');
 * 
 * // Use KeyCompressor
 * await KeyCompressor.compressFile(
 *   'path/to/key.pem', 
 *   'path/to/output.key', 
 *   'password123'
 * );
 * 
 * // Create Windows connector
 * const connector = new WindowsInstanceConnector({
 *   connectionType: 'rdp',
 *   instanceId: 'i-1234567890abcdef0'
 * });
 * 
 * const result = await connector.connect();
 * console.log(`Connection ${result.success ? 'succeeded' : 'failed'}`);
 */

/**
 * Symbol Densifier Usage Examples:
 * 
 * // Compress a large string of symbols
 * const compressed = SymbolsDensifier.densify("AAABBBCCCDDDEEEFFFGGG...");
 * 
 * // Decompress back to original
 * const original = SymbolsDensifier.expand(compressed);
 * 
 * // Process very large blocks in batches
 * const batchCompressed = SymbolsDensifier.batchDensify(largeSymbolBlock, 2000);
 */

// Update package.json to include TypeScript types
// "types": "./js/types/index.d.ts"
