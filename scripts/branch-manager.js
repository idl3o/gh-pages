/**
 * Branch Manager - Tool for managing and consolidating branches
 *
 * This script helps with:
 * - Listing all branches and their status
 * - Merging specific branches into main
 * - Cleaning up old branches after consolidation
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const config = {
  mainBranch: 'main',
  protectedBranches: ['main', 'gh-pages']
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute a command and return the result
 */
function exec(command) {
  try {
    return execSync(command).toString().trim();
  } catch (_error) {
    console.error(`Error executing command: ${command}`);
    console.error(_error.message);
    return null;
  }
}

/**
 * List all branches with their status
 */
function listBranches() {
  console.log('\n📋 Branch Status:');

  // Get current branch
  const currentBranch = exec('git branch --show-current');
  console.log(`Current branch: ${currentBranch}`);

  // Get all branches
  const branches = exec('git branch -a')
    .split('\n')
    .map(b => b.trim().replace(/^\*\s+/, ''));

  // Get branches that are already merged to main
  const mergedBranches = exec(`git branch --merged ${config.mainBranch}`)
    .split('\n')
    .map(b => b.trim().replace(/^\*\s+/, ''));

  // Display branch status
  branches.forEach(branch => {
    if (branch && !branch.includes('remotes/')) {
      const isMerged = mergedBranches.includes(branch);
      const isProtected = config.protectedBranches.includes(branch);
      const status = isMerged ? '✅ Merged' : '❌ Not merged';
      const protection = isProtected ? ' (Protected)' : '';

      console.log(`${branch}: ${status}${protection}`);
    }
  });
}

/**
 * Merge specified branches into main
 */
function mergeBranches(branches) {
  if (!branches || branches.length === 0) return;

  console.log(`\n🔄 Merging branches into ${config.mainBranch}...`);

  // Switch to main branch
  exec(`git checkout ${config.mainBranch}`);

  // Merge each branch
  branches.forEach(branch => {
    if (config.protectedBranches.includes(branch)) {
      console.log(`Skipping protected branch: ${branch}`);
      return;
    }

    console.log(`Merging ${branch}...`);
    try {
      exec(`git merge --no-ff ${branch} -m "Merge branch '${branch}' into ${config.mainBranch}"`);
      console.log(`✅ Successfully merged ${branch}`);
    } catch (_error) {
      console.error(`❌ Failed to merge ${branch}`);
      exec('git merge --abort');
    }
  });
}

/**
 * Clean up merged branches
 */
function cleanupBranches() {
  console.log('\n🧹 Cleaning up merged branches...');

  // Get merged branches
  const mergedBranches = exec(`git branch --merged ${config.mainBranch}`)
    .split('\n')
    .map(b => b.trim().replace(/^\*\s+/, ''))
    .filter(b => b && !config.protectedBranches.includes(b));

  if (mergedBranches.length === 0) {
    console.log('No merged branches to clean up.');
    return;
  }

  console.log('The following merged branches will be deleted:');
  mergedBranches.forEach(branch => console.log(` - ${branch}`));

  rl.question('Proceed with deletion? (y/N) ', answer => {
    if (answer.toLowerCase() === 'y') {
      mergedBranches.forEach(branch => {
        exec(`git branch -d ${branch}`);
        console.log(`Deleted branch: ${branch}`);
      });
    } else {
      console.log('Branch cleanup cancelled.');
    }
    rl.close();
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      listBranches();
      break;
    case 'merge': {
      const branchesToMerge = args.slice(1);
      mergeBranches(branchesToMerge);
      break;
    }
    case 'cleanup':
      cleanupBranches();
      break;
    default:
      console.log(`
Branch Manager - Management tool for consolidating branches

Commands:
  status              Display status of all branches
  merge <branches>    Merge specified branches into main
  cleanup             Delete branches that are already merged

Example:
  node branch-manager.js merge feature-1 feature-2
`);
      break;
  }
}

// Run main function unless in cleanup mode (which has its own rl.close())
if (process.argv[2] !== 'cleanup') {
  main();
  rl.close();
}
