import { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

interface WalletConnectProps {
  buttonClassName?: string;
}

const WalletConnect = ({ buttonClassName = 'btn' }: WalletConnectProps) => {
  const { connectWallet, disconnectWallet, isConnected, connectedAddress, isConnecting, error } = useBlockchain();
  const [showDetails, setShowDetails] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDetails(false);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!isConnected) {
    return (
      <div className="wallet-connect">
        <button 
          className={`${buttonClassName} ${isConnecting ? 'connecting' : ''}`} 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {error && (
          <div className="wallet-error">
            {error.message}
          </div>
        )}
      </div>
    );
  }

  // Wallet connected state
  return (
    <div className="wallet-connect connected">
      <div className="wallet-info" onClick={toggleDetails}>
        <div className="wallet-address">
          {connectedAddress?.substring(0, 6)}...{connectedAddress?.substring(connectedAddress.length - 4)}
        </div>
        <div className="wallet-status">
          <span className="dot connected"></span>
        </div>
      </div>
      
      {showDetails && (
        <div className="wallet-details">
          <div className="wallet-address-full">
            <span>Address:</span> {connectedAddress}
          </div>
          <button 
            className="btn-outline wallet-disconnect" 
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;