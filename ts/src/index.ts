import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import type {
  StreamClientConfig,
  AuthResponse,
  NonceResponse,
  CreatorProfile,
  CreatorRegistrationRequest,
  IPFSResponse,
  ContentMetadata,
  TokenDetails
} from './types';

export * from './types';

/**
 * Web3 Crypto Streaming Service Client SDK
 * Provides TypeScript/JavaScript integration with the streaming platform
 * 
 * INTERNAL DOCUMENTATION:
 * Core TypeScript SDK implementing all platform APIs. Designed for:
 * - Browser dApps (with wallet integration)
 * - Node.js backend services
 * - React Native mobile applications
 * 
 * ARCHITECTURE:
 * - Uses Axios for HTTP with interceptors for auth
 * - Ethers.js for all blockchain interactions
 * - Promise-based async API throughout
 * - Comprehensive TypeScript typing
 */
export class StreamClient {
  private readonly apiUrl: string;
  private readonly ipfsGateway: string;
  private readonly http: AxiosInstance;
  private provider?: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private accessToken?: string;
  
  /**
   * Creates a new instance of the StreamClient
   * 
   * INTERNAL: Main constructor handling all initialization
   * CONFIG MANAGEMENT: Normalizes URLs and configures defaults
   * ENVIRONMENT DETECTION: Auto-detects browser vs Node.js
   * 
   * @param config Client configuration settings
   */
  constructor(config: StreamClientConfig) {
    this.apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    this.ipfsGateway = config.ipfsGateway || 'https://ipfs.io/ipfs/';
    
    this.http = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Setup Ethereum provider if RPC URL is provided
    if (config.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId || 1);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      // Browser environment with MetaMask or other injected provider
      this.provider = new ethers.BrowserProvider(window.ethereum, config.chainId || 1);
    }
    
    // Add authentication interceptor
    this.http.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }
  
  /**
   * Sets up the connection to a web3 provider
   * 
   * INTERNAL: Provider initialization and validation
   * BROWSER INTEGRATION: Handles injected providers like MetaMask
   * ERROR HANDLING: Explicit errors for missing providers
   * 
   * @returns The current provider
   */
  async connectProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
    if (!this.provider) {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error('No Ethereum provider available. Please install MetaMask or pass an RPC URL.');
      }
    }
    
    return this.provider;
  }
  
  /**
   * Connects a wallet and authenticates with the platform
   * @returns The authenticated account address
   */
  async connectWallet(): Promise<string> {
    const provider = await this.connectProvider();
    
    if (provider instanceof ethers.BrowserProvider) {
      // This will prompt the user to connect if using a browser wallet
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('User rejected the connection request');
      }
      
      this.signer = await provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Now authenticate with the platform
      await this.authenticate(address);
      
      return address;
    } else {
      throw new Error('Cannot connect wallet without a browser provider');
    }
  }
  
  /**
   * Authenticates with the platform using wallet signature
   * 
   * INTERNAL: Implements secure authentication without exposing private keys
   * UX FLOW: Should be called after wallet connection
   * SECURITY: Uses standard EIP-191 personal sign for authentication
   * 
   * @param address The wallet address
   * @returns Authentication success status
   */
  async authenticate(address: string): Promise<boolean> {
    try {
      // Get nonce from the server
      const nonceResponse = await this.http.get<NonceResponse>(`/auth/nonce?address=${address}`);
      const nonce = nonceResponse.data.nonce;
      
      if (!this.signer) {
        throw new Error('Wallet not connected. Call connectWallet first.');
      }
      
      // Sign the nonce
      const message = `Sign this message to authenticate with Web3 Streaming Service: ${nonce}`;
      const signature = await this.signer.signMessage(message);
      
      // Send signature to server
      const authResponse = await this.http.post<AuthResponse>('/auth', {
        address: address,
        nonce: nonce,
        signature: signature
      });
      
      if (authResponse.data.token) {
        this.accessToken = authResponse.data.token;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gets the profile for a creator by wallet address
   * @param address The wallet address
   * @returns Creator profile data
   */
  async getProfile(address: string): Promise<CreatorProfile | null> {
    try {
      const response = await this.http.get<CreatorProfile>(`/creators/${address}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // Profile not found
      }
      console.error('Failed to fetch profile:', error);
      throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Uploads content to IPFS
   * 
   * INTERNAL: Handles file upload with progress tracking
   * PERFORMANCE: Streams data to minimize memory usage
   * FLEXIBILITY: Works with File in browser or Blob in any environment
   * 
   * @param file The file to upload
   * @param onProgress Progress callback
   * @returns IPFS response with CID
   */
  async uploadToIPFS(file: File | Blob, onProgress?: (progress: number) => void): Promise<IPFSResponse> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call connectWallet first.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await this.http.post<IPFSResponse>('/ipfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Uploads metadata as JSON to IPFS
   * @param metadata The metadata object to store on IPFS
   * @returns IPFS response with CID
   */
  async uploadMetadataToIPFS(metadata: Record<string, any>): Promise<IPFSResponse> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call connectWallet first.');
    }
    
    try {
      const response = await this.http.post<IPFSResponse>('/ipfs/upload/json', metadata);
      return response.data;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error(`Metadata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Registers a new creator
   * @param request Creator registration data
   * @returns Success status
   */
  async registerCreator(request: CreatorRegistrationRequest): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call connectWallet first.');
    }
    
    try {
      await this.http.post('/creators/register', request);
      return true;
    } catch (error) {
      console.error('Creator registration failed:', error);
      throw new Error(`Creator registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Publishes content with metadata to the platform
   * @param metadata Content metadata
   * @returns Content ID
   */
  async publishContent(metadata: ContentMetadata): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call connectWallet first.');
    }
    
    try {
      const response = await this.http.post<{ contentId: string }>('/content/publish', metadata);
      return response.data.contentId;
    } catch (error) {
      console.error('Content publishing failed:', error);
      throw new Error(`Content publishing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gets token balance for the connected wallet
   * @returns Token balance details
   */
  async getTokenBalance(): Promise<TokenDetails> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Call connectWallet first.');
    }
    
    try {
      const address = await this.signer.getAddress();
      const response = await this.http.get<TokenDetails>(`/token/balance/${address}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gets a public URL for IPFS content
   * @param cid Content identifier
   * @returns Public gateway URL
   */
  getIPFSUrl(cid: string): string {
    return `${this.ipfsGateway}${cid}`;
  }
  
  /**
   * Updates the access token manually
   * @param token JWT token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }
}

/**
 * Factory function for creating a StreamClient instance
 * 
 * INTERNAL: Convenience function for cleaner imports and instantiation
 * PATTERN: Factory pattern for consistent client creation
 * 
 * @param config Client configuration settings
 * @returns A configured StreamClient instance
 */
export function createStreamClient(config: StreamClientConfig): StreamClient {
  return new StreamClient(config);
}
