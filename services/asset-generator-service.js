/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Asset Generator Service
 * 
 * Provides both dynamic (on-demand) and static (pre-generated) asset generation
 * for the Web3 Crypto Streaming Service. Supports:
 * - NFT thumbnails and previews
 * - Content placeholders
 * - Profile images and banners
 * - Various icon sizes and formats
 * - Text-to-image generation for content without visuals
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createCanvas, loadImage, registerFont } = require('canvas');
const EventEmitter = require('events');
const IPFSService = require('./ipfs-service');
const sharp = require('sharp');
const os = require('os');

// Constants for asset types and sizes
const ASSET_TYPES = {
  NFT: 'nft',
  THUMBNAIL: 'thumbnail',
  PREVIEW: 'preview',
  PROFILE: 'profile',
  BANNER: 'banner',
  ICON: 'icon',
  PLACEHOLDER: 'placeholder'
};

// Default sizes for various asset types in pixels (width × height)
const DEFAULT_SIZES = {
  [ASSET_TYPES.NFT]: { width: 600, height: 600 },
  [ASSET_TYPES.THUMBNAIL]: { width: 300, height: 300 },
  [ASSET_TYPES.PREVIEW]: { width: 600, height: 338 }, // 16:9 aspect ratio
  [ASSET_TYPES.PROFILE]: { width: 200, height: 200 },
  [ASSET_TYPES.BANNER]: { width: 1200, height: 300 },
  [ASSET_TYPES.ICON]: { width: 32, height: 32 },
  [ASSET_TYPES.PLACEHOLDER]: { width: 800, height: 600 }
};

// Default colors for various brand elements
const BRAND_COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#10b981', // Emerald
  tertiary: '#f59e0b', // Amber
  accent: '#ec4899', // Pink
  background: '#f0f4f8', // Light blue-gray
  text: '#111827' // Near-black
};

// Font settings
const FONTS = {
  primary: {
    family: 'Arial',
    fallback: 'sans-serif'
  },
  heading: {
    family: 'Arial',
    weight: 'bold',
    fallback: 'sans-serif'
  },
  monospace: {
    family: 'Courier New',
    fallback: 'monospace'
  }
};

/**
 * Asset Generator Service class
 */
