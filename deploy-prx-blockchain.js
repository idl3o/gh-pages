/**
 * PRX Blockchain GUI Deployment Script
 * 
 * This script handles the deployment of the PRX blockchain system:
 * 1. Compiles the PRXTokenChain contract
 * 2. Deploys the contract to the specified network
 * 3. Updates the frontend with the contract address
 * 4. Deploys the frontend to GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { ethers } = require('hardhat');

async function main() {
    try {
        console.log('PRX Blockchain GUI Deployment');
        console.log('=============================\n');
        
        // 1. Compile contracts
        console.log('Compiling contracts...');
        await executeCommand('npx hardhat compile');
        console.log('✅ Contracts compiled successfully\n');
        
        // 2. Deploy contract
        console.log('Deploying PRXTokenChain contract...');
        
        // Token configuration
        const name = "PRXToken";
        const symbol = "PRX";
        const mintPrice = ethers.utils.parseEther("0.01"); // 0.01 ETH
        
        // Get the contract factory
        const PRXTokenChain = await ethers.getContractFactory("PRXTokenChain");
        
        // Deploy the contract
        const prxTokenChain = await PRXTokenChain.deploy(name, symbol, mintPrice);
        await prxTokenChain.deployed();
        
        console.log(`✅ PRXTokenChain deployed to: ${prxTokenChain.address}`);
        console.log(`   Token Name: ${name}`);
        console.log(`   Token Symbol: ${symbol}`);
        console.log(`   Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`);
        console.log(`   Transaction Hash: ${prxTokenChain.deployTransaction.hash}\n`);
        
        // 3. Update frontend with contract address
        console.log('Updating frontend with contract address...');
        
        // Create a deployment info file
        const deploymentInfo = {
            contractAddress: prxTokenChain.address,
            network: network.name,
            deploymentDate: new Date().toISOString(),
            contractName: "PRXTokenChain"
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'assets/js/prx-deployment.json'), 
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        // Update JavaScript to read the contract address from the deployment info
        const jsInterface = fs.readFileSync(
            path.join(__dirname, 'assets/js/prx-blockchain-interface.js'), 
            'utf8'
        );
        
        if (!jsInterface.includes('prx-deployment.json')) {
            const updatedJsInterface = jsInterface.replace(
                'contractAddress = localStorage.getItem(\'prxTokenChainAddress\');',
                `contractAddress = localStorage.getItem('prxTokenChainAddress');
            
            // If not found in localStorage, try to load from deployment file
            if (!contractAddress) {
                fetch('./assets/js/prx-deployment.json')
                    .then(response => response.json())
                    .then(data => {
                        contractAddress = data.contractAddress;
                        localStorage.setItem('prxTokenChainAddress', contractAddress);
                        setupContract();
                    })
                    .catch(error => {
                        console.error("Error loading deployment info:", error);
                        showAlert('Contract address not found. Please deploy the PRXTokenChain contract first.', 'warning');
                    });
                return;
            }`
            );
            
            fs.writeFileSync(
                path.join(__dirname, 'assets/js/prx-blockchain-interface.js'),
                updatedJsInterface
            );
        }
        
        console.log('✅ Frontend updated with contract address\n');
        
        // 4. Deploy to GitHub Pages
        console.log('Preparing to deploy to GitHub Pages...');
        
        // Create or update the gh-pages-deploy script
        const deployScript = `#!/bin/bash
# PRX Blockchain GUI GitHub Pages deployment script

echo "Deploying PRX Blockchain GUI to GitHub Pages..."

# Create a temporary directory for the deployment
mkdir -p ./gh-pages-deploy

# Copy necessary files
cp ./prx-blockchain.html ./gh-pages-deploy/index.html
cp -r ./assets ./gh-pages-deploy/
cp -r ./contracts ./gh-pages-deploy/
cp -r ./scripts ./gh-pages-deploy/

# Add a README
echo "# PRX Blockchain GUI" > ./gh-pages-deploy/README.md
echo "PRX blockchain interface deployed at $(date)" >> ./gh-pages-deploy/README.md

# If this is run in a CI environment like GitHub Actions
if [ -n "$CI" ]; then
  echo "Running in CI environment"
  # Setup Git
  git config --global user.name "GitHub Actions"
  git config --global user.email "actions@github.com"
fi

# Navigate to the deployment directory
cd ./gh-pages-deploy

# Initialize Git
git init
git add .
git commit -m "Deploy PRX Blockchain GUI to GitHub Pages"

# Push to the gh-pages branch
git push --force "https://\${GITHUB_TOKEN}@github.com/\${GITHUB_REPOSITORY}.git" master:gh-pages

# Clean up
cd ..
rm -rf ./gh-pages-deploy

echo "Deployment complete!"
`;
        
        fs.writeFileSync(
            path.join(__dirname, 'deploy-prx-gh-pages.sh'),
            deployScript
        );
        
        // Make it executable
        await executeCommand('chmod +x ./deploy-prx-gh-pages.sh');
        
        console.log('✅ Deployment script created\n');
        
        console.log(`
PRX Blockchain GUI has been successfully set up!

To deploy to GitHub Pages:
1. Make sure your GitHub repository has GitHub Pages enabled
2. Run: ./deploy-prx-gh-pages.sh

Your deployed application will be available at:
https://[YOUR-USERNAME].github.io/gh-pages/

Contract Address: ${prxTokenChain.address}
`);
        
    } catch (error) {
        console.error('Error during deployment:', error);
        process.exit(1);
    }
}

async function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.warn(`Command warning: ${stderr}`);
            }
            
            if (stdout) {
                console.log(stdout);
            }
            
            resolve();
        });
    });
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });