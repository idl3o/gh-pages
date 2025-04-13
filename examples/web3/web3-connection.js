/**
 * Web3 Connection Example
 * Shows how to connect to Web3 provider and interact with blockchain
 */

/**
 * Initialize Web3 with provider
 * @returns {Promise<Web3>} Web3 instance
 */
async function initWeb3() {
  let web3;
  
  // Check if MetaMask is installed
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      console.log('Connected to Web3 via window.ethereum');
      return web3;
    } catch (error) {
      console.error('User denied account access:', error);
      throw new Error('User denied account access');
    }
  }
  // Legacy dapp browsers
  else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
    console.log('Connected to legacy web3.currentProvider');
    return web3;
  }
  // Fallback to local provider
  else {
    console.warn('No Web3 provider detected, falling back to local node');
    web3 = new Web3('http://localhost:8545');
    return web3;
  }
}

/**
 * Get network ID and name
 * @param {Web3} web3 Web3 instance
 * @returns {Promise<Object>} Network info with id and name
 */
async function getNetworkInfo(web3) {
  const networkId = await web3.eth.net.getId();
  let networkName;
  
  // Map network ID to name
  switch(networkId) {
    case 1:
      networkName = 'Ethereum Mainnet';
      break;
    case 11155111:
      networkName = 'Sepolia';
      break;
    case 5:
      networkName = 'Goerli';
      break;
    case 137:
      networkName = 'Polygon Mainnet';
      break;
    case 80001:
      networkName = 'Mumbai (Polygon Testnet)';
      break;
    case 42161:
      networkName = 'Arbitrum One';
      break;
    default:
      networkName = 'Unknown Network';
  }
  
  return { id: networkId, name: networkName };
}

/**
 * Get user's account and balance
 * @param {Web3} web3 Web3 instance
 * @returns {Promise<Object>} Account info with address and balance
 */
async function getAccountInfo(web3) {
  const accounts = await web3.eth.getAccounts();
  
  if (accounts.length === 0) {
    throw new Error('No accounts found. Make sure your wallet is connected.');
  }
  
  const address = accounts[0];
  const balanceWei = await web3.eth.getBalance(address);
  const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
  
  return { 
    address, 
    balanceWei,
    balanceEth
  };
}

// Example usage (for reference)
async function main() {
  try {
    const web3 = await initWeb3();
    const network = await getNetworkInfo(web3);
    const account = await getAccountInfo(web3);
    
    console.log(`Connected to: ${network.name} (ID: ${network.id})`);
    console.log(`Account: ${account.address}`);
    console.log(`Balance: ${account.balanceEth} ETH`);
  } catch (error) {
    console.error('Error in Web3 example:', error);
  }
}

// Export functions for use in other examples
module.exports = {
  initWeb3,
  getNetworkInfo,
  getAccountInfo
};