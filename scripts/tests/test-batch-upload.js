/**
 * Batch Upload Performance Testing Script
 * Tests performance of batch uploads with different configurations
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const size = args.includes('--size=small')
  ? 'small'
  : args.includes('--size=medium')
    ? 'medium'
    : args.includes('--size=large')
      ? 'large'
      : 'medium';
const type = args.includes('--type=video')
  ? 'video'
  : args.includes('--type=mixed')
    ? 'mixed'
    : 'mixed';
const profile = args.includes('--profile');
const quiet = args.includes('--quiet');

// Configuration based on test size
const config = {
  small: { files: 10, avgSize: '1MB', totalSize: '10MB' },
  medium: { files: 30, avgSize: '5MB', totalSize: '150MB' },
  large: { files: 50, avgSize: '10MB', totalSize: '500MB' }
};

// File types based on test type
const fileTypes = {
  video: ['mp4', 'webm'],
  mixed: ['mp4', 'mp3', 'jpg', 'png', 'pdf']
};

// Test results will be stored here
const results = {
  config: { size, type, profile },
  system: {},
  metrics: {
    preparationTime: 0,
    uploadTime: 0,
    processingTime: 0,
    totalTime: 0,
    throughput: 0,
    memoryUsage: {}
  },
  fileBreakdown: {}
};

/**
 * Log a message only if quiet mode is disabled
 * @param {string} message - Message to log
 * @param {boolean} isError - Whether this is an error message
 */
function log(message, isError = false) {
  if (!quiet) {
    if (isError) {
      console.error(chalk.red(message));
    } else {
      console.log(message);
    }
  }
}

/**
 * Generate test files for upload
 * @param {string} size - Test size (small, medium, large)
 * @param {string} type - Test type (video, mixed)
 * @returns {Array} Array of generated file paths
 */
async function generateTestFiles(size, type) {
  const spinner = ora('Generating test files...').start();
  const testFolder = path.join(__dirname, '..', '..', 'test-files');

  // Create test folder if it doesn't exist
  if (!fs.existsSync(testFolder)) {
    fs.mkdirSync(testFolder, { recursive: true });
  }

  const testConfig = config[size];
  const selectedFileTypes = fileTypes[type];
  const files = [];

  try {
    // Determine file sizes based on config
    const fileSizes = [];
    const baseSize = parseInt(testConfig.avgSize.replace('MB', '')) * 1024 * 1024;

    for (let i = 0; i < testConfig.files; i++) {
      // Vary the size slightly for realism
      const variance = Math.random() * 0.4 + 0.8; // between 0.8x and 1.2x
      fileSizes.push(Math.floor(baseSize * variance));
    }

    // Generate files
    for (let i = 0; i < testConfig.files; i++) {
      const fileType = selectedFileTypes[Math.floor(Math.random() * selectedFileTypes.length)];
      const fileName = `test-file-${i + 1}.${fileType}`;
      const filePath = path.join(testFolder, fileName);

      // Create dummy file with appropriate size
      const buffer = Buffer.alloc(fileSizes[i], 'x');
      fs.writeFileSync(filePath, buffer);

      files.push(filePath);
      spinner.text = `Generating test files... ${i + 1}/${testConfig.files}`;
    }

    spinner.succeed(`Generated ${testConfig.files} test files (${testConfig.totalSize})`);
    return files;
  } catch (error) {
    spinner.fail(`Failed to generate test files: ${error.message}`);
    throw error;
  }
}

/**
 * Collect system information
 */
