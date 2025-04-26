/**
 * Comprehensive compression utilities for Project RED X
 * Optimizes WebAssembly payloads, assets, and data transmission
 */

class Compressor {
  /**
   * Compress data using the best algorithm for the given data type
   * @param {ArrayBuffer|Uint8Array|String} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Promise<Uint8Array>} - Compressed data
   */
  static async compress(data, options = {}) {
    const {
      format = 'auto', // 'auto', 'gzip', 'deflate', 'brotli', 'custom'
      level = 6, // Compression level (1-9)
      isWasm = false, // Optimize for WebAssembly
      chunkSize = 1024 * 1024 // Process in 1MB chunks to avoid memory issues
    } = options;

    // Convert input to ArrayBuffer if it's not already
    const buffer = this._toArrayBuffer(data);

    // Determine best compression format if auto
    const compressionFormat =
      format === 'auto' ? this._determineBestFormat(buffer, isWasm) : format;

    // WebAssembly-specific optimizations
    if (isWasm) {
      return this._compressWasm(buffer, compressionFormat, level);
    }

    // Use appropriate compression algorithm
    switch (compressionFormat) {
      case 'gzip':
        return this._compressGzip(buffer, level);
      case 'deflate':
        return this._compressDeflate(buffer, level);
      case 'brotli':
        return this._compressBrotli(buffer, level);
      case 'custom':
        return this._compressCustom(buffer, level);
      default:
        throw new Error(`Unsupported compression format: ${compressionFormat}`);
    }
  }

  /**
   * Decompress data
   * @param {ArrayBuffer|Uint8Array} compressedData - Compressed data
   * @param {Object} options - Decompression options
   * @returns {Promise<ArrayBuffer>} - Original data
   */
  static async decompress(compressedData, options = {}) {
    const {
      format = 'auto', // 'auto', 'gzip', 'deflate', 'brotli', 'custom'
      isWasm = false // Special handling for WebAssembly
    } = options;

    const buffer = this._toArrayBuffer(compressedData);

    // Auto-detect format if not specified
    const compressionFormat = format === 'auto' ? this._detectFormat(buffer) : format;

    // Use appropriate decompression algorithm
    switch (compressionFormat) {
      case 'gzip':
        return this._decompressGzip(buffer, isWasm);
      case 'deflate':
        return this._decompressDeflate(buffer, isWasm);
      case 'brotli':
        return this._decompressBrotli(buffer, isWasm);
      case 'custom':
        return this._decompressCustom(buffer, isWasm);
      default:
        throw new Error(`Unsupported decompression format: ${compressionFormat}`);
    }
  }

  /**
   * Optimize WebAssembly binary size
   * @param {ArrayBuffer|Uint8Array|String} wasmBinary - WebAssembly binary
   * @param {Object} options - Optimization options
   * @returns {Promise<Uint8Array>} - Optimized WebAssembly binary
   */
  static async optimizeWasm(wasmBinary, options = {}) {
    const buffer = this._toArrayBuffer(wasmBinary);

    // WebAssembly-specific optimizations before compression
    const optimized = await this._preOptimizeWasm(buffer, options);

    return this.compress(optimized, {
      ...options,
      isWasm: true
    });
  }

