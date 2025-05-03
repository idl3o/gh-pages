import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { StreamClient, createStreamClient, type StreamClientConfig } from '../../ts/src';
import contractService from '../services/ContractService';

// Default configuration - you'll want to update this with your actual API and RPC endpoints
const DEFAULT_CONFIG: StreamClientConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.prxblockchain.io',
  ipfsGateway: process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  rpcUrl: process.env.REACT_APP_RPC_URL,
  chainId: Number(process.env.REACT_APP_CHAIN_ID) || 1,
};

interface BlockchainContextType {
  client: StreamClient;
  contracts: typeof contractService;
  isConnected: boolean;
  connectedAddress: string | null;
  isConnecting: boolean;
  error: Error | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

interface BlockchainProviderProps {
  children: ReactNode;
  config?: StreamClientConfig;
}

export const BlockchainProvider = ({ 
  children, 
  config = DEFAULT_CONFIG 
}: BlockchainProviderProps) => {
  const [client] = useState<StreamClient>(() => createStreamClient(config));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [contracts] = useState(() => contractService);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const address = await client.connectWallet();
      
      // Initialize contract service with provider from client
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await contracts.initialize(provider);
      }
      
      setConnectedAddress(address);
      setIsConnected(true);
      return address;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error connecting wallet');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // SDK doesn't have a disconnect method, so we just clear the local state
    setConnectedAddress(null);
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (isConnected && accounts[0] !== connectedAddress) {
        // Account switched while connected
        try {
          await client.authenticate(accounts[0]);
          
          // Re-initialize contract service with new signer
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await contracts.initialize(provider);
          }
          
          setConnectedAddress(accounts[0]);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to authenticate new account'));
          disconnectWallet();
        }
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [client, contracts, isConnected, connectedAddress]);

  return (
    <BlockchainContext.Provider
      value={{
        client,
        contracts,
        isConnected,
        connectedAddress,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

// Add type declaration for ethereum in window object
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>;
      on: (event: string, handler: any) => void;
      removeListener: (event: string, handler: any) => void;
    };
  }
}