class AssetGeneratorService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      cacheDir: options.cacheDir || path.join(process.cwd(), 'cache', 'assets'),
      staticDir: options.staticDir || path.join(process.cwd(), 'assets', 'images'),
      maxCacheSize: options.maxCacheSize || 1024 * 1024 * 100, // 100MB
      ipfsEnabled: options.ipfsEnabled === undefined ? true : !!options.ipfsEnabled,
      compressionLevel: options.compressionLevel || 80, // JPEG quality 0-100
      cacheTTL: options.cacheTTL || 24 * 60 * 60 * 1000, // 24 hours in ms
      ...options
    };
    
    // Ensure cache directory exists
    this._ensureDirectoryExists(this.config.cacheDir);
    
    // Keep track of cache size
    this.cacheSize = 0;
    
    // Initialize font paths
    this.initFonts();
  }
  
  /**
   * Initialize fonts
   */
  initFonts() {
    try {
      // Try to register custom fonts if available
      const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
      
      if (fs.existsSync(path.join(fontsDir, 'Inter-Regular.ttf'))) {
        registerFont(path.join(fontsDir, 'Inter-Regular.ttf'), { family: 'Inter', weight: 'normal' });
        FONTS.primary.family = 'Inter';
      }
      
      if (fs.existsSync(path.join(fontsDir, 'Inter-Bold.ttf'))) {
        registerFont(path.join(fontsDir, 'Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
        FONTS.heading.family = 'Inter';
      }
      
      if (fs.existsSync(path.join(fontsDir, 'JetBrainsMono-Regular.ttf'))) {
        registerFont(path.join(fontsDir, 'JetBrainsMono-Regular.ttf'), { family: 'JetBrains Mono' });
        FONTS.monospace.family = 'JetBrains Mono';
      }
    } catch (error) {
      console.warn('Failed to initialize custom fonts:', error.message);
    }
  }
  
  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   * @private
   */
  _ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  /**
   * Clean cache if it exceeds max size
   * @private
   */
  _cleanupCache() {
    if (this.cacheSize <= this.config.maxCacheSize) {
      return;
    }
    
    try {
      // Get all cache files with timestamps
      const files = fs.readdirSync(this.config.cacheDir)
        .map(file => {
          const filePath = path.join(this.config.cacheDir, file);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          };
        })
        .sort((a, b) => a.created - b.created); // Sort by age, oldest first
      
      // Delete oldest files until we're under the limit
      let currentSize = this.cacheSize;
      for (const file of files) {
        if (currentSize <= this.config.maxCacheSize * 0.8) {
          break; // Stop when we're 20% under the limit
        }
        
        fs.unlinkSync(file.path);
        currentSize -= file.size;
        
        this.emit('cache:removed', {
          file: file.path,
          size: file.size
        });
      }
      
      // Update cached size
      this.cacheSize = currentSize;
    } catch (error) {
      console.error('Error cleaning asset cache:', error);
    }
  }
  
  /**
   * Generate a cache key from parameters
   * @param {Object} params - Generation parameters
   * @returns {string} Cache key
   * @private
   */
  _generateCacheKey(params) {
    const stringifiedParams = JSON.stringify(params);
    return crypto.createHash('md5').update(stringifiedParams).digest('hex');
  }
  
  /**
   * Check if asset exists in cache
   * @param {string} cacheKey - Cache key
   * @returns {string|null} Cached file path or null
   * @private
   */
  _getCachedAsset(cacheKey) {
    const cachePath = path.join(this.config.cacheDir, `${cacheKey}.png`);
    
    if (fs.existsSync(cachePath)) {
      // Check if cache is expired
      const stats = fs.statSync(cachePath);
      const now = Date.now();
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > this.config.cacheTTL) {
        // Cache expired
        fs.unlinkSync(cachePath);
        this.cacheSize -= stats.size;
        return null;
      }
      
      return cachePath;
    }
    
    return null;
  }
  
  /**
   * Save asset to cache
   * @param {string} cacheKey - Cache key
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {string} Cached file path
   * @private
   */
  async _saveToCache(cacheKey, imageBuffer) {
    const cachePath = path.join(this.config.cacheDir, `${cacheKey}.png`);
    
    fs.writeFileSync(cachePath, imageBuffer);
    
    // Update cache size
    const stats = fs.statSync(cachePath);
    this.cacheSize += stats.size;
    
    // Clean up if needed
    this._cleanupCache();
    
    return cachePath;
  }
  
  /**
   * Generate a seed from input text
   * @param {string} text - Input text
   * @returns {number} Numeric seed value
   * @private
   */
  _generateSeed(text) {
    if (!text) return Date.now();
    
    // Convert text to numeric seed
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return parseInt(hash.substring(0, 10), 16);
  }
  
  /**
   * Generate a deterministic color from seed
   * @param {number} seed - Seed value
   * @param {number} index - Color index
   * @returns {string} Hex color
   * @private
   */
  _generateColor(seed, index = 0) {
    // Use deterministic algorithm based on seed
    const value = (seed * 9301 + 49297) % 233280;
    const rnd = value / 233280;
    
    // Generate HSL color with good contrast
    const hue = (rnd * 360 + index * 137.5) % 360;
    const saturation = 65 + (rnd * 20); // 65-85%
    const lightness = 45 + (rnd * 15); // 45-60%
    
    // Convert HSL to hex
    return this._hslToHex(hue, saturation, lightness);
  }
  
  /**
   * Convert HSL color to Hex
   * @param {number} h - Hue
   * @param {number} s - Saturation
   * @param {number} l - Lightness
   * @returns {string} Hex color
   * @private
   */
  _hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  
  /**
   * Generate a geometric pattern based on seed
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generatePattern(ctx, width, height, seed) {
    const patternType = seed % 5; // 5 different pattern types
    
    switch (patternType) {
      case 0: // Triangles
        this._generateTrianglePattern(ctx, width, height, seed);
        break;
      case 1: // Circles
        this._generateCirclePattern(ctx, width, height, seed);
        break;
      case 2: // Hexagons
        this._generateHexagonPattern(ctx, width, height, seed);
        break;
      case 3: // Lines
        this._generateLinePattern(ctx, width, height, seed);
        break;
      case 4: // Squares
        this._generateSquarePattern(ctx, width, height, seed);
        break;
    }
  }
  
  /**
   * Generate triangle pattern
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generateTrianglePattern(ctx, width, height, seed) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    const size = Math.min(width, height) / (5 + rnd(5));
    const count = 10 + Math.floor(rnd(15));
    
    for (let i = 0; i < count; i++) {
      const x = rnd(width);
      const y = rnd(height);
      const color = this._generateColor(seed, i);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size * (0.5 + rnd(1)), y + size * (0.5 + rnd(1)));
      ctx.lineTo(x - size * (0.5 + rnd(1)), y + size * (0.5 + rnd(1)));
      ctx.closePath();
      
      ctx.fillStyle = color + '80'; // Add transparency
      ctx.fill();
    }
  }
  
  /**
   * Generate circle pattern
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generateCirclePattern(ctx, width, height, seed) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    const minSize = Math.min(width, height) / 20;
    const maxSize = Math.min(width, height) / 5;
    const count = 15 + Math.floor(rnd(20));
    
    for (let i = 0; i < count; i++) {
      const x = rnd(width);
      const y = rnd(height);
      const radius = minSize + rnd(maxSize - minSize);
      const color = this._generateColor(seed, i);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + '70'; // Add transparency
      ctx.fill();
    }
  }
  
  /**
   * Generate hexagon pattern
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generateHexagonPattern(ctx, width, height, seed) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    const size = Math.min(width, height) / (8 + rnd(8));
    const count = 8 + Math.floor(rnd(12));
    
    for (let i = 0; i < count; i++) {
      const x = rnd(width);
      const y = rnd(height);
      const color = this._generateColor(seed, i);
      
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (j === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      
      ctx.fillStyle = color + '80'; // Add transparency
      ctx.fill();
    }
  }
  
  /**
   * Generate line pattern
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generateLinePattern(ctx, width, height, seed) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    const count = 10 + Math.floor(rnd(20));
    const strokeWidth = 1 + Math.floor(rnd(8));
    
    for (let i = 0; i < count; i++) {
      const x1 = rnd(width);
      const y1 = rnd(height);
      const x2 = rnd(width);
      const y2 = rnd(height);
      const color = this._generateColor(seed, i);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color + '90'; // Add transparency
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }
  
  /**
   * Generate square pattern
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @private
   */
  _generateSquarePattern(ctx, width, height, seed) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    const minSize = Math.min(width, height) / 20;
    const maxSize = Math.min(width, height) / 6;
    const count = 12 + Math.floor(rnd(16));
    
    for (let i = 0; i < count; i++) {
      const x = rnd(width);
      const y = rnd(height);
      const size = minSize + rnd(maxSize - minSize);
      const color = this._generateColor(seed, i);
      const rotation = rnd(Math.PI / 2);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = color + '80'; // Add transparency
      ctx.fillRect(-size/2, -size/2, size, size);
      ctx.restore();
    }
  }
  
  /**
   * Apply a gradient background
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} seed - Seed value
   * @param {Object} options - Gradient options
   * @private
   */
  _applyGradientBackground(ctx, width, height, seed, options = {}) {
    const rnd = (max) => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) * max;
    };
    
    // Generate gradient colors
    const color1 = options.color1 || this._generateColor(seed, 0);
    const color2 = options.color2 || this._generateColor(seed, 10);
    const color3 = options.color3 || this._generateColor(seed, 20);
    
    // Decide gradient type based on seed
    const gradientType = options.gradientType || (seed % 3); // 0: linear, 1: radial, 2: conic
    
    // Apply gradient
    let gradient;
    switch (gradientType) {
      case 0: // Linear gradient
        gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color3);
        break;
      case 1: // Radial gradient
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(width, height) / (1.5 + rnd(1));
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color3);
        break;
      case 2: // "Conic" gradient (simulated with multiple radial gradients)
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, width, height);
        
        // Add multiple radial gradients for a conic-like effect
        for (let i = 0; i < 3; i++) {
          const x = width * (0.25 + rnd(0.5));
          const y = height * (0.25 + rnd(0.5));
          const r = Math.max(width, height) * (0.4 + rnd(0.3));
          
          gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
          gradient.addColorStop(0, i === 0 ? color2 : i === 1 ? color3 : color1);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        return; // Skip the final fill since we've already filled
    }
    
    // Apply the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  /**
   * Add noise texture to the image
   * @param {Object} ctx - Canvas 2D context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} intensity - Noise intensity (0-100)
   * @private
   */
  _addNoiseTexture(ctx, width, height, intensity = 10) {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Add noise
    const factor = intensity / 100;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.round((Math.random() - 0.5) * factor * 60);
      data[i] = Math.max(0, Math.min(255, data[i] + noise)); // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
    
    // Put the image data back
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Generate a text-based NFT image
   * @param {Object} params - Generation parameters
   * @param {string} params.text - Text to use (optional)
   * @param {number} params.width - Image width (optional)
   * @param {number} params.height - Image height (optional)
   * @param {string} params.type - Asset type (optional)
   * @param {Object} params.options - Additional options (optional)
   * @returns {Promise<Buffer>} Image buffer
   */
  async generateTextBasedImage(params = {}) {
    const seed = this._generateSeed(params.text);
    const type = params.type || ASSET_TYPES.NFT;
    const { width, height } = params.width && params.height 
      ? { width: params.width, height: params.height }
      : DEFAULT_SIZES[type];
    
    const options = {
      background: 'gradient',
      pattern: true,
      noiseLevel: 5,
      textColor: '#ffffff',
      ...params.options
    };
    
    // Generate cache key
    const cacheKey = this._generateCacheKey({
      text: params.text || '',
      width,
      height,
      type,
      options
    });
    
    // Check cache
    const cachedPath = this._getCachedAsset(cacheKey);
    if (cachedPath) {
      return fs.readFileSync(cachedPath);
    }
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    if (options.background === 'gradient') {
      this._applyGradientBackground(ctx, width, height, seed);
    } else {
      ctx.fillStyle = options.background || BRAND_COLORS.primary;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Add pattern if requested
    if (options.pattern) {
      this._generatePattern(ctx, width, height, seed);
    }
    
    // Add text if provided
    if (params.text) {
      // Format text
      const lines = this._formatTextToFit(params.text, width * 0.8, FONTS.primary.family);
      
      // Calculate text position (centered)
      const lineHeight = height * 0.1;
      const totalTextHeight = lines.length * lineHeight;
      let startY = (height - totalTextHeight) / 2;
      
      // Draw each line
      ctx.fillStyle = options.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      lines.forEach((line, index) => {
        // Calculate font size based on line length
        const fontSize = Math.min(
          width * 0.05, 
          height * 0.08, 
          width * 0.8 / (ctx.measureText(line).width / 20)
        );
        
        ctx.font = `${fontSize}px ${FONTS.primary.family}, ${FONTS.primary.fallback}`;
        ctx.fillText(line, width / 2, startY + lineHeight * index + lineHeight / 2);
      });
      
      // Add a subtle watermark/identifier
      const watermark = `STREAM #${seed % 10000}`;
      ctx.font = `${Math.max(12, height * 0.02)}px ${FONTS.monospace.family}, ${FONTS.monospace.fallback}`;
      ctx.fillStyle = options.textColor + '80'; // Semi-transparent
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermark, width - 10, height - 10);
    }
    
    // Add noise texture for grain effect
    if (options.noiseLevel > 0) {
      this._addNoiseTexture(ctx, width, height, options.noiseLevel);
    }
    
    // Get image buffer
    const imageBuffer = canvas.toBuffer('image/png');
    
    // Save to cache
    await this._saveToCache(cacheKey, imageBuffer);
    
    return imageBuffer;
  }
  
  /**
   * Format text to fit within a width
   * @param {string} text - Input text
   * @param {number} maxWidth - Maximum width
   * @param {string} fontFamily - Font family
   * @returns {Array<string>} Lines of text
   * @private
   */
  _formatTextToFit(text, maxWidth, fontFamily) {
    // Create temporary canvas for text measurement
    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    ctx.font = `20px ${fontFamily}`;
    
    // Split into words
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    
    // Add words to lines
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    // Add the last line
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * Generate content thumbnail from existing image
   * @param {Buffer|string} inputImage - Image buffer or file path
   * @param {Object} params - Thumbnail parameters
   * @returns {Promise<Buffer>} Thumbnail buffer
   */
  async generateThumbnail(inputImage, params = {}) {
    const options = {
      width: params.width || DEFAULT_SIZES[ASSET_TYPES.THUMBNAIL].width,
      height: params.height || DEFAULT_SIZES[ASSET_TYPES.THUMBNAIL].height,
      fit: params.fit || 'cover',
      position: params.position || 'center',
      background: params.background || { r: 0, g: 0, b: 0, alpha: 1 },
      ...params
    };
    
    try {
      // Handle input image (buffer or path)
      const imageData = typeof inputImage === 'string' 
        ? fs.readFileSync(inputImage) 
        : inputImage;
      
      // Process with sharp
      const processedImage = await sharp(imageData)
        .resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
          position: options.position,
          background: options.background
        })
        .toFormat('png')
        .toBuffer();
      
      return processedImage;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      
      // Fall back to a text-based image if the image processing fails
      const fallbackText = params.fallbackText || 'Image Unavailable';
      return this.generateTextBasedImage({
        text: fallbackText,
        width: options.width,
        height: options.height,
        type: ASSET_TYPES.THUMBNAIL,
        options: {
          background: 'gradient',
          pattern: true,
          textColor: '#ffffff'
        }
      });
    }
  }
  
  /**
   * Generate a preview image for content
   * @param {Buffer|string} inputImage - Image buffer or file path, or null for text-based
   * @param {Object} params - Preview parameters
   * @returns {Promise<Buffer>} Preview image buffer
   */
  async generatePreview(inputImage, params = {}) {
    // If no input image, generate a text-based preview
    if (!inputImage) {
      return this.generateTextBasedImage({
        text: params.text || 'Content Preview',
        width: params.width || DEFAULT_SIZES[ASSET_TYPES.PREVIEW].width,
        height: params.height || DEFAULT_SIZES[ASSET_TYPES.PREVIEW].height,
        type: ASSET_TYPES.PREVIEW,
        options: {
          background: 'gradient',
          pattern: true,
          textColor: '#ffffff',
          ...params.options
        }
      });
    }
    
    // Use similar approach to thumbnail, but with preview dimensions
    const options = {
      width: params.width || DEFAULT_SIZES[ASSET_TYPES.PREVIEW].width,
      height: params.height || DEFAULT_SIZES[ASSET_TYPES.PREVIEW].height,
      fit: params.fit || 'cover',
      position: params.position || 'center',
      background: params.background || { r: 0, g: 0, b: 0, alpha: 1 },
      ...params
    };
    
    try {
      // Handle input image (buffer or path)
      const imageData = typeof inputImage === 'string' 
        ? fs.readFileSync(inputImage) 
        : inputImage;
      
      // Process with sharp
      const processedImage = await sharp(imageData)
        .resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
          position: options.position,
          background: options.background
        })
        .toFormat('png')
        .toBuffer();
      
      return processedImage;
    } catch (error) {
      console.error('Error generating preview:', error);
      
      // Fall back to a text-based image
      return this.generateTextBasedImage({
        text: params.text || 'Preview Unavailable',
        width: options.width,
        height: options.height,
        type: ASSET_TYPES.PREVIEW
      });
    }
  }
  
  /**
   * Generate profile image, with optional circular crop
   * @param {Buffer|string} inputImage - Image buffer or file path, or null for generated
   * @param {Object} params - Profile image parameters
   * @returns {Promise<Buffer>} Profile image buffer
   */
  async generateProfileImage(inputImage, params = {}) {
    const size = params.size || DEFAULT_SIZES[ASSET_TYPES.PROFILE].width;
    const isCircular = params.circular !== false; // Default to circular
    
    // If no input image, generate a text-based profile
    if (!inputImage) {
      // Create a seed from username or text if provided
      const seed = this._generateSeed(params.text || params.username || '');
      
      // Generate avatar
      return this.generateTextBasedImage({
        text: params.text || (params.username ? params.username.substring(0, 2).toUpperCase() : ''),
        width: size,
        height: size,
        type: ASSET_TYPES.PROFILE,
        options: {
          background: 'gradient',
          pattern: false,
          textColor: '#ffffff',
          ...params.options
        }
      });
    }
    
    try {
      // Handle input image (buffer or path)
      const imageData = typeof inputImage === 'string' 
        ? fs.readFileSync(inputImage) 
        : inputImage;
      
      // Process with sharp
      let processedImage = sharp(imageData)
        .resize({
          width: size,
          height: size,
          fit: 'cover',
          position: 'center'
        });
      
      // Create circular mask if requested
      if (isCircular) {
        // Create a circular mask
        const circleBuffer = await this._createCircularMask(size);
        
        processedImage = processedImage.composite([
          {
            input: circleBuffer,
            blend: 'dest-in'
          }
        ]);
      }
      
      return processedImage.toFormat('png').toBuffer();
    } catch (error) {
      console.error('Error generating profile image:', error);
      
      // Fall back to generated profile
      return this.generateProfileImage(null, params);
    }
  }
  
  /**
   * Create a circular mask for profile images
   * @param {number} size - Mask size
   * @returns {Promise<Buffer>} Mask buffer
   * @private
   */
  async _createCircularMask(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw circle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toBuffer('image/png');
  }
  
  /**
   * Generate a banner image
   * @param {Buffer|string} inputImage - Image buffer or file path, or null for generated
   * @param {Object} params - Banner parameters
   * @returns {Promise<Buffer>} Banner image buffer
   */
  async generateBanner(inputImage, params = {}) {
    const width = params.width || DEFAULT_SIZES[ASSET_TYPES.BANNER].width;
    const height = params.height || DEFAULT_SIZES[ASSET_TYPES.BANNER].height;
    
    // If no input image, generate a text-based banner
    if (!inputImage) {
      return this.generateTextBasedImage({
        text: params.text || '',
        width,
        height,
        type: ASSET_TYPES.BANNER,
        options: {
          background: 'gradient',
          pattern: true,
          textColor: '#ffffff',
          ...params.options
        }
      });
    }
    
    try {
      // Handle input image (buffer or path)
      const imageData = typeof inputImage === 'string' 
        ? fs.readFileSync(inputImage) 
        : inputImage;
      
      // Process with sharp
      const processedImage = await sharp(imageData)
        .resize({
          width,
          height,
          fit: 'cover',
          position: params.position || 'center'
        })
        .toFormat('png')
        .toBuffer();
      
      return processedImage;
    } catch (error) {
      console.error('Error generating banner:', error);
      
      // Fall back to generated banner
      return this.generateBanner(null, params);
    }
  }
  
  /**
   * Generate placeholder image for missing content
   * @param {Object} params - Placeholder parameters
   * @returns {Promise<Buffer>} Placeholder image buffer
   */
  async generatePlaceholder(params = {}) {
    const width = params.width || DEFAULT_SIZES[ASSET_TYPES.PLACEHOLDER].width;
    const height = params.height || DEFAULT_SIZES[ASSET_TYPES.PLACEHOLDER].height;
    const text = params.text || 'Content Unavailable';
    
    return this.generateTextBasedImage({
      text,
      width,
      height,
      type: ASSET_TYPES.PLACEHOLDER,
      options: {
        background: params.background || BRAND_COLORS.primary,
        pattern: params.pattern !== false,
        textColor: params.textColor || '#ffffff',
        ...params.options
      }
    });
  }
  
  /**
   * Upload an asset to IPFS
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} metadata - Asset metadata
   * @returns {Promise<Object>} IPFS result with CID
   */
  async uploadToIPFS(imageBuffer, metadata = {}) {
    if (!this.config.ipfsEnabled) {
      throw new Error('IPFS functionality is disabled');
    }
    
    try {
      // Create temp file
      const tempFilePath = path.join(
        os.tmpdir(),
        `asset_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`
      );
      
      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, imageBuffer);
      
      // Upload to IPFS
      const result = await IPFSService.addFile(tempFilePath, {
        ...metadata,
        assetType: metadata.assetType || 'image',
        mimeType: 'image/png'
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return result;
    } catch (error) {
      console.error('Error uploading asset to IPFS:', error);
      throw error;
    }
  }
  
  /**
   * Save asset to static directory
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filename - Filename
   * @param {string} subdir - Subdirectory (optional)
   * @returns {Promise<string>} Saved file path
   */
  async saveToStatic(imageBuffer, filename, subdir = '') {
    try {
      // Ensure directory exists
      const targetDir = subdir 
        ? path.join(this.config.staticDir, subdir)
        : this.config.staticDir;
      
      this._ensureDirectoryExists(targetDir);
      
      // Ensure filename has extension
      const filenameFinal = filename.endsWith('.png') ? filename : `${filename}.png`;
      
      // Save file
      const filePath = path.join(targetDir, filenameFinal);
      fs.writeFileSync(filePath, imageBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving asset to static directory:', error);
      throw error;
    }
  }
}

// Export the service
module.exports = new AssetGeneratorService();