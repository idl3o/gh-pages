import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

/**
 * PRXBlockchainClient provides a TypeScript interface to interact with the PRXTokenChain contract
 * This client supports all Phase 2 features:
 * - Token minting quotas and rate limiting
 * - Tiered access controls for private content
 * - Content verification mechanism
 * - Token delegation for voting power
 * - Proposal execution pipeline for governance actions
 * - Transaction fee model and revenue distribution
 */
export class PRXBlockchainClient {
  private web3: Web3;
  private contract: Contract;
  private account: string | null;
  
  /**
   * Initialize the PRX Blockchain client
   * @param contractAddress The address of the deployed PRXTokenChain contract
   * @param contractABI The ABI of the PRXTokenChain contract
   * @param provider The Web3 provider (e.g., window.ethereum, HttpProvider, etc.)
   */
  constructor(contractAddress: string, contractABI: AbiItem[], provider: any) {
    this.web3 = new Web3(provider);
    this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
    this.account = null;
  }
  
  /**
   * Connect a user's wallet
   * @returns The connected account address
   */
  async connect(): Promise<string> {
    try {
      const accounts = await this.web3.eth.requestAccounts();
      this.account = accounts[0];
      return this.account;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }
  
  /**
   * Get the current connected account
   * @returns The current account address or null if not connected
   */
  getAccount(): string | null {
    return this.account;
  }
  
  /**
   * Switch connected account
   * @param account The account address to set as active
   */
  setAccount(account: string): void {
    this.account = account;
  }
  
  /**
   * Get contract basic information
   */
  async getContractInfo(): Promise<{ name: string; symbol: string; totalSupply: number; mintPrice: string }> {
    const name = await this.contract.methods.name().call();
    const symbol = await this.contract.methods.symbol().call();
    const totalSupply = await this.contract.methods.totalSupply().call();
    const mintPrice = await this.contract.methods.mintPrice().call();
    
    return { name, symbol, totalSupply: Number(totalSupply), mintPrice };
  }
  
  // ==================== Token Operations ====================
  
  /**
   * Mint a new token/block
   * @param metadata The metadata for the token
   * @returns The newly minted token ID
   */
  async mintToken(metadata: string): Promise<number> {
    this.requireAccount();
    const mintPrice = await this.contract.methods.mintPrice().call();
    
    const result = await this.contract.methods.mint(metadata).send({
      from: this.account,
      value: mintPrice
    });
    
    // Extract tokenId from result
    const tokenId = this.extractTokenIdFromResult(result);
    return tokenId;
  }
  
  /**
   * Mint a new token with content
   * @param metadata Basic token metadata
   * @param contentURI URI pointing to the content
   * @param contentType Type of content (e.g., image/png, video/mp4)
   * @param isPrivate Whether the content should be private (requires payment to access)
   * @param contentHash Hash of the actual content for verification
   * @returns The newly minted token ID
   */
  async mintTokenWithContent(
    metadata: string,
    contentURI: string,
    contentType: string,
    isPrivate: boolean,
    contentHash: string
  ): Promise<number> {
    this.requireAccount();
    const mintPrice = await this.contract.methods.mintPrice().call();
    
    const result = await this.contract.methods.mintWithContent(
      metadata, 
      contentURI, 
      contentType, 
      isPrivate,
      contentHash
    ).send({
      from: this.account,
      value: mintPrice
    });
    
    // Extract tokenId from result
    const tokenId = this.extractTokenIdFromResult(result);
    return tokenId;
  }
  
  /**
   * Transfer a token to another address
   * @param to The recipient address
   * @param tokenId The token ID to transfer
   * @returns Transaction success status
   */
  async transferToken(to: string, tokenId: number): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.transfer(to, tokenId).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error transferring token:', error);
      return false;
    }
  }
  
  /**
   * Get token details
   * @param tokenId The token ID
   * @returns Token owner and metadata
   */
  async getToken(tokenId: number): Promise<{ owner: string; metadata: string }> {
    const result = await this.contract.methods.getToken(tokenId).call();
    return { owner: result[0], metadata: result[1] };
  }
  
  /**
   * Get PRX-specific metadata for a token
   * @param tokenId The token ID
   */
  async getTokenPRXMetadata(tokenId: number): Promise<{
    contentURI: string;
    contentType: string;
    creator: string;
    creationBlock: number;
    isPrivate: boolean;
    linkedTokens: number[];
    contentHash: string;
  }> {
    const result = await this.contract.methods.prxMetadata(tokenId).call();
    
    return {
      contentURI: result[0],
      contentType: result[1],
      creator: result[2],
      creationBlock: Number(result[3]),
      isPrivate: result[4],
      linkedTokens: result[5].map((id: string) => Number(id)),
      contentHash: result[6]
    };
  }
  
  // ==================== Minting Quotas and Rate Limiting ====================
  
  /**
   * Get a user's minting quota status
   * @param user The address to check (uses connected account if not specified)
   * @returns Quota information
   */
  async getMintingStatus(user?: string): Promise<{
    dailyQuotaRemaining: number;
    windowQuotaRemaining: number;
    timeUntilWindowReset: number;
  }> {
    const address = user || this.account || (await this.web3.eth.getAccounts())[0];
    const result = await this.contract.methods.getMintingStatus(address).call();
    
    return {
      dailyQuotaRemaining: Number(result[0]),
      windowQuotaRemaining: Number(result[1]),
      timeUntilWindowReset: Number(result[2])
    };
  }
  
  /**
   * Update the minting quota settings (governance function)
   * @param dailyLimit New daily minting limit
   * @param timeWindow New time window in seconds
   * @param windowLimit New window minting limit
   */
  async updateMintingQuota(
    dailyLimit: number,
    timeWindow: number,
    windowLimit: number
  ): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.updateMintingQuota(
        dailyLimit, timeWindow, windowLimit
      ).send({ from: this.account });
      return true;
    } catch (error) {
      console.error('Error updating minting quota:', error);
      return false;
    }
  }
  
  /**
   * Enable or disable quota enforcement
   * @param enabled Whether quota should be enabled
   */
  async setQuotaEnabled(enabled: boolean): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.setQuotaEnabled(enabled).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error changing quota status:', error);
      return false;
    }
  }
  
  /**
   * Set whether an address is exempt from quota
   * @param user Address to update
   * @param exempted Whether user should be exempt
   */
  async setQuotaExemption(user: string, exempted: boolean): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.setQuotaExemption(user, exempted).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error setting quota exemption:', error);
      return false;
    }
  }
  
  // ==================== Private Content Access ====================
  
  /**
   * Check if an address can access a token's content
   * @param tokenId The token ID
   * @param user The address to check (uses connected account if not specified)
   */
  async canAccessContent(tokenId: number, user?: string): Promise<boolean> {
    const address = user || this.account || (await this.web3.eth.getAccounts())[0];
    return this.contract.methods.canAccessContent(address, tokenId).call();
  }
  
  /**
   * Access private content by paying a fee
   * @param tokenId The token with private content to access
   * @returns The URI of the content
   */
  async accessPrivateContent(tokenId: number): Promise<string> {
    this.requireAccount();
    
    // Get content fee from the contract
    const fees = await this.contract.methods.fees().call();
    const contentFee = fees.contentFee;
    
    try {
      const contentURI = await this.contract.methods.accessPrivateContent(tokenId).send({
        from: this.account,
        value: contentFee
      });
      return contentURI;
    } catch (error) {
      console.error('Error accessing private content:', error);
      throw new Error('Failed to access private content');
    }
  }
  
  // ==================== Content Verification ====================
  
  /**
   * Get list of verifiers for a token
   * @param tokenId The token ID
   * @returns List of verifier addresses
   */
  async getVerifiers(tokenId: number): Promise<string[]> {
    return this.contract.methods.getVerifiers(tokenId).call();
  }
  
  /**
   * Update required verifications count
   * @param newCount The new minimum verifications required
   */
  async updateRequiredVerificationsCount(newCount: number): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.updateRequiredVerificationsCount(newCount).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error updating required verifications count:', error);
      return false;
    }
  }
  
  // ==================== Content Linking ====================
  
  /**
   * Link one token's content to another token
   * @param tokenId The source token ID
   * @param linkedTokenId The target token ID to link to
   */
  async linkContent(tokenId: number, linkedTokenId: number): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.linkContent(tokenId, linkedTokenId).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error linking content:', error);
      return false;
    }
  }
  
  /**
   * Get linked content for a token
   * @param tokenId The token ID
   * @returns An array of linked token IDs
   */
  async getLinkedContent(tokenId: number): Promise<number[]> {
    const result = await this.contract.methods.getLinkedContent(tokenId).call();
    return result.map((id: string) => Number(id));
  }
  
  // ==================== Token Delegation for Voting Power ====================
  
  /**
   * Delegate voting power to another address
   * @param delegatee The address to delegate to
   */
  async delegate(delegatee: string): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.delegate(delegatee).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error delegating voting power:', error);
      return false;
    }
  }
  
  /**
   * Remove delegation (equivalent to delegating to zero address)
   */
  async undelegate(): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.undelegate().send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error undelegating voting power:', error);
      return false;
    }
  }
  
  /**
   * Get the address delegated to by a delegator
   * @param delegator The address to get the delegate of
   */
  async getDelegate(delegator: string): Promise<string> {
    return this.contract.methods.getDelegate(delegator).call();
  }
  
  /**
   * Get the total voting power of an address (own tokens + delegated tokens)
   * @param delegatee The address to get the voting power of
   */
  async getVotingPower(delegatee: string): Promise<number> {
    const result = await this.contract.methods.getVotingPower(delegatee).call();
    return Number(result);
  }
  
  // ==================== Governance Proposals ====================
  
  /**
   * Create a new governance proposal
   * @param description The proposal description
   * @param votingPeriod The voting period in seconds (must be >= minimumVotingPeriod)
   * @param executionData The data to execute if proposal passes
   * @returns The proposal ID
   */
  async createProposal(
    description: string,
    votingPeriod: number,
    executionData: string
  ): Promise<number> {
    this.requireAccount();
    
    const result = await this.contract.methods.createProposal(
      description,
      votingPeriod,
      executionData
    ).send({
      from: this.account
    });
    
    // Extract proposalId from result
    // This depends on how the event data is structured
    const proposalId = Number(result.events.ProposalCreated.returnValues.proposalId);
    return proposalId;
  }
  
  /**
   * Vote on a proposal
   * @param proposalId The proposal ID
   * @param support Whether to support the proposal or not
   */
  async vote(proposalId: number, support: boolean): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.vote(proposalId, support).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      return false;
    }
  }
  
  /**
   * Execute a proposal after the voting period has ended
   * @param proposalId The proposal ID
   */
  async executeProposal(proposalId: number): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.executeProposal(proposalId).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error executing proposal:', error);
      return false;
    }
  }
  
  // ==================== Fee Model and Distribution ====================
  
  /**
   * Update fee model parameters
   * @param transferFee Fee for token transfers (in basis points)
   * @param mintFee Additional fee for minting (in basis points)
   * @param contentFee Fee for accessing private content (in wei)
   * @param platformShare Percentage of fees that go to platform (in basis points)
   * @param creatorShare Percentage of fees that go to content creator (in basis points)
   * @param stakeholderShare Percentage of fees distributed to token holders (in basis points)
   */
  async updateFeeModel(
    transferFee: number,
    mintFee: number,
    contentFee: string,
    platformShare: number,
    creatorShare: number,
    stakeholderShare: number
  ): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.updateFeeModel(
        transferFee,
        mintFee,
        contentFee,
        platformShare,
        creatorShare,
        stakeholderShare
      ).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error updating fee model:', error);
      return false;
    }
  }
  
  /**
   * Distribute accumulated fees to stakeholders
   */
  async distributeFees(): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.distributeFees().send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error distributing fees:', error);
      return false;
    }
  }
  
  /**
   * Update platform wallet address
   * @param newWallet Address of new platform wallet
   */
  async updatePlatformWallet(newWallet: string): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.updatePlatformWallet(newWallet).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error updating platform wallet:', error);
      return false;
    }
  }
  
  /**
   * Update community treasury address
   * @param newTreasury Address of new community treasury
   */
  async updateCommunityTreasury(newTreasury: string): Promise<boolean> {
    this.requireAccount();
    
    try {
      await this.contract.methods.updateCommunityTreasury(newTreasury).send({
        from: this.account
      });
      return true;
    } catch (error) {
      console.error('Error updating community treasury:', error);
      return false;
    }
  }
  
  // ==================== Helper Methods ====================
  
  /**
   * Ensure an account is connected before proceeding
   */
  private requireAccount(): void {
    if (!this.account) {
      throw new Error('No account connected. Call connect() first.');
    }
  }
  
  /**
   * Extract token ID from a transaction result
   * @param result Transaction result
   */
  private extractTokenIdFromResult(result: any): number {
    // This depends on how the event data is structured
    // Assuming TokenMinted event has a tokenId parameter
    if (result.events && result.events.TokenMinted) {
      return Number(result.events.TokenMinted.returnValues.tokenId);
    }
    throw new Error('Could not extract token ID from transaction result');
  }
  
  /**
   * Helper to create calldata for governance proposals
   * @param methodName The method name to call
   * @param methodParams The parameters for the method
   */
  createProposalCalldata(methodName: string, methodParams: any[]): string {
    // This would encode function calls for the executionData parameter in createProposal
    // Implementation depends on which web3 version you're using
    // For web3.js v1.x:
    const functionSignature = this.contract.methods[methodName](...methodParams).encodeABI();
    return functionSignature;
  }
}

export default PRXBlockchainClient;