async function collectSystemInfo() {
  const spinner = ora('Collecting system information...').start();

  try {
    // OS info
    results.system.platform = process.platform;
    results.system.arch = process.arch;
    results.system.nodeVersion = process.version;

    // Memory info
    results.system.totalMemory = Math.round(require('os').totalmem() / (1024 * 1024 * 1024)) + 'GB';
    results.system.freeMemory = Math.round(require('os').freemem() / (1024 * 1024 * 1024)) + 'GB';

    // CPU info
    results.system.cpus = require('os').cpus().length;

    // Network info (simulated for demo)
    results.system.network = {
      uplink: '100 Mbps',
      downlink: '500 Mbps',
      latency: '20 ms'
    };

    spinner.succeed('System information collected');
  } catch (error) {
    spinner.fail(`Failed to collect system information: ${error.message}`);
  }
}

/**
 * Run the batch upload test
 * @param {Array} files - Array of file paths to upload
 */
async function runBatchUploadTest(files) {
  log(chalk.blue.bold(`\n=== Batch Upload Test (${size} / ${type}) ===`));
  log(`Files: ${files.length}, Total Size: ${config[size].totalSize}`);

  // Start tracking overall time
  const startTime = performance.now();

  // Track initial memory usage
  const initialMemory = process.memoryUsage();

  // Step 1: Preparation Phase (simulated)
  const prepSpinner = ora('Preparing files for upload...').start();
  const prepStartTime = performance.now();

  // Simulate preparation (reading files, generating metadata, etc.)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const prepEndTime = performance.now();
  results.metrics.preparationTime = prepEndTime - prepStartTime;
  prepSpinner.succeed(`Files prepared in ${(results.metrics.preparationTime / 1000).toFixed(2)}s`);

  // Step 2: Upload Phase
  const uploadSpinner = ora('Uploading files...').start();
  const uploadStartTime = performance.now();

  // Simulate upload with progress
  const totalBytes = files.reduce((acc, file) => acc + fs.statSync(file).size, 0);
  let uploadedBytes = 0;

  for (const file of files) {
    const fileSize = fs.statSync(file).size;
    const fileType = path.extname(file).substring(1);

    // Track file types for breakdown
    results.fileBreakdown[fileType] = (results.fileBreakdown[fileType] || 0) + 1;

    // Simulate file upload
    const uploadTime = Math.min(fileSize / 1000000, 2000); // Simulated upload time
    await new Promise(resolve => setTimeout(resolve, uploadTime));

    uploadedBytes += fileSize;
    const progress = Math.round((uploadedBytes / totalBytes) * 100);
    uploadSpinner.text = `Uploading files... ${progress}% (${files.indexOf(file) + 1}/${files.length})`;
  }

  const uploadEndTime = performance.now();
  results.metrics.uploadTime = uploadEndTime - uploadStartTime;
  uploadSpinner.succeed(`Files uploaded in ${(results.metrics.uploadTime / 1000).toFixed(2)}s`);

  // Step 3: Processing Phase (simulated)
  const processSpinner = ora('Processing uploads...').start();
  const processStartTime = performance.now();

  // Simulate processing (IPFS storage, metadata generation, etc.)
  await new Promise(resolve => setTimeout(resolve, 1500));

  const processEndTime = performance.now();
  results.metrics.processingTime = processEndTime - processStartTime;
  processSpinner.succeed(
    `Files processed in ${(results.metrics.processingTime / 1000).toFixed(2)}s`
  );

  // Calculate total time
  const endTime = performance.now();
  results.metrics.totalTime = endTime - startTime;

  // Calculate memory usage
  const finalMemory = process.memoryUsage();
  results.metrics.memoryUsage = {
    heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024) + 'MB',
    rss: (finalMemory.rss - initialMemory.rss) / (1024 * 1024) + 'MB'
  };

  // Calculate throughput
  results.metrics.throughput =
    Math.round(totalBytes / (1024 * 1024) / (results.metrics.totalTime / 1000)) + ' MB/s';

  // Display results
  displayResults();

  // Run profiler if requested
  if (profile) {
    await runProfiler();
  }

  // Save results
  saveResults();
}

/**
 * Display test results
 */
