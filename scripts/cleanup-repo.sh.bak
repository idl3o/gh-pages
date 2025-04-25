#!/bin/bash

# Repository Cleanup Script
# This script cleans up duplicate files and resolves configuration conflicts in the repository

echo "=========================================="
echo "    Web3 Crypto Streaming Service"
echo "    Repository Cleanup Script"
echo "=========================================="

# Navigate to repository root
cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

echo "Repository root: $ROOT_DIR"
echo

# Step 1: Remove duplicate files
echo "Step 1: Removing duplicate files..."
echo "----------------------------"

# Array of duplicate files to remove
duplicate_files=(
  "docs/tech.token 2.md"
  "docs/tech.solidity-review 2.md"
  "docs/tech.contract-list 2.md"
  "web3-streaming-service-whitepaper.md"  # Keep only the one in whitepaper/
)

for file in "${duplicate_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing duplicate: $file"
    rm "$file"
  else
    echo "File not found: $file"
  fi
done

echo "Done removing duplicate files."
echo

# Step 2: Fix configuration approach
echo "Step 2: Addressing Jekyll vs .nojekyll conflict..."
echo "----------------------------"

# Check if .nojekyll exists in the root
if [ -f ".nojekyll" ]; then
  echo "Found .nojekyll file - indicating direct HTML/CSS approach."
  echo "Keeping .nojekyll and adjusting configuration accordingly."

  # Rename _config.yml to jekyll-config.yml for reference
  if [ -f "_config.yml" ]; then
    echo "Renaming _config.yml to jekyll-config.yml (for reference only)"
    mv _config.yml jekyll-config.yml
  fi

  echo "Creating a note about the configuration approach"
  cat > DEPLOYMENT_NOTE.md << EOL
# Deployment Configuration Note

This repository uses the **direct HTML/CSS approach** (not Jekyll processing) for GitHub Pages deployment.

## Important Files:

