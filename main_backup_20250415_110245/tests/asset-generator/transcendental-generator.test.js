/**
 * Transcendental Asset Generator Tests
 * Tests the generation, rendering, and caching of digital transcendental assets
 */

const { expect } = require('chai');
const fs = require('fs').promises;
const path = require('path');
const { TranscendentalGenerator } = require('../../lib/asset-generator/transcendental-generator');
const { AssetCache } = require('../../lib/asset-generator/asset-cache');

// Test constants
const TEST_DATA_PATH = path.join(__dirname, 'test-files.json');
const CACHE_DIR = path.join(__dirname, '../../temp/asset-cache');
const OUTPUT_DIR = path.join(__dirname, '../../temp/generated-assets');

describe('Transcendental Asset Generator', () => {
  let generator;
  let testData;
  let assetCache;

  before(async () => {
    // Load test data
    const testDataRaw = await fs.readFile(TEST_DATA_PATH, 'utf8');
    testData = JSON.parse(testDataRaw);

    // Make sure output directories exist
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Initialize cache and generator
    assetCache = new AssetCache({
      cachePath: CACHE_DIR,
      ttl: testData.cacheControl.ttl,
      persistAcrossVersions: testData.cacheControl.persistAcrossVersions
    });

    generator = new TranscendentalGenerator({
      cache: assetCache,
      seed: testData.generationParameters.seed,
      algorithm: testData.generationParameters.algorithm,
      modelVersion: testData.generationParameters.modelVersion,
      outputDir: OUTPUT_DIR
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct parameters', () => {
      expect(generator).to.be.an('object');
      expect(generator.seed).to.equal(testData.generationParameters.seed);
      expect(generator.algorithm).to.equal(testData.generationParameters.algorithm);
      expect(generator.modelVersion).to.equal(testData.generationParameters.modelVersion);
    });

    it('should have access to test assets', () => {
      expect(testData.assets).to.be.an('object');
      expect(testData.assets.exotic).to.be.an('array');
      expect(testData.assets.mythic).to.be.an('array');
      expect(testData.assets.legendary).to.be.an('array');
      expect(testData.assets.ultraRare).to.be.an('array');
    });
  });

  describe('Asset Generation', () => {
    it('should generate exotic assets', async () => {
      const exoticAsset = testData.assets.exotic[0];
      const result = await generator.generateAsset({
        name: exoticAsset.name,
        rarity: exoticAsset.rarity,
        attributes: exoticAsset.attributes
      });

      expect(result).to.be.an('object');
      expect(result.assetPath).to.be.a('string');
      expect(result.assetId).to.include('exotic');
      expect(result.success).to.be.true;
    });

    it('should generate mythic assets', async () => {
      const mythicAsset = testData.assets.mythic[0];
      const result = await generator.generateAsset({
        name: mythicAsset.name,
        rarity: mythicAsset.rarity,
        attributes: mythicAsset.attributes
      });

      expect(result).to.be.an('object');
      expect(result.assetPath).to.be.a('string');
      expect(result.assetId).to.include('mythic');
      expect(result.success).to.be.true;
    });

    it('should generate legendary assets', async () => {
      const legendaryAsset = testData.assets.legendary[0];
      const result = await generator.generateAsset({
        name: legendaryAsset.name,
        rarity: legendaryAsset.rarity,
        attributes: legendaryAsset.attributes
      });

      expect(result).to.be.an('object');
      expect(result.assetPath).to.be.a('string');
      expect(result.assetId).to.include('legendary');
      expect(result.success).to.be.true;
    });

    it('should generate ultra-rare assets', async () => {
      const ultraRareAsset = testData.assets.ultraRare[0];
      const result = await generator.generateAsset({
        name: ultraRareAsset.name,
        rarity: ultraRareAsset.rarity,
        attributes: ultraRareAsset.attributes
      });

      expect(result).to.be.an('object');
      expect(result.assetPath).to.be.a('string');
      expect(result.assetId).to.include('ultraRare');
      expect(result.success).to.be.true;
      expect(result.generationTime).to.be.above(0);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache generated assets', async () => {
      // Generate an asset
      const exoticAsset = testData.assets.exotic[1];
      const result = await generator.generateAsset({
        name: exoticAsset.name,
        rarity: exoticAsset.rarity,
        attributes: exoticAsset.attributes
      });

      // Check if it's in cache
      const cachedAsset = await assetCache.get(result.assetId);
      expect(cachedAsset).to.not.be.null;
      expect(cachedAsset.path).to.equal(result.assetPath);
    });

    it('should retrieve assets from cache when available', async () => {
      // Generate asset first time
      const mythicAsset = testData.assets.mythic[1];
      const firstGeneration = await generator.generateAsset({
        name: mythicAsset.name,
        rarity: mythicAsset.rarity,
        attributes: mythicAsset.attributes,
        forceRegenerate: false
      });

      // Generate same asset second time - should use cache
      const startTime = Date.now();
      const secondGeneration = await generator.generateAsset({
        name: mythicAsset.name,
        rarity: mythicAsset.rarity,
        attributes: mythicAsset.attributes,
        forceRegenerate: false
      });
      const endTime = Date.now();

      expect(secondGeneration.assetId).to.equal(firstGeneration.assetId);
      expect(secondGeneration.fromCache).to.be.true;
      expect(endTime - startTime).to.be.below(50); // Should be fast with cache
    });

    it('should force regenerate when requested', async () => {
      // Generate asset first time
      const legendaryAsset = testData.assets.legendary[1];
      const firstGeneration = await generator.generateAsset({
        name: legendaryAsset.name,
        rarity: legendaryAsset.rarity,
        attributes: legendaryAsset.attributes
      });

      // Force regenerate
      const secondGeneration = await generator.generateAsset({
        name: legendaryAsset.name,
        rarity: legendaryAsset.rarity,
        attributes: legendaryAsset.attributes,
        forceRegenerate: true
      });

      expect(secondGeneration.fromCache).to.be.false;
      expect(secondGeneration.generationTime).to.be.above(0);
    });
  });

  describe('Environment Rendering Tests', () => {
    it('should render correctly in standard environment', async () => {
      const environment = testData.testEnvironments[0]; // standard env
      const asset = testData.assets.mythic[0];

      const renderResult = await generator.renderAssetInEnvironment(
        asset.id,
        environment.name
      );

      expect(renderResult.success).to.be.true;
      expect(renderResult.frameRate).to.be.at.least(environment.frameRate * 0.9); // Allow 10% tolerance
      expect(renderResult.resolution).to.equal(environment.resolution);
    });

    it('should adapt rendering for low-end environment', async () => {
      const environment = testData.testEnvironments[1]; // low_end env
      const asset = testData.assets.legendary[0];

      const renderResult = await generator.renderAssetInEnvironment(
        asset.id,
        environment.name
      );

      expect(renderResult.success).to.be.true;
      expect(renderResult.optimizationApplied).to.be.true;
      expect(renderResult.qualityReduction).to.be.above(0);
    });
  });

  describe('Unique Ultra-Rare Properties', () => {
    it('should generate unique properties for ultra-rare assets', async () => {
      const ultraRare1 = await generator.generateAsset({
        name: "Unique Ultra Rare 1",
        rarity: "ultraRare"
      });

      const ultraRare2 = await generator.generateAsset({
        name: "Unique Ultra Rare 2",
        rarity: "ultraRare"
      });

      expect(ultraRare1.uniqueProperties).to.be.an('object');
      expect(ultraRare2.uniqueProperties).to.be.an('object');
      expect(ultraRare1.uniqueProperties).to.not.deep.equal(ultraRare2.uniqueProperties);
    });
  });

  after(async () => {
    // Clean up temporary files (optional)
    // await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  });
});