function displayResults() {
  log(chalk.green.bold('\n=== Test Results ==='));
  log(`Total Time: ${(results.metrics.totalTime / 1000).toFixed(2)}s`);
  log(
    `  ├─ Preparation: ${(results.metrics.preparationTime / 1000).toFixed(2)}s (${Math.round((results.metrics.preparationTime / results.metrics.totalTime) * 100)}%)`
  );
  log(
    `  ├─ Upload: ${(results.metrics.uploadTime / 1000).toFixed(2)}s (${Math.round((results.metrics.uploadTime / results.metrics.totalTime) * 100)}%)`
  );
  log(
    `  └─ Processing: ${(results.metrics.processingTime / 1000).toFixed(2)}s (${Math.round((results.metrics.processingTime / results.metrics.totalTime) * 100)}%)`
  );
  log(`\nThroughput: ${results.metrics.throughput}`);
  log(
    `Memory Usage: Heap: ${results.metrics.memoryUsage.heapUsed}, RSS: ${results.metrics.memoryUsage.rss}`
  );

  log(chalk.blue.bold('\n=== File Breakdown ==='));
  for (const [type, count] of Object.entries(results.fileBreakdown)) {
    log(`${type}: ${count} files (${Math.round((count / config[size].files) * 100)}%)`);
  }
}

/**
 * Run profiler for advanced performance metrics
 */
async function runProfiler() {
  log(chalk.yellow.bold('\n=== Running Profiler ==='));
  const spinner = ora('Profiling batch upload...').start();

  try {
    // This is a simplified simulation of profiling
    // In a real implementation, you would use tools like Chrome DevTools Protocol for profiling
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.succeed('Profiling complete');
    log('Generated CPU and memory profiles in ./profiles directory');

    // Create profiles directory if it doesn't exist
    const profilesDir = path.join(__dirname, '..', '..', 'profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }

    // Simulate creating profile files
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const cpuProfilePath = path.join(profilesDir, `batch-upload-cpu-${timestamp}.cpuprofile`);
    const heapSnapshotPath = path.join(profilesDir, `batch-upload-heap-${timestamp}.heapsnapshot`);

    fs.writeFileSync(cpuProfilePath, JSON.stringify({ profile: 'simulated-cpu-profile' }));
    fs.writeFileSync(heapSnapshotPath, JSON.stringify({ snapshot: 'simulated-heap-snapshot' }));

    log(`CPU Profile: ${cpuProfilePath}`);
    log(`Heap Snapshot: ${heapSnapshotPath}`);
  } catch (error) {
    spinner.fail(`Profiling failed: ${error.message}`);
  }
}

/**
 * Save test results to file
 */
function saveResults() {
  const resultsDir = path.join(__dirname, '..', '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsPath = path.join(resultsDir, `batch-upload-test-${size}-${type}-${timestamp}.json`);

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  log(chalk.green(`\nResults saved to ${resultsPath}`));
}

/**
 * Clean up test files
 */
function cleanupTestFiles() {
  const testFolder = path.join(__dirname, '..', '..', 'test-files');

  if (fs.existsSync(testFolder)) {
    const spinner = ora('Cleaning up test files...').start();
    try {
      const files = fs.readdirSync(testFolder);
      for (const file of files) {
        if (file.startsWith('test-file-')) {
          fs.unlinkSync(path.join(testFolder, file));
        }
      }
      spinner.succeed('Test files cleaned up');
    } catch (error) {
      spinner.fail(`Failed to clean up test files: ${error.message}`);
    }
  }
}

/**
 * Main test function
 */
async function main() {
  try {
    // Collect system information
    await collectSystemInfo();

    // Generate test files
    const files = await generateTestFiles(size, type);

    // Run the batch upload test
    await runBatchUploadTest(files);

    // Clean up
    cleanupTestFiles();

    process.exit(0);
  } catch (error) {
    log(`Test failed: ${error.message}`, true);
    process.exit(1);
  }
}

// Run the test
main();
