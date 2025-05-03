import { ethers } from "ethers";
import contractAddresses from "../config/contractAddresses";
import StreamAccessContractABI from "../abis/StreamAccessContract.json";
import ProofOfExistenceABI from "../abis/ProofOfExistence.json";
import StreamingTokenABI from "../abis/StreamingToken.json";
import StreamPaymentABI from "../abis/StreamPayment.json";

/**
 * Service for interacting with Web3 and smart contracts
 */
export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private streamAccessContract: ethers.Contract | null = null;
  private proofOfExistenceContract: ethers.Contract | null = null;
  private streamingTokenContract: ethers.Contract | null = null;
  private streamPaymentContract: ethers.Contract | null = null;
  
  /**
   * Initialize the Web3 service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.error("MetaMask not detected");
        return false;
      }

      // Initialize provider
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Get signer
      this.signer = this.provider.getSigner();
      
      // Initialize contracts
      await this.initializeContracts();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize Web3 service", error);
      return false;
    }
  }
  
  /**
   * Initialize contract instances
   */
  private async initializeContracts(): Promise<void> {
    if (!this.provider || !this.signer) {
      throw new Error("Web3 provider not initialized");
    }
    
    const networkId = (await this.provider.getNetwork()).chainId;
    const addresses = contractAddresses[networkId];
    
    if (!addresses) {
      throw new Error(`Contracts not deployed on network ${networkId}`);
    }
    
    this.streamAccessContract = new ethers.Contract(
      addresses.streamAccess,
      StreamAccessContractABI,
      this.signer
    );
    
    this.proofOfExistenceContract = new ethers.Contract(
      addresses.proofOfExistence,
      ProofOfExistenceABI,
      this.signer
    );
    
    this.streamingTokenContract = new ethers.Contract(
      addresses.streamingToken,
      StreamingTokenABI,
      this.signer
    );
    
    this.streamPaymentContract = new ethers.Contract(
      addresses.streamPayment,
      StreamPaymentABI,
      this.signer
    );
  }
  
  /**
   * Register new content
   */
  public async registerContent(
    title: string,
    price: string,
    isPremium: boolean,
    royaltyPercent: number,
    contentHash: string
  ): Promise<string> {
    if (!this.streamAccessContract) {
      throw new Error("Stream access contract not initialized");
    }
    
    try {
      const contentId = ethers.utils.id(title + contentHash);
      const priceWei = ethers.utils.parseEther(price);
      
      const tx = await this.streamAccessContract.registerContent(
        contentId,
        priceWei,
        isPremium,
        royaltyPercent,
        contentHash
      );
      
      await tx.wait();
      return contentId;
    } catch (error) {
      console.error("Failed to register content", error);
      throw error;
    }
  }
  
  /**
   * Purchase access to content
   */
  public async purchaseAccess(
    contentId: string,
    price: string,
    duration: number = 0
  ): Promise<boolean> {
    if (!this.streamAccessContract) {
      throw new Error("Stream access contract not initialized");
    }
    
    try {
      const priceWei = ethers.utils.parseEther(price);
      
      const tx = await this.streamAccessContract.purchaseAccess(
        contentId,
        duration,
        { value: priceWei }
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to purchase access", error);
      throw error;
    }
  }
  
  /**
   * Create a payment stream
   */
  public async createPaymentStream(
    recipient: string,
    ratePerSecond: string,
    initialDeposit: string
  ): Promise<string> {
    if (!this.streamPaymentContract) {
      throw new Error("Stream payment contract not initialized");
    }
    
    try {
      const rateWei = ethers.utils.parseEther(ratePerSecond);
      const depositWei = ethers.utils.parseEther(initialDeposit);
      
      const tx = await this.streamPaymentContract.createStream(
        recipient,
        rateWei,
        { value: depositWei }
      );
      
      const receipt = await tx.wait();
      
      // Extract stream ID from event logs
      const event = receipt.events?.find(e => e.event === "StreamCreated");
      if (!event || !event.args) {
        throw new Error("Stream created event not found in transaction");
      }
      
      return event.args.streamId;
    } catch (error) {
      console.error("Failed to create payment stream", error);
      throw error;
    }
  }
  
  /**
   * Register proof of existence for content
   */
  public async registerProof(
    contentHash: string,
    quantumSignature: string,
    confidence: number
  ): Promise<boolean> {
    if (!this.proofOfExistenceContract) {
      throw new Error("Proof of existence contract not initialized");
    }
    
    try {
      const contentBytes = ethers.utils.id(contentHash);
      const signatureBytes = ethers.utils.id(quantumSignature);
      
      const confidenceValue = Math.min(Math.max(confidence * 100, 0), 10000);
      
      const tx = await this.proofOfExistenceContract.registerProof(
        contentBytes,
        signatureBytes,
        confidenceValue
      );
      
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to register proof", error);
      throw error;
    }
  }
  
  /**
   * Get account address
   */
  public async getAccount(): Promise<string> {
    if (!this.signer) {
      throw new Error("Web3 signer not initialized");
    }
    
    return await this.signer.getAddress();
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;