- \`.nojekyll\` - Tells GitHub Pages not to process the site with Jekyll
- \`index.html\` - The main entry point for the site
- \`deploy-gh-pages.sh\` - Contains deployment logic

## For Local Testing:

Use the Python HTTP server approach from test-local.sh:

\`\`\`bash
python3 -m http.server
\`\`\`

If you want to switch to Jekyll processing:
1. Remove the .nojekyll file
2. Rename jekyll-config.yml back to _config.yml
3. Update the GitHub Actions workflow accordingly
EOL

else
  echo ".nojekyll file not found. Using Jekyll processing approach."
  echo "Creating .gitignore for Jekyll"

  # Create appropriate .gitignore for Jekyll
  cat > .gitignore << EOL
# Jekyll specific files
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
.bundle/
vendor/

# Ruby environment
.ruby-version
Gemfile.lock

# Editor files
*.swp
*~
.DS_Store
.idea/
.vscode/

# Java build artifacts
java/serverless-function/target/
*.class
*.jar

# Node.js
node_modules/
npm-debug.log
yarn-error.log

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg

# Local configuration
.env
*.log
EOL

fi

echo "Done addressing configuration approach."
echo

# Step 3: Create missing files
echo "Step 3: Creating missing referenced files..."
echo "----------------------------"

# Create missing streaming-token.html if it doesn't exist
docs_contracts_dir="docs/contracts"
if [ ! -d "$docs_contracts_dir" ]; then
  echo "Creating directory: $docs_contracts_dir"
  mkdir -p "$docs_contracts_dir"
fi

streaming_token_html="$docs_contracts_dir/streaming-token.html"
if [ ! -f "$streaming_token_html" ]; then
  echo "Creating missing file: $streaming_token_html"
  cat > "$streaming_token_html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamingToken Contract | Web3 Crypto Streaming Service</title>
  <link rel="stylesheet" href="../../assets/css/styles.css">
</head>
<body>
  <header>
    <h1>StreamingToken Contract</h1>
    <p>ERC20 token implementation with streaming-specific functionality</p>
  </header>

  <main>
    <section>
      <h2>Contract Overview</h2>
      <p>The StreamingToken contract is an ERC20-compliant token that powers the Web3 Crypto Streaming Service platform.</p>

      <h3>Key Features</h3>
      <ul>
        <li>Standard ERC20 functionality for transfers and allowances</li>
        <li>Direct ETH to token conversion via purchaseCredits()</li>
        <li>Content streaming authorization system</li>
        <li>Time-based access control for premium content</li>
      </ul>
    </section>

    <section>
      <h2>Contract Interface</h2>
      <pre><code>// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StreamingToken
 * @dev ERC20 Token with streaming platform functionality
 */
contract StreamingToken is ERC20, Ownable {
    uint256 public constant CREDITS_PER_ETH = 100;
    mapping(address => mapping(string => uint256)) public streamExpiry;

    constructor() ERC20("Streaming Credits", "STRM") {}

    /**
     * @dev Purchase streaming credits with ETH
     */
    function purchaseCredits() public payable {
        uint256 credits = msg.value * CREDITS_PER_ETH;
        _mint(msg.sender, credits);
    }

    /**
     * @dev Start streaming content by burning a token
     * @param contentId unique identifier for the content
     */
    function startStream(string memory contentId) public {
        require(balanceOf(msg.sender) >= 1, "Insufficient credits");
        _burn(msg.sender, 1);
        streamExpiry[msg.sender][contentId] = block.timestamp + 1 hours;
    }

    /**
     * @dev Check if a user can stream specific content
     * @param user address of the user
     * @param contentId unique identifier for the content
     * @return bool whether the user can stream the content
     */
    function canStream(address user, string memory contentId) public view returns (bool) {
        return streamExpiry[user][contentId] > block.timestamp;
    }
}</code></pre>
    </section>

    <section>
      <h2>Usage Examples</h2>
      <h3>Purchasing Credits</h3>
      <pre><code>// Using ethers.js
const tx = await streamToken.connect(user).purchaseCredits({
  value: ethers.utils.parseEther("0.1") // Purchase 10 credits
});
await tx.wait();

const balance = await streamToken.balanceOf(user.address);
console.log(`User now has ${balance} streaming credits`);</code></pre>

      <h3>Starting a Stream</h3>
      <pre><code>// Using ethers.js
const contentId = "premium-video-123";
const tx = await streamToken.connect(user).startStream(contentId);
await tx.wait();

const canStream = await streamToken.canStream(user.address, contentId);
console.log(`User can stream content: ${canStream}`);</code></pre>
    </section>
  </main>

  <footer>
    <p>See also: <a href="stream-access.html">StreamAccessContract</a></p>
    <p>© 2024 Team MODSIAS | Project Demo</p>
  </footer>
</body>
</html>
EOL
fi

echo "Done creating missing files."
echo

# Step 4: Check for and resolve merge conflicts
echo "Step 4: Checking for merge conflicts..."
echo "----------------------------"

merge_conflict_files=(
  "REPOSITORY_MERGE_GUIDE.md"
)

for file in "${merge_conflict_files[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "<<<<<<< " "$file" || grep -q "=======" "$file" || grep -q ">>>>>>>" "$file"; then
      echo "Found merge conflicts in $file"
      echo "Creating a clean version..."

      # Create a clean version by removing conflict markers
      sed '/^<<<<<<<\s/,/^>>>>>>>\s/d' "$file" > "${file}.clean"
      mv "${file}.clean" "$file"
      echo "Cleaned merge conflicts in $file"
    else
      echo "No merge conflicts found in $file"
    fi
  else
    echo "File not found: $file"
  fi
done

echo "Done checking for merge conflicts."
echo

# Create assets directories if they don't exist
echo "Step 5: Setting up assets directories..."
echo "----------------------------"

assets_dirs=(
  "assets/css"
  "assets/js"
  "assets/images"
)

for dir in "${assets_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "Creating directory: $dir"
    mkdir -p "$dir"
  else
    echo "Directory already exists: $dir"
  fi
done

# Create a basic CSS file if it doesn't exist
css_file="assets/css/styles.css"
if [ ! -f "$css_file" ]; then
  echo "Creating basic CSS file: $css_file"
  cat > "$css_file" << EOL
/* Web3 Crypto Streaming Service - Main Stylesheet */

/* Global styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3, h4, h5, h6 {
  color: #2c3e50;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

h1 {
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

a {
  color: #3498db;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

pre {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 1em;
  overflow: auto;
}

code {
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  background-color: #f8f8f8;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* Utility classes */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.btn {
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
}

.btn:hover {
  background-color: #2980b9;
  text-decoration: none;
}

/* Header and footer */
header, footer {
  margin: 2rem 0;
}

footer {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  font-size: 0.9em;
  color: #7f8c8d;
}
EOL
fi

echo "Done setting up assets directories."
echo

echo "=========================================="
echo "Repository cleanup complete!"
echo "=========================================="
