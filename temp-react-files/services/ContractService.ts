import { ethers } from 'ethers';

// ABI (Application Binary Interface) for PRX Token contract
const PRX_TOKEN_ABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  
  // Write functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Contract Addresses - These should be environment variables in production
const PRX_TOKEN_ADDRESS = process.env.REACT_APP_PRX_TOKEN_ADDRESS || '0x123456789AbCdEf123456789AbCdEf123456789'; // placeholder address

class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private prxTokenContract: ethers.Contract | null = null;
  
  /**
   * Initialize the contract service with a provider
   */
  async initialize(provider: ethers.BrowserProvider | ethers.JsonRpcProvider): Promise<void> {
    this.provider = provider;
    
    // Get signer if available (connected wallet)
    try {
      this.signer = await provider.getSigner();
    } catch (error) {
      console.warn("No signer available. Read-only mode activated.");
    }
    
    // Initialize the PRX token contract
    this.prxTokenContract = new ethers.Contract(
      PRX_TOKEN_ADDRESS,
      PRX_TOKEN_ABI,
      this.signer || provider
    );
  }
  
  /**
   * Get a user's PRX token balance
   */
  async getTokenBalance(address?: string): Promise<{ balance: string; formatted: string; }> {
    if (!this.prxTokenContract) {
      throw new Error("Contract service not initialized");
    }
    
    // If address is not provided, use the connected wallet address
    const targetAddress = address || (await this.signer?.getAddress());
    
    if (!targetAddress) {
      throw new Error("No address provided and no wallet connected");
    }
    
    // Get balance and decimals
    const balance = await this.prxTokenContract.balanceOf(targetAddress);
    const decimals = await this.prxTokenContract.decimals();
    
    // Format the balance considering the token decimals
    const formatted = ethers.formatUnits(balance, decimals);
    
    return {
      balance: balance.toString(),
      formatted
    };
  }
  
  /**
   * Transfer PRX tokens to another address
   */
  async transferTokens(toAddress: string, amount: string, decimals?: number): Promise<ethers.TransactionResponse> {
    if (!this.prxTokenContract || !this.signer) {
      throw new Error("Contract service not initialized or no wallet connected");
    }
    
    // Get decimals if not provided
    if (!decimals) {
      decimals = await this.prxTokenContract.decimals();
    }
    
    // Convert amount to proper format with decimals
    const parsedAmount = ethers.parseUnits(amount, decimals);
    
    // Send transaction
    return await this.prxTokenContract.transfer(toAddress, parsedAmount);
  }
  
  /**
   * Approve another address (like a dApp) to spend tokens on user's behalf
   */
  async approveSpender(spenderAddress: string, amount: string, decimals?: number): Promise<ethers.TransactionResponse> {
    if (!this.prxTokenContract || !this.signer) {
      throw new Error("Contract service not initialized or no wallet connected");
    }
    
    // Get decimals if not provided
    if (!decimals) {
      decimals = await this.prxTokenContract.decimals();
    }
    
    // Convert amount to proper format with decimals
    const parsedAmount = ethers.parseUnits(amount, decimals);
    
    // Send approve transaction
    return await this.prxTokenContract.approve(spenderAddress, parsedAmount);
  }
  
  /**
   * Get basic token information
   */
  async getTokenInfo(): Promise<{ name: string; symbol: string; decimals: number; }> {
    if (!this.prxTokenContract) {
      throw new Error("Contract service not initialized");
    }
    
    const [name, symbol, decimals] = await Promise.all([
      this.prxTokenContract.name(),
      this.prxTokenContract.symbol(),
      this.prxTokenContract.decimals()
    ]);
    
    return {
      name,
      symbol,
      decimals
    };
  }
  
  /**
   * Check if the contract service is initialized
   */
  isInitialized(): boolean {
    return this.prxTokenContract !== null;
  }
  
  /**
   * Get the connected wallet address
   */
  async getConnectedAddress(): Promise<string | null> {
    if (!this.signer) {
      return null;
    }
    
    return await this.signer.getAddress();
  }
}

// Create and export a singleton instance
const contractService = new ContractService();
export default contractService;