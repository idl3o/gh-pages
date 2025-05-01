import { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { TokenDetails } from '../../ts/src/types';

interface TokenBalanceProps {
  className?: string;
}

const TokenBalance = ({ className = '' }: TokenBalanceProps) => {
  const { client, isConnected, connectedAddress } = useBlockchain();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !connectedAddress) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const details = await client.getTokenBalance();
        setTokenDetails(details);
      } catch (err) {
        console.error('Error fetching token balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to load token balance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [client, isConnected, connectedAddress]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`token-balance-card ${className}`}>
      <h3>Token Balance</h3>
      
      {isLoading ? (
        <div className="loading-spinner">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : tokenDetails ? (
        <div className="token-details">
          <div className="token-value">
            <span className="token-amount">{tokenDetails.balance}</span>
            <span className="token-symbol">{tokenDetails.symbol}</span>
          </div>
          
          <div className="token-info">
            <div className="token-info-row">
              <span className="token-label">Name:</span>
              <span className="token-data">{tokenDetails.name}</span>
            </div>
            <div className="token-info-row">
              <span className="token-label">Contract:</span>
              <span className="token-data token-address">
                {tokenDetails.contractAddress.substring(0, 6)}...
                {tokenDetails.contractAddress.substring(tokenDetails.contractAddress.length - 4)}
              </span>
            </div>
            {tokenDetails.usdValue !== undefined && (
              <div className="token-info-row">
                <span className="token-label">USD Value:</span>
                <span className="token-data">${tokenDetails.usdValue.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>No token balance information available.</p>
      )}
    </div>
  );
};

export default TokenBalance;