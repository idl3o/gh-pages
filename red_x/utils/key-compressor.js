const zlib = require('zlib');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Promisify zlib functions
const gzipPromise = util.promisify(zlib.gzip);
const gunzipPromise = util.promisify(zlib.gunzip);

/**
 * Utility class for compressing and encrypting private keys
 */
class KeyCompressor {
  /**
   * Compress and optionally encrypt a private key
   * @param {string|Buffer} privateKey - The private key content to compress
   * @param {string} [password] - Optional password for encryption
   * @returns {Promise<Buffer>} Compressed (and encrypted if password provided) key
   */
  static async compress(privateKey, password = null) {
    // Convert to buffer if string
    if (typeof privateKey === 'string') {
      privateKey = Buffer.from(privateKey);
    }
    
    // Compress the key
    const compressed = await gzipPromise(privateKey);
    
    // If password provided, encrypt the compressed data
    if (password) {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with AES-256-CBC
      const cipher = crypto.createCipheriv(
        'aes-256-cbc', 
        crypto.createHash('sha256').update(password).digest(), 
        iv
      );
      
      // Encrypt the compressed data
      const encrypted = Buffer.concat([
        cipher.update(compressed),
        cipher.final()
      ]);
      
      // Return IV + encrypted data
      return Buffer.concat([iv, encrypted]);
    }
    
    // Return just compressed data if no password
    return compressed;
  }
  
  /**
   * Decompress and optionally decrypt a private key
   * @param {Buffer} compressedKey - The compressed key data
   * @param {string} [password] - Password used for encryption (if encrypted)
   * @returns {Promise<Buffer>} Original key content
   */
  static async decompress(compressedKey, password = null) {
    let dataToDecompress = compressedKey;
    
    // If password provided, decrypt first
    if (password) {
      // Extract IV (first 16 bytes)
      const iv = compressedKey.slice(0, 16);
      const encryptedData = compressedKey.slice(16);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.createHash('sha256').update(password).digest(),
        iv
      );
      
      // Decrypt the data
      dataToDecompress = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
    }
    
    // Decompress and return
    return await gunzipPromise(dataToDecompress);
  }
  
  /**
   * Compress a private key file
   * @param {string} inputPath - Path to the input key file
   * @param {string} outputPath - Path to save the compressed key
   * @param {string} [password] - Optional password for encryption
   * @returns {Promise<string>} Path to the compressed file
   */
  static async compressFile(inputPath, outputPath, password = null) {
    // Read the file
    const keyData = fs.readFileSync(inputPath);
    
    // Compress (and encrypt if password provided)
    const compressed = await this.compress(keyData, password);
    
    // Write to the output file
    fs.writeFileSync(outputPath, compressed);
    
    return outputPath;
  }
  
  /**
   * Decompress a private key file
   * @param {string} inputPath - Path to the compressed key file
   * @param {string} outputPath - Path to save the decompressed key
   * @param {string} [password] - Password used for encryption (if encrypted)
   * @returns {Promise<string>} Path to the decompressed file
   */
  static async decompressFile(inputPath, outputPath, password = null) {
    // Read the compressed file
    const compressedData = fs.readFileSync(inputPath);
    
    // Decompress (and decrypt if password provided)
    const decompressed = await this.decompress(compressedData, password);
    
    // Write to the output file
    fs.writeFileSync(outputPath, decompressed);
    
    // Set proper permissions for private key
    fs.chmodSync(outputPath, 0o600);
    
    return outputPath;
  }
}

module.exports = KeyCompressor;
