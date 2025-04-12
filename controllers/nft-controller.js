/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * NFT Controller
 * Handles NFT content ownership, minting, and token gating functionality
 */

const UserModel = require('../models/user-model');
const ContentModel = require('../models/content-model');

// NFT Contract ABI - simplified for demo
const NFT_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintNFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses for different networks
const NFT_CONTRACTS = {
  '1': '0x1234567890123456789012345678901234567890', // Ethereum Mainnet
  '137': '0x2345678901234567890123456789012345678901', // Polygon
  '42161': '0x3456789012345678901234567890123456789012' // Arbitrum One
};

class NFTController {
  constructor() {
    this.initialized = false;
    this.Web3Utils = null;
  }

  /**
   * Initialize the controller
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Import web3 utilities
    try {
      this.Web3Utils = require('../assets/js/web3-utils');
      this.initialized = true;
      console.info('NFT controller initialized');
    } catch (error) {
      console.error('Failed to initialize NFT controller:', error);
      throw new Error('NFT controller initialization failed');
    }
  }

  /**
   * Get NFT contract for the current network
   * @returns {Promise<Object>} Contract instance
   */
  async getContract() {
    await this.initialize();
    
    const networkInfo = await this.Web3Utils.getNetworkInfo();
    const contractAddress = NFT_CONTRACTS[networkInfo.id];
    
    if (!contractAddress) {
      throw new Error(`NFT contract not deployed on network ${networkInfo.name}`);
    }
    
    return await this.Web3Utils.getContract(contractAddress, NFT_CONTRACT_ABI);
  }

  /**
   * Mint an NFT for content
   * @param {Object} mintData Minting parameters
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Minting result
   */
  async mintContentNFT(mintData, authToken) {
    try {
      await this.initialize();
      
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Validate content ownership
      const content = await ContentModel.getContent(mintData.contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      if (content.creatorId !== currentUser.id) {
        return {
          success: false,
          error: 'Only content creator can mint an NFT for this content'
        };
      }
      
      // Create metadata for the NFT
      const metadata = {
        name: mintData.name || content.title,
        description: mintData.description || content.description,
        image: mintData.image || content.thumbnailUrl,
        animation_url: content.url,
        attributes: [
          {
            trait_type: 'Content Type',
            value: content.contentType
          },
          {
            trait_type: 'Creator',
            value: currentUser.name || currentUser.walletAddress.substring(0, 8)
          },
          {
            trait_type: 'Creation Date',
            value: new Date(content.createdAt).toISOString().split('T')[0]
          }
        ],
        external_url: `${window.location.origin}/content/${content.id}`,
        content_hash: content.contentHash
      };
      
      // Upload metadata to IPFS (simplified for demo)
      const metadataUri = `ipfs://metadata/${content.id}`;
      
      // Get NFT contract
      const nftContract = await this.getContract();
      
      // Mint NFT
      const tx = await nftContract.methods.mintNFT(
        currentUser.walletAddress,
        metadataUri
      ).send({ from: currentUser.walletAddress });
      
      // Update content with NFT info
      const tokenId = tx.events.Transfer.returnValues.tokenId;
      await ContentModel.updateContent(content.id, {
        nftTokenId: tokenId,
        nftContractAddress: nftContract.options.address,
        nftMetadataUri: metadataUri
      });
      
      return {
        success: true,
        tokenId,
        transactionHash: tx.transactionHash,
        contractAddress: nftContract.options.address,
        metadata: metadataUri
      };
    } catch (error) {
      console.error('NFT minting error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user owns specific content NFT
   * @param {string} contentId Content ID
   * @param {string} walletAddress User wallet address
   * @returns {Promise<Object>} Ownership status
   */
  async checkContentOwnership(contentId, walletAddress) {
    try {
      await this.initialize();
      
      // Get content details
      const content = await ContentModel.getContent(contentId);
      if (!content || !content.nftTokenId) {
        return {
          success: false,
          error: 'Content has no associated NFT'
        };
      }
      
      // Get NFT contract
      const nftContract = await this.getContract();
      
      // Check ownership
      const ownerAddress = await nftContract.methods.ownerOf(content.nftTokenId).call();
      const isOwner = ownerAddress.toLowerCase() === walletAddress.toLowerCase();
      
      return {
        success: true,
        isOwner,
        tokenId: content.nftTokenId,
        contractAddress: content.nftContractAddress
      };
    } catch (error) {
      console.error('Ownership check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all NFTs owned by a wallet
   * @param {string} walletAddress Wallet address to check
   * @returns {Promise<Object>} List of owned NFTs
   */
  async getOwnedNFTs(walletAddress) {
    try {
      await this.initialize();
      
      // Get NFT contract
      const nftContract = await this.getContract();
      
      // Get balance
      const balance = await nftContract.methods.balanceOf(walletAddress).call();
      
      // This is a simplified implementation. In a real-world scenario,
      // we would use events or an indexed database to efficiently 
      // retrieve owned tokens.
      
      // For this demo, we'll retrieve token IDs by scanning recent content
      const allContent = await ContentModel.listContent({ hasNft: true });
      const ownedNFTs = [];
      
      for (const content of allContent) {
        if (!content.nftTokenId) continue;
        
        try {
          const owner = await nftContract.methods.ownerOf(content.nftTokenId).call();
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            ownedNFTs.push({
              tokenId: content.nftTokenId,
              contentId: content.id,
              title: content.title,
              thumbnailUrl: content.thumbnailUrl,
              contentType: content.contentType,
              contractAddress: content.nftContractAddress,
              metadataUri: content.nftMetadataUri
            });
          }
        } catch (err) {
          // Skip if any error occurs for a specific token
          console.warn(`Error checking token ${content.nftTokenId}:`, err.message);
        }
      }
      
      return {
        success: true,
        totalBalance: parseInt(balance),
        ownedNFTs
      };
    } catch (error) {
      console.error('Get owned NFTs error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user can access token-gated content
   * @param {string} contentId Content ID
   * @param {string} walletAddress User wallet address
   * @returns {Promise<Object>} Access status
   */
  async checkTokenGatedAccess(contentId, walletAddress) {
    try {
      await this.initialize();
      
      // Get content details
      const content = await ContentModel.getContent(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // If content is not token-gated, access is granted
      if (!content.tokenGating || !content.tokenGating.enabled) {
        return {
          success: true,
          hasAccess: true,
          reason: 'Content is not token-gated'
        };
      }
      
      // Check if user is the creator
      if (content.creatorWallet && 
          content.creatorWallet.toLowerCase() === walletAddress.toLowerCase()) {
        return {
          success: true,
          hasAccess: true,
          reason: 'Creator access'
        };
      }
      
      // Handle different token gating types
      const gatingConfig = content.tokenGating;
      
      if (gatingConfig.type === 'nft') {
        // Check if user owns the required NFT
        const nftContract = await this.Web3Utils.getContract(
          gatingConfig.contractAddress, 
          NFT_CONTRACT_ABI
        );
        
        const balance = await nftContract.methods.balanceOf(walletAddress).call();
        const hasAccess = parseInt(balance) > 0;
        
        return {
          success: true,
          hasAccess,
          reason: hasAccess ? 'NFT holder' : 'Missing required NFT'
        };
      } else if (gatingConfig.type === 'erc20') {
        // For ERC20 token gating (simplified)
        return {
          success: true,
          hasAccess: false,
          reason: 'ERC20 token gating not implemented in this demo'
        };
      }
      
      return {
        success: false,
        error: 'Unsupported token gating type'
      };
    } catch (error) {
      console.error('Token gated access check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NFTController();