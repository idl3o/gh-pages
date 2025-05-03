import React, { useState, useEffect } from 'react';
import { web3Service } from '../services/Web3Service';

interface WalletConnectorProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

/**
 * Component for connecting to Web3 wallets like MetaMask
 */
export const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Styles for the component
  const styles = {
    button: {
      backgroundColor: connected ? '#27ae60' : '#4361ee',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '50px',
      border: 'none',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },
    connectedAddress: {
      fontSize: '0.8rem',
      opacity: 0.8,
      marginTop: '5px'
    },
    icon: {
      marginRight: '10px'
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '0.8rem',
      marginTop: '5px'
    },
    loader: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '50%',
      borderTopColor: 'white',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '10px'
    }
  };

  // Connect wallet handler
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await web3Service.initialize();
      
      if (success) {
        const userAddress = await web3Service.getAccount();
        setAddress(userAddress);
        setConnected(true);
        
        if (onConnect) {
          onConnect(userAddress);
        }
      } else {
        setError("Failed to connect wallet");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Unknown error connecting wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet handler
  const disconnectWallet = () => {
    setAddress(null);
    setConnected(false);
    
    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Format address for display
  const formatAddress = (addr: string): string => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Add wallet change listener
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0]);
          if (onConnect) {
            onConnect(accounts[0]);
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup listener on component unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [address, onConnect]);

  return (
    <div className={`wallet-connector ${className}`}>
      <button
        style={styles.button as React.CSSProperties}
        onClick={connected ? disconnectWallet : connectWallet}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span style={styles.loader as React.CSSProperties}></span>
            Connecting...
          </>
        ) : connected ? (
          <>
            <span style={styles.icon}>🔒</span>
            Connected
          </>
        ) : (
          <>
            <span style={styles.icon}>🦊</span>
            Connect Wallet
          </>
        )}
      </button>
      
      {connected && address && (
        <div style={styles.connectedAddress}>
          {formatAddress(address)}
        </div>
      )}
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WalletConnector;
