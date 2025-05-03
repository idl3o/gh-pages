import { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

interface TokenTransferProps {
  className?: string;
}

const TokenTransfer = ({ className = '' }: TokenTransferProps) => {
  const { isConnected, contracts } = useBlockchain();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
  } | null>(null);

  // Fetch token info when component mounts
  useState(() => {
    const fetchTokenInfo = async () => {
      try {
        if (isConnected && contracts.isInitialized()) {
          const info = await contracts.getTokenInfo();
          setTokenInfo(info);
        }
      } catch (err) {
        console.error('Error fetching token info:', err);
      }
    };

    fetchTokenInfo();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!recipient) {
      setError('Please enter a recipient address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setTxHash(null);
    
    try {
      const tx = await contracts.transferTokens(recipient, amount);
      setTxHash(tx.hash);
      
      // Reset form
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transfer tokens');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isConnected) {
    return null;
  }

  return (
    <div className={`token-transfer-card ${className}`}>
      <h3>Send {tokenInfo?.symbol || 'PRX'} Tokens</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {txHash && (
        <div className="success-message">
          <p>Transaction submitted!</p>
          <a 
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="tx-link"
          >
            View on Etherscan
          </a>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipient" className="form-label">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            className="form-control"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Amount
          </label>
          <div className="amount-input-container">
            <input
              type="number"
              id="amount"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              disabled={isSubmitting}
              required
            />
            <span className="token-symbol-badge">
              {tokenInfo?.symbol || 'PRX'}
            </span>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Tokens'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TokenTransfer;