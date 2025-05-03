/**
 * Type definitions for Project RED X
 */

/**
 * NetcodeSDK options interface
 */
interface NetcodeSDKOptions {
  /** Automatically connect on initialization */
  autoConnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum number of connection retry attempts */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Rate limit for message sending per second */
  messageLimitPerSecond?: number;
  /** Minimum time between position updates in milliseconds */
  positionUpdateInterval?: number;
  /** Custom server URL */
  url?: string;
}

/**
 * Event handler signature for NetcodeSDK events
 */
type EventHandler<T = any> = (data: T) => void;

/**
 * Peer information stored by NetcodeSDK
 */
interface Peer {
  id: string;
  x?: number;
  y?: number;
  [key: string]: any;
}

/**
 * Socket.io based networking SDK for Project RED X
 */
declare class NetcodeSDK {
  /**
   * Create a new NetcodeSDK instance
   * @param options Configuration options
   */
  constructor(options?: NetcodeSDKOptions);

  /**
   * Socket.io client instance
   */
  socket: any;

  /**
   * Connection status
   */
  connected: boolean;

  /**
   * Client ID assigned by the server
   */
  clientId: string | null;

  /**
   * Map of connected peers
   */
  peers: Map<string, Peer>;

  /**
   * Connect to the server
   * @returns Promise resolving to client ID when connected
   */
  connect(): Promise<string>;

  /**
   * Send a message to all connected clients with rate limiting
   * @param content Message content
   * @returns Success status
   */
  sendMessage(content: string | object): boolean;

  /**
   * Send position update with throttling
   * @param x X-coordinate
   * @param y Y-coordinate
   * @returns Success status
   */
  sendPosition(x: number, y: number): boolean;

  /**
   * Register event handler
   * @param event Event name
   * @param callback Callback function
   * @returns Function to remove the handler
   */
  on(event: string, callback: EventHandler): () => void;

  /**
   * Remove event handler
   * @param event Event name
   * @param callback Callback function to remove
   */
  off(event: string, callback: EventHandler): void;

  /**
   * Disconnect from the server
   */
  disconnect(): void;
}

/**
 * Link extractor module for Project RED X
 * Extracts links from .txt files and displays them in the application
 */
declare class LinkExtractor {
  /**
   * Create a new LinkExtractor
   * @param containerId ID of the container to display links in
   */
  constructor(containerId: string);

  /**
   * DOM element container
   */
  container: HTMLElement | null;

  /**
   * Loads and parses links from a .txt file
   * @param txtFilePath Path to the txt file containing HTML links
   */
  loadLinks(txtFilePath: string): Promise<void>;

  /**
   * Use fallback data if remote file can't be loaded
   */
  useFallbackData(): void;

  /**
   * Parse text content and extract HTML links
   * @param content Text content containing HTML links
   */
  parseAndDisplay(content: string): void;

  /**
   * Create a section with links
   * @param name Section name
   * @param content Section content
   */
  createSection(name: string, content: string): void;
}

/**
 * Key compression options
 */
interface KeyCompressorOptions {
  /** Password for encryption */
  password?: string;
}

/**
 * Utility class for compressing and encrypting private keys
 */
declare namespace KeyCompressor {
  /**
   * Compress and optionally encrypt a private key
   * @param privateKey The private key content to compress
   * @param password Optional password for encryption
   * @returns Compressed (and encrypted if password provided) key
   */
  function compress(privateKey: string | Buffer, password?: string | null): Promise<Buffer>;

  /**
   * Decompress and optionally decrypt a private key
   * @param compressedKey The compressed key data
   * @param password Password used for encryption (if encrypted)
   * @returns Original key content
   */
  function decompress(compressedKey: Buffer, password?: string | null): Promise<Buffer>;

  /**
   * Compress a private key file
   * @param inputPath Path to the input key file
   * @param outputPath Path to save the compressed key
   * @param password Optional password for encryption
   * @returns Path to the compressed file
   */
  function compressFile(inputPath: string, outputPath: string, password?: string | null): Promise<string>;

