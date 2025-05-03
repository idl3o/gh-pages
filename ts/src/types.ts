/**
 * Types for Web3 Crypto Streaming Service SDK
 */

export interface AuthResponse {
  token: string;
  userId: string;
  expiresAt?: number;
}

export interface NonceResponse {
  nonce: string;
  expiresAt?: number;
}

export interface IPFSResponse {
  cid: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface CreatorProfile {
  name: string;
  email: string;
  bio: string;
  category: string;
  walletAddress: string;
  registrationDate: string;
  profileImageCid?: string;
  profileImageUrl?: string;
  socialLinks?: Record<string, string>;
  stats?: CreatorStats;
}

export interface CreatorStats {
  followers: number;
  contentCount: number;
  totalViews: number;
  totalEarnings: string;
}

export interface CreatorRegistrationRequest {
  name: string;
  email: string;
  bio: string;
  category: string;
  profileImageCid?: string;
  socialLinks?: Record<string, string>;
}

export interface ContentMetadata {
  title: string;
  description: string;
  creatorAddress: string;
  contentType: string;
  duration?: number;
  thumbnailCid?: string;
  contentCid: string;
  tags?: string[];
  price?: string;
  accessType: 'free' | 'paid' | 'subscription';
  createdAt: string;
  updatedAt?: string;
}

export interface StreamClientConfig {
  apiUrl: string;
  ipfsGateway?: string;
  chainId?: number;
  rpcUrl?: string;
}

export enum ChainId {
  ETHEREUM_MAINNET = 1,
  ETHEREUM_GOERLI = 5,
  POLYGON_MAINNET = 137,
  POLYGON_MUMBAI = 80001
}

export interface TokenDetails {
  balance: string;
  formattedBalance: string;
  symbol: string;
  name: string;
  decimals: number;
}
