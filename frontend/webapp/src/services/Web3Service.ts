import { ethers } from 'ethers';

class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connect(): Promise<string | null> {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.error('MetaMask is not installed');
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        this.signer = await this.provider.getSigner();
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async sendTransaction(to: string, amount: string): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    
    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
      
      return tx;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async getNetwork(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    try {
      const network = await this.provider.getNetwork();
      return network.name;
    } catch (error) {
      console.error('Error getting network:', error);
      throw error;
    }
  }

  async listenForAccountChanges(callback: (accounts: string[]) => void): Promise<void> {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  async listenForChainChanges(callback: (chainId: string) => void): Promise<void> {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }
}

// Export a singleton instance
export default new Web3Service();