  /**
   * Decompress a private key file
   * @param inputPath Path to the compressed key file
   * @param outputPath Path to save the decompressed key
   * @param password Password used for encryption (if encrypted)
   * @returns Path to the decompressed file
   */
  function decompressFile(inputPath: string, outputPath: string, password?: string | null): Promise<string>;
}

/**
 * Windows connector configuration
 */
interface WindowsConnectorConfig {
  /** AWS region */
  region?: string;
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
  /** EC2 instance ID */
  instanceId?: string;
  /** Windows username */
  username?: string;
  /** Path to private key file */
  privateKeyPath?: string;
  /** Path to compressed key file */
  compressedKeyPath?: string;
  /** Password for compressed key */
  keyPassword?: string;
  /** Connection type ('rdp' or 'ssh') */
  connectionType?: 'rdp' | 'ssh';
  /** Connection port */
  port?: number;
}

/**
 * Windows instance connection result
 */
interface ConnectResult {
  /** Success status */
  success: boolean;
  /** Result message */
  message: string;
  /** Path to RDP file (for RDP connections) */
  rdpFilePath?: string;
  /** SSH connection (for SSH connections) */
  ssh?: any;
}

/**
 * Windows instance details
 */
interface InstanceDetails {
  InstanceId: string;
  InstanceType: string;
  State: { Name: string; Code: number };
  PublicIpAddress?: string;
  PrivateIpAddress?: string;
  Placement?: { AvailabilityZone: string };
  LaunchTime: string;
  [key: string]: any;
}

/**
 * Windows instance connector class for Project RED X
 */
declare class WindowsInstanceConnector {
  /**
   * Create a new WindowsInstanceConnector
   * @param config Configuration options
   */
  constructor(config?: WindowsConnectorConfig);

  /**
   * Configuration options
   */
  config: WindowsConnectorConfig;

  /**
   * Instance details
   */
  instanceDetails: InstanceDetails | null;

  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Log file path
   */
  logFilePath: string;

  /**
   * Get instance details
   * @returns Instance details object
   */
  getInstanceDetails(): Promise<InstanceDetails>;

  /**
   * Get Windows password
   * @returns Windows password
   */
  getWindowsPassword(): Promise<string>;

  /**
   * Connect to Windows via RDP
   * @returns Connection result
   */
  connectRDP(): Promise<ConnectResult>;

  /**
   * Connect to Windows via SSH
   * @returns Connection result
   */
  connectSSH(): Promise<ConnectResult>;

  /**
   * Connect to Windows instance
   * @returns Connection result
   */
  connect(): Promise<ConnectResult>;

  /**
   * Compress the currently configured private key
   * @param outputPath Where to save the compressed key
   * @param password Password to encrypt the key
   * @returns Path to the compressed key file
   */
  compressPrivateKey(outputPath: string, password: string): Promise<string>;
}

/**
 * Utility for compressing large blocks of symbols
 * Optimized for blocks of 500+ symbols in Project RED X
 */
declare class SymbolsDensifier {
  /**
   * Compresses a string using Run-Length Encoding (RLE)
   */
  static compressRLE(input: string): string;

  /**
   * Decompresses an RLE-compressed string
   */
  static decompressRLE(input: string): string;
  
  /**
   * Dictionary-based compression for symbol blocks
   */
  static compressDictionary(input: string): {
    dict: Record<string, number>;
    output: number[];
  };
  
  /**
   * Decompresses dictionary-compressed data
   */
  static decompressDictionary(
    dict: Record<string, number>,
    output: number[]
  ): string;

  /**
   * Compresses binary data to a Base64 string
   */
  static compressBinary(input: string): string;
  
  /**
   * Advanced symbol block densification with type detection
   * Automatically selects optimal compression for blocks of 500+ symbols
   */
  static densify(input: string | number[] | Record<string, any>): string;
  
  /**
   * Expands a densified symbol block back to its original form
   */
  static expand(input: string): string;

  /**
   * Memory-efficient batch processing for extremely large symbol blocks
   */
  static batchDensify(input: string, batchSize?: number): string;
}

// Global declarations
declare global {
  interface Window {
    NetcodeSDK: typeof NetcodeSDK;
    LinkExtractor: typeof LinkExtractor;
    Module: any;
    io: any;
  }
}
