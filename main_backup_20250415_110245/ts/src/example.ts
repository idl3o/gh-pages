import { StreamClient } from './index';

async function runExample() {
  // Create a new client instance
  const client = new StreamClient({
    apiUrl: 'https://api.example.com',
    ipfsGateway: 'https://ipfs.example.com/ipfs/',
    chainId: 1
  });
  
  try {
    console.log('Connecting wallet...');
    const address = await client.connectWallet();
    console.log(`Connected with address: ${address}`);
    
    // Get or create profile
    let profile = await client.getProfile(address);
    
    if (profile) {
      console.log('Found existing profile:');
      console.log(`Name: ${profile.name}`);
      console.log(`Bio: ${profile.bio}`);
      console.log(`Category: ${profile.category}`);
      console.log(`Registration Date: ${profile.registrationDate}`);
    } else {
      console.log('No profile found. Creating new profile...');
      
      // In a browser environment, you would get this from a file input
      // For this example, let's assume we already have a profile picture CID
      const profileImageCid = 'QmExample123456789';
      
      const success = await client.registerCreator({
        name: 'Example Creator',
        email: 'creator@example.com',
        bio: 'I create amazing content about Web3 and blockchain technology.',
        category: 'education',
        profileImageCid
      });
      
      if (success) {
        console.log('Successfully registered as a creator!');
        profile = await client.getProfile(address);
      } else {
        console.log('Failed to register creator.');
      }
    }
    
    // Get token balance
    const tokenDetails = await client.getTokenBalance();
    console.log(`Token balance: ${tokenDetails.formattedBalance} ${tokenDetails.symbol}`);
    
    // Example of publishing content (in a real app, files would be uploaded first)
    console.log('Publishing new content...');
    const contentId = await client.publishContent({
      title: 'Introduction to Web3',
      description: 'Learn the basics of Web3 technology and blockchain.',
      creatorAddress: address,
      contentType: 'video/mp4',
      duration: 600, // 10 minutes
      thumbnailCid: 'QmThumbnailCid123',
      contentCid: 'QmContentCid456',
      tags: ['education', 'web3', 'blockchain'],
      price: '5000000000000000', // 0.005 ETH in wei
      accessType: 'paid',
      createdAt: new Date().toISOString()
    });
    
    console.log(`Content published successfully! Content ID: ${contentId}`);
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example (in a browser, this would be triggered by user interaction)
if (typeof window === 'undefined') {
  // Only auto-run in Node.js environment
  runExample().catch(console.error);
}
