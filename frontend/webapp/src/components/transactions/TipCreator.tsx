import { useState } from 'react';
import useWallet from '../../hooks/useWallet';
import styles from './TipCreator.module.css';

interface TipCreatorProps {
  creatorAddress: string;
  creatorName: string;
  onTipSuccess?: (hash: string) => void;
}

const TipCreator: React.FC<TipCreatorProps> = ({ 
  creatorAddress, 
  creatorName, 
  onTipSuccess 
}) => {
  const { isConnected, address, balance, connectWallet, sendTransaction, error } = useWallet();
  
  const [amount, setAmount] = useState<string>('0.01');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const predefinedAmounts = ['0.001', '0.01', '0.05', '0.1'];
  
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setLocalError(null);
  };
  
  const handleSelectAmount = (selectedAmount: string) => {
    setAmount(selectedAmount);
    setLocalError(null);
  };
  
  const handleSendTip = async () => {
    if (!isConnected || !address) {
      setLocalError('Please connect your wallet first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }
    
    try {
      setIsProcessing(true);
      setLocalError(null);
      
      const tx = await sendTransaction(creatorAddress, amount);
      setTransactionHash(tx.hash);
      
      if (onTipSuccess) {
        onTipSuccess(tx.hash);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setLocalError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={styles.tipCreator}>
      <h3 className={styles.title}>Support {creatorName}</h3>
      
      {!isConnected ? (
        <div className={styles.connectWallet}>
          <p className={styles.connectMessage}>Connect your wallet to support this creator</p>
          <button className={styles.connectButton} onClick={handleConnectWallet}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className={styles.tipForm}>
          <div className={styles.walletInfo}>
            <div className={styles.addressDisplay}>
              Connected: {shortenAddress(address || '')}
            </div>
            <div className={styles.balanceDisplay}>
              Balance: {parseFloat(balance || '0').toFixed(4)} ETH
            </div>
          </div>
          
          <div className={styles.amountSelector}>
            <div className={styles.predefinedAmounts}>
              {predefinedAmounts.map((predefinedAmount) => (
                <button
                  key={predefinedAmount}
                  className={`${styles.amountButton} ${amount === predefinedAmount ? styles.selected : ''}`}
                  onClick={() => handleSelectAmount(predefinedAmount)}
                >
                  {predefinedAmount} ETH
                </button>
              ))}
            </div>
            
            <div className={styles.customAmount}>
              <label htmlFor="customAmount" className={styles.label}>Custom Amount:</label>
              <input
                id="customAmount"
                type="number"
                className={styles.amountInput}
                value={amount}
                onChange={handleAmountChange}
                min="0.0001"
                step="0.001"
              />
              <span className={styles.ethLabel}>ETH</span>
            </div>
          </div>
          
          <button 
            className={styles.tipButton}
            onClick={handleSendTip}
            disabled={isProcessing || !isConnected}
          >
            {isProcessing ? 'Processing...' : 'Send Tip'}
          </button>
          
          {(localError || error) && (
            <div className={styles.errorMessage}>
              {localError || error}
            </div>
          )}
          
          {transactionHash && (
            <div className={styles.successMessage}>
              Transaction sent! 
              <a 
                href={`https://etherscan.io/tx/${transactionHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                View on Etherscan
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TipCreator;