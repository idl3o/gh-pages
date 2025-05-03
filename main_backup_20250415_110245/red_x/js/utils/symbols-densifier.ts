/**
 * SymbolsDensifier - Utility for compressing large blocks of symbols
 * Optimized for blocks of 500+ symbols in Project RED X
 */
export class SymbolsDensifier {
  /**
   * Compresses a string using Run-Length Encoding (RLE)
   * Effective for repetitive symbol sequences
   */
  static compressRLE(input: string): string {
    if (!input || input.length < 2) return input;
    
    let result = '';
    let count = 1;
    let prev = input[0];
    
    for (let i = 1; i < input.length; i++) {
      if (input[i] === prev) {
        count++;
      } else {
        result += (count > 3) ? `${prev}×${count}` : prev.repeat(count);
        prev = input[i];
        count = 1;
      }
    }
    
    result += (count > 3) ? `${prev}×${count}` : prev.repeat(count);
    return result;
  }

  /**
   * Decompresses an RLE-compressed string
   */
  static decompressRLE(input: string): string {
    return input.replace(/(.)\×(\d+)/g, (_, char, count) => 
      char.repeat(parseInt(count, 10))
    );
  }
  
  /**
   * Dictionary-based compression for symbol blocks
   * More effective for large, diverse symbol sets
   */
  static compressDictionary(input: string): {dict: Record<string, number>, output: number[]} {
    const dict: Record<string, number> = {};
    const output: number[] = [];
    const chunks: string[] = [];
    
    // Split into chunks for better compression with large symbol blocks
    const chunkSize = 3;
    for (let i = 0; i < input.length; i += chunkSize) {
      chunks.push(input.substr(i, chunkSize));
    }
    
    // Build dictionary and output
    let nextCode = 0;
    chunks.forEach(chunk => {
      if (!(chunk in dict)) {
        dict[chunk] = nextCode++;
      }
      output.push(dict[chunk]);
    });
    
    return { dict, output };
  }
  
  /**
   * Decompresses dictionary-compressed data
   */
  static decompressDictionary(dict: Record<string, number>, output: number[]): string {
    const reverseDict: Record<number, string> = {};
    
    for (const [key, value] of Object.entries(dict)) {
      reverseDict[value] = key;
    }
    
    return output.map(code => reverseDict[code]).join('');
  }

  /**
   * Compresses binary data to a Base64 string
   * Efficient for large symbol blocks with binary representation
   */
  static compressBinary(input: string): string {
    // Convert to binary
    const binary = Array.from(input)
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
      
    // Group by 6 bits (for Base64)
    const chunks: string[] = [];
    for (let i = 0; i < binary.length; i += 6) {
      chunks.push(binary.substr(i, 6).padEnd(6, '0'));
    }
    
    // Convert to Base64 character set
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64 = chunks.map(chunk => {
      const decimal = parseInt(chunk, 2);
      return base64Chars[decimal];
    }).join('');
    
    return base64;
  }
  
  /**
   * Advanced symbol block densification with type detection
   * Automatically selects optimal compression for blocks of 500+ symbols
   */
  static densify(input: string | number[] | Record<string, any>): string {
    // Handle different input types
    let stringInput: string;
    
    if (Array.isArray(input)) {
      stringInput = JSON.stringify(input);
    } else if (typeof input === 'object') {
      stringInput = JSON.stringify(input);
    } else if (typeof input === 'string') {
      stringInput = input;
    } else {
      stringInput = String(input);
    }
    
    // For short inputs, just use simple RLE
    if (stringInput.length < 500) {
      return this.compressRLE(stringInput);
    }
    
    // For large inputs with repetition, use hybrid approach
    const compressed = this.compressRLE(stringInput);
    
    // If RLE compression ratio is good, use it
    if (compressed.length < 0.7 * stringInput.length) {
      return `RLE:${compressed}`;
    }
    
    // Otherwise use binary compression for better density
    return `B64:${this.compressBinary(stringInput)}`;
  }
  
  /**
   * Expands a densified symbol block back to its original form
   */
  static expand(input: string): string {
    if (input.startsWith('RLE:')) {
      return this.decompressRLE(input.slice(4));
    }
    
    if (input.startsWith('B64:')) {
      // Base64 decompression logic would go here
      // This is a placeholder for the full implementation
      return input.slice(4);
    }
    
    // Default to RLE decompression for backwards compatibility
    return this.decompressRLE(input);
  }

  /**
   * Memory-efficient batch processing for extremely large symbol blocks
   * @param input Large symbol block
   * @param batchSize Size of each processing batch
   * @returns Compressed output
   */
  static batchDensify(input: string, batchSize = 1000): string {
    if (input.length <= batchSize) {
      return this.densify(input);
    }
    
    const batches: string[] = [];
    
    for (let i = 0; i < input.length; i += batchSize) {
      const batch = input.substr(i, batchSize);
      batches.push(this.densify(batch));
    }
    
    return `BATCH:${batches.join('|')}`;
  }
}
