/**
 * Video Loader Module
 *
 * Handles loading video content from IPFS for the Web3 streaming platform
 */

class VideoLoader {
  constructor() {
    // IPFS gateway URLs to try (in order)
    this.ipfsGateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://ipfs.infura.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://dweb.link/ipfs/'
    ];

    // Demo content for testing without actual IPFS content
    this.demoContent = {
      'content_001': {
        title: 'Blockchain Basics',
        creator: 'Team MODSIAS',
        description: 'An introduction to blockchain technology fundamentals.',
        ipfsCid: 'QmV5FrHoQJvnQsQiR3zGB3cJ1Gn1eTyrEa9UEbqckEvBzL', // Replace with actual IPFS CID
        thumbnail: 'assets/images/blockchain-basics-thumbnail.jpg',
        fallbackUrl: 'https://download.samplelib.com/mp4/sample-5s.mp4'
      },
      'content_002': {
        title: 'Smart Contract Development',
        creator: 'Web3 University',
        description: 'Learn how to write secure and efficient smart contracts.',
        ipfsCid: 'QmS4ustL54uo8FzR9455qaxZwuMiUhyvMcX9Ba8nUH4uVv', // Replace with actual IPFS CID
        thumbnail: 'assets/images/smart-contract-dev-thumbnail.jpg',
        fallbackUrl: 'https://download.samplelib.com/mp4/sample-10s.mp4'
      },
      'content_003': {
        title: 'Web3 Integration Guide',
        creator: 'DApp Developers Guild',
        description: 'How to integrate Web3 technologies into your applications.',
        ipfsCid: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A', // Replace with actual IPFS CID
        thumbnail: 'assets/images/web3-integration-thumbnail.jpg',
        fallbackUrl: 'https://download.samplelib.com/mp4/sample-15s.mp4'
      }
    };
  }

  /**
   * Get demo content by ID
   * @param {string} contentId - Content identifier
   * @return {object} Content object
   */
  getDemoContent(contentId) {
    return this.demoContent[contentId] || this.demoContent['content_001'];
  }

  /**
   * Load video from IPFS
   * @param {string} cid - IPFS content identifier
   * @param {function} callback - Called with (videoUrl, error) when complete
   */
  loadVideo(cid, callback) {
    if (!cid) {
      callback(null, 'Invalid content identifier');
      return;
    }

    // Try to load from each gateway
    this._tryLoadFromGateways(cid, 0, callback);
  }

  /**
   * Recursively try to load content from each gateway
   * @private
   */
  _tryLoadFromGateways(cid, index, callback) {
    if (index >= this.ipfsGateways.length) {
      // We've tried all gateways, use fallback
      console.warn('Failed to load from all IPFS gateways, using fallback');

      // Find content with matching CID
      const content = Object.values(this.demoContent).find(c => c.ipfsCid === cid);

      if (content && content.fallbackUrl) {
        callback(content.fallbackUrl, 'Failed to load from IPFS');
      } else {
        callback('https://download.samplelib.com/mp4/sample-5s.mp4', 'Failed to load content');
      }
      return;
    }

    const gateway = this.ipfsGateways[index];
    const videoUrl = `${gateway}${cid}`;

    console.log(`Trying to load video from: ${videoUrl}`);

    // Create a temporary video element to test the URL
    const tempVideo = document.createElement('video');

    // Set timeout for gateway attempt
    const timeoutId = setTimeout(() => {
      console.warn(`Timeout loading from ${gateway}`);
      tempVideo.onerror = null;
      tempVideo.onloadeddata = null;
      this._tryLoadFromGateways(cid, index + 1, callback);
    }, 5000);

    // Handle successful load
    tempVideo.onloadeddata = () => {
      clearTimeout(timeoutId);
      console.log(`Successfully loaded video from ${gateway}`);
      callback(videoUrl);
    };

    // Handle load error
    tempVideo.onerror = () => {
      clearTimeout(timeoutId);
      console.warn(`Failed to load video from ${gateway}`);
      this._tryLoadFromGateways(cid, index + 1, callback);
    };

    // Start loading from current gateway
    tempVideo.src = videoUrl;
    tempVideo.load();
  }
}

// For use in browser environment
if (typeof window !== 'undefined') {
  window.VideoLoader = VideoLoader;
}

// For use in Node.js environment
if (typeof module !== 'undefined') {
  module.exports = VideoLoader;
}
