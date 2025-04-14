const ipfsClient = require('ipfs-http-client');
const fs = require('fs');
const path = require('path');
const pinataSDK = require('@pinata/sdk');

// Configuration
const config = {
  pinataApiKey: process.env.PINATA_API_KEY || 'YOUR_PINATA_KEY',
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY || 'YOUR_PINATA_SECRET',
  distFolder: path.join(__dirname, 'dist')
};

// Initialize Pinata client
const pinata = pinataSDK(config.pinataApiKey, config.pinataSecretApiKey);

async function deploy() {
  console.log('📦 Preparing to deploy to IPFS...');
  
  try {
    // Validate dist folder exists
    if (!fs.existsSync(config.distFolder)) {
      throw new Error(`Distribution folder not found at: ${config.distFolder}`);
    }
    
    // Upload to Pinata
    console.log('📤 Uploading to Pinata...');
    const result = await pinata.pinFromFS(config.distFolder, {
      pinataMetadata: {
        name: 'gh-pages-deployment',
        keyvalues: {
          timestamp: Date.now().toString()
        }
      }
    });
    
    console.log('✅ Successfully deployed to IPFS!');
    console.log(`📌 Content CID: ${result.IpfsHash}`);
    console.log(`🔗 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    console.log(`🔗 IPFS URL: ipfs://${result.IpfsHash}`);
    
    // Save deployment details
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      cid: result.IpfsHash,
      size: result.PinSize,
      urls: {
        gateway: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        ipfs: `ipfs://${result.IpfsHash}`
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'ipfs-deployment.json'), 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    return deploymentInfo;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  deploy().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { deploy };