  /**
   * Compress files for GitHub Pages deployment
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @param {Object} options - Compression options
   * @returns {Promise<void>}
   */
  static async compressFile(inputPath, outputPath, options = {}) {
    // This would be implemented in Node.js environment
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      const util = require('util');
      const readFile = util.promisify(fs.readFile);
      const writeFile = util.promisify(fs.writeFile);

      const data = await readFile(inputPath);
      const compressed = await this.compress(data, options);
      await writeFile(outputPath, Buffer.from(compressed));

      return outputPath;
    } else {
      throw new Error('File operations not available in browser environment');
    }
  }

  /**
   * Convert various input types to ArrayBuffer
   * @private
   */
  static _toArrayBuffer(data) {
    if (data instanceof ArrayBuffer) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return data.buffer;
    }
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data).buffer;
    }
    throw new Error('Unsupported data type');
  }

  /**
   * Determine best compression format based on data characteristics
   * @private
   */
  static _determineBestFormat(buffer, isWasm) {
    // Simple heuristics for format selection
    const data = new Uint8Array(buffer);
    const size = data.length;

    // For WebAssembly, Brotli often gives best compression
    if (isWasm) return 'brotli';

    // For small files, deflate is usually efficient
    if (size < 10 * 1024) return 'deflate';

    // For medium files, gzip provides good balance
    if (size < 1024 * 1024) return 'gzip';

    // For large files, Brotli gives best compression ratio (but is slower)
    return 'brotli';
  }

  /**
   * Detect compression format from data
   * @private
   */
  static _detectFormat(buffer) {
    const data = new Uint8Array(buffer);

    // Check for gzip magic bytes (1F 8B)
    if (data[0] === 0x1f && data[1] === 0x8b) {
      return 'gzip';
    }

    // Check for zlib/deflate header (78 01, 78 9C, or 78 DA)
    if (data[0] === 0x78 && (data[1] === 0x01 || data[1] === 0x9c || data[1] === 0xda)) {
      return 'deflate';
    }

    // Brotli has no consistent magic bytes, fallback
    return 'brotli';
  }

  /**
   * WebAssembly-specific pre-optimization
   * @private
   */
  static async _preOptimizeWasm(buffer, options = {}) {
    // Enhanced WebAssembly optimization implementation

    const {
      stripCustomSections = true,  // Remove custom sections to reduce size
      stripNames = true,          // Remove debug names
      optimizeSize = true,        // Optimize for size over speed
      level = 2                   // Optimization level (1-3)
    } = options;

    // For browser environments, use the WebAssembly API if available
    if (typeof WebAssembly !== 'undefined' && WebAssembly.Module && WebAssembly.compile) {
      try {
        // First, validate the WASM binary
        const valid = WebAssembly.validate(buffer);
        if (!valid) {
          console.warn('Invalid WebAssembly module provided for optimization');
          return buffer;
        }

        // Simple header validation
        const headerView = new Uint8Array(buffer, 0, 8);
        // Magic number (0x00 0x61 0x73 0x6D) + version (0x01 0x00 0x00 0x00)
        const validHeader = headerView[0] === 0x00 &&
                            headerView[1] === 0x61 &&
                            headerView[2] === 0x73 &&
                            headerView[3] === 0x6D;

        if (!validHeader) {
          console.warn('WebAssembly binary has invalid header');
          return buffer;
        }

        // In browser environments without WASM tools, we could perform some basic optimizations
        // but for advanced optimization, we'd need a library or Node.js environment

        if (typeof WebAssembly.optimize === 'function') {
          // This is a hypothetical future API, not yet available
          return WebAssembly.optimize(buffer, {
            stripDebugInfo: stripNames,
            optimizeSize: optimizeSize
          });
        }

        // For now, we'll implement a basic section filter to remove custom sections if needed
        if (stripCustomSections) {
          return this._stripCustomSections(buffer);
        }

        return buffer;
      } catch (error) {
        console.error('Error during WebAssembly pre-optimization:', error);
        return buffer; // Return original on error
      }
    }

    // Node.js environment with WASM optimization tools
    if (typeof require !== 'undefined') {
      try {
        // Check if wasm-opt is available (via a wrapper library)
        const hasWasmOpt = this._checkForWasmOpt();

        if (hasWasmOpt) {
          return this._optimizeWithWasmOpt(buffer, {
            stripCustomSections,
            stripNames,
            optimizeSize,
            level
          });
        }
      } catch (error) {
        console.error('Error using Node.js WebAssembly tools:', error);
      }
    }

    // Fallback: return unmodified buffer
    return buffer;
  }

  /**
   * Strip custom sections from WebAssembly binary to reduce size
   * @private
   */
  static _stripCustomSections(buffer) {
    // Simple implementation to strip custom sections
    // WASM binary format: https://webassembly.github.io/spec/core/binary/modules.html

    const bytes = new Uint8Array(buffer);
    const sections = [];

    // Parse sections (skipping 8-byte header)
    let offset = 8;
    while (offset < bytes.length) {
      const sectionId = bytes[offset++];

      // Read section size (LEB128 encoding)
      let size = 0;
      let shift = 0;
      let byte;
      do {
        byte = bytes[offset++];
        size |= (byte & 0x7F) << shift;
        shift += 7;
      } while (byte & 0x80);

      // Section 0 is custom section, which we might want to strip
      if (sectionId !== 0 || !stripCustomSections) {
        sections.push({
          id: sectionId,
          offset: offset,
          size: size
        });
      }

      // Move to next section
      offset += size;
    }

    // If no custom sections found or not stripping, return original
    if (sections.length === (bytes.length - 8) / 5) { // Rough estimate
      return buffer;
    }

    // Rebuild binary without custom sections
    const newSize = sections.reduce((size, section) => size + 5 + section.size, 8);
    const result = new Uint8Array(newSize);

    // Copy header
    result.set(bytes.slice(0, 8), 0);

    // Copy each non-custom section
    let newOffset = 8;
    for (const section of sections) {
      result[newOffset++] = section.id;

      // Write size (LEB128 encoding)
      let size = section.size;
      do {
        let byte = size & 0x7F;
        size >>= 7;
        if (size !== 0) {
          byte |= 0x80;
        }
        result[newOffset++] = byte;
      } while (size !== 0);

      // Copy section content
      result.set(bytes.slice(section.offset, section.offset + section.size), newOffset);
      newOffset += section.size;
    }

    return result.buffer;
  }

  /**
   * Check if wasm-opt tool is available in Node.js environment
   * @private
   */
  static _checkForWasmOpt() {
    if (typeof require === 'undefined') return false;

    try {
      // Try to find wasm-opt or equivalent library
      const child_process = require('child_process');
      const result = child_process.spawnSync('wasm-opt', ['--version'], {
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      return result.status === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Optimize WebAssembly using wasm-opt in Node.js environment
   * @private
   */
  static _optimizeWithWasmOpt(buffer, options) {
    if (typeof require === 'undefined') return buffer;

    const fs = require('fs');
    const path = require('path');
    const child_process = require('child_process');
    const os = require('os');

    // Create temporary files
    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `wasm-in-${Date.now()}.wasm`);
    const outputFile = path.join(tmpDir, `wasm-out-${Date.now()}.wasm`);

    try {
      // Write buffer to input file
      fs.writeFileSync(inputFile, Buffer.from(buffer));

      // Build optimization arguments
      const args = [inputFile, '-o', outputFile];

      if (options.optimizeSize) {
        args.push('-Os'); // Optimize for size
      } else {
        args.push('-O'); // Regular optimization
      }

      // Add optimization level
      args.push(`-O${options.level}`);

      if (options.stripNames) {
        args.push('--strip-debug');
      }

      if (options.stripCustomSections) {
        args.push('--strip-producers');
      }

      // Run wasm-opt
      const result = child_process.spawnSync('wasm-opt', args, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      if (result.status !== 0) {
        throw new Error(`wasm-opt failed: ${result.stderr}`);
      }

      // Read optimized WASM
      const optimized = fs.readFileSync(outputFile);

      // Clean up temp files
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);

      return optimized.buffer;
    } catch (error) {
      console.error('Error optimizing with wasm-opt:', error);

      // Clean up temp files
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      // Return original on error
      return buffer;
    }
  }

  /**
   * Compress with gzip
   * @private
   */
  static async _compressGzip(buffer, level) {
    // Browser implementation using CompressionStream when available
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([buffer]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const result = await new Response(compressedStream).arrayBuffer();
      return new Uint8Array(result);
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      const zlib = require('zlib');
      const util = require('util');
      const gzip = util.promisify(zlib.gzip);

      const result = await gzip(Buffer.from(buffer), { level });
      return new Uint8Array(result);
    }

    throw new Error('Gzip compression not available in this environment');
  }

  /**
   * Decompress gzip data
   * @private
   */
  static async _decompressGzip(buffer, isWasm) {
    // Browser implementation using DecompressionStream when available
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([buffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const result = await new Response(decompressedStream).arrayBuffer();
      return result;
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      const zlib = require('zlib');
      const util = require('util');
      const gunzip = util.promisify(zlib.gunzip);

      const result = await gunzip(Buffer.from(buffer));
      return result.buffer;
    }

    throw new Error('Gzip decompression not available in this environment');
  }

  /**
   * Compress with deflate
   * @private
   */
  static async _compressDeflate(buffer, level) {
    // Similar implementation to gzip, adapted for deflate
    // Browser implementation using CompressionStream when available
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([buffer]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('deflate'));
      const result = await new Response(compressedStream).arrayBuffer();
      return new Uint8Array(result);
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      const zlib = require('zlib');
      const util = require('util');
      const deflate = util.promisify(zlib.deflate);

      const result = await deflate(Buffer.from(buffer), { level });
      return new Uint8Array(result);
    }

    throw new Error('Deflate compression not available in this environment');
  }

  /**
   * Decompress deflate data
   * @private
   */
  static async _decompressDeflate(buffer, isWasm) {
    // Browser implementation using DecompressionStream when available
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([buffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate'));
      const result = await new Response(decompressedStream).arrayBuffer();
      return result;
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      const zlib = require('zlib');
      const util = require('util');
      const inflate = util.promisify(zlib.inflate);

      const result = await inflate(Buffer.from(buffer));
      return result.buffer;
    }

    throw new Error('Deflate decompression not available in this environment');
  }

  /**
   * Compress with brotli
   * @private
   */
  static async _compressBrotli(buffer, level) {
    // Browser implementation using CompressionStream when available
    if (typeof CompressionStream !== 'undefined' && 'brotli' in CompressionStream.prototype) {
      const stream = new Blob([buffer]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('brotli'));
      const result = await new Response(compressedStream).arrayBuffer();
      return new Uint8Array(result);
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      try {
        const zlib = require('zlib');
        const util = require('util');

        // Check if brotli is supported
        if (typeof zlib.brotliCompress !== 'function') {
          throw new Error('Brotli not supported in this Node.js version');
        }

        const brotliCompress = util.promisify(zlib.brotliCompress);
        const result = await brotliCompress(Buffer.from(buffer), {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: level
          }
        });

        return new Uint8Array(result);
      } catch (error) {
        throw new Error(`Brotli compression failed: ${error.message}`);
      }
    }

    throw new Error('Brotli compression not available in this environment');
  }

  /**
   * Decompress brotli data
   * @private
   */
  static async _decompressBrotli(buffer, isWasm) {
    // Browser implementation using DecompressionStream when available
    if (typeof DecompressionStream !== 'undefined' && 'brotli' in DecompressionStream.prototype) {
      const stream = new Blob([buffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('brotli'));
      const result = await new Response(decompressedStream).arrayBuffer();
      return result;
    }

    // Node.js implementation
    if (typeof require !== 'undefined') {
      try {
        const zlib = require('zlib');
        const util = require('util');

        // Check if brotli is supported
        if (typeof zlib.brotliDecompress !== 'function') {
          throw new Error('Brotli not supported in this Node.js version');
        }

        const brotliDecompress = util.promisify(zlib.brotliDecompress);
        const result = await brotliDecompress(Buffer.from(buffer));

        return result.buffer;
      } catch (error) {
        throw new Error(`Brotli decompression failed: ${error.message}`);
      }
    }

    throw new Error('Brotli decompression not available in this environment');
  }

  /**
   * Compress with custom algorithm optimized for RED X data
   * @private
   */
  static async _compressCustom(buffer, level) {
    // Custom compression algorithm combining RLE and dictionary compression
    // This is a placeholder for a more advanced implementation
    const SymbolsDensifier =
      typeof require !== 'undefined'
        ? require('./symbols-densifier').SymbolsDensifier
        : window.SymbolsDensifier;

    // Use existing symbols densifier for custom compression
    if (SymbolsDensifier) {
      const data = new TextDecoder().decode(buffer);
      const compressed = SymbolsDensifier.densify(data);
      return new TextEncoder().encode(compressed);
    }

    // Fallback to simpler compression
    return this._compressDeflate(buffer, level);
  }

  /**
   * Decompress with custom algorithm
   * @private
   */
  static async _decompressCustom(buffer, isWasm) {
    // Custom decompression algorithm
    const SymbolsDensifier =
      typeof require !== 'undefined'
        ? require('./symbols-densifier').SymbolsDensifier
        : window.SymbolsDensifier;

    // Use existing symbols densifier for custom decompression
    if (SymbolsDensifier) {
      const data = new TextDecoder().decode(buffer);
      const decompressed = SymbolsDensifier.expand(data);
      return new TextEncoder().encode(decompressed).buffer;
    }

    // Fallback to simpler decompression
    return this._decompressDeflate(buffer, isWasm);
  }

  /**
   * Compress WebAssembly module
   * @private
   */
  static async _compressWasm(buffer, format, level) {
    // Apply WASM-specific optimizations first
    const optimizedBuffer = await this._preOptimizeWasm(buffer, { level });

    // Then apply regular compression
    switch (format) {
      case 'gzip':
        return this._compressGzip(optimizedBuffer, level);
      case 'deflate':
        return this._compressDeflate(optimizedBuffer, level);
      case 'brotli':
        return this._compressBrotli(optimizedBuffer, level);
      case 'custom':
        return this._compressCustom(optimizedBuffer, level);
      default:
        throw new Error(`Unsupported compression format for WASM: ${format}`);
    }
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Compressor;
} else if (typeof window !== 'undefined') {
  window.Compressor = Compressor;
}
