import { useState } from 'react';
import useWallet from '../hooks/useWallet';
import TipCreator from '../components/transactions/TipCreator';
import styles from './WalletDemo.module.css';

const WalletDemo = () => {
  const { account, balance, chainId, connect, disconnect, formatAddress } = useWallet();
  const [testCreator, setTestCreator] = useState({
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // Example ETH address
    name: 'Test Creator'
  });

  // For transaction history demo
  const [transactions, setTransactions] = useState<Array<{hash: string, amount: string, timestamp: number}>>([]);

  const handleTipSuccess = (hash: string) => {
    // In a real app, this would be stored in a database or retrieved from the blockchain
    setTransactions(prevTransactions => [
      {
        hash,
        amount: '0.01', // This would be the actual amount from the transaction
        timestamp: Date.now()
      },
      ...prevTransactions
    ]);
  };

  return (
    <div className={styles.walletDemoPage}>
      <h1 className={styles.pageTitle}>Web3 Wallet Demo</h1>
      
      <div className={styles.infoBoxes}>
        <div className={styles.infoBox}>
          <h3>Wallet Status</h3>
          <div className={styles.statusDetails}>
            <p>
              <span className={styles.label}>Connection:</span>
              <span className={`${styles.statusBadge} ${account ? styles.connected : styles.disconnected}`}>
                {account ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            {account && (
              <>
                <p>
                  <span className={styles.label}>Address:</span>
                  <span className={styles.value}>{account}</span>
                </p>
                <p>
                  <span className={styles.label}>Balance:</span>
                  <span className={styles.value}>{parseFloat(balance).toFixed(4)} ETH</span>
                </p>
                <p>
                  <span className={styles.label}>Network ID:</span>
                  <span className={styles.value}>{chainId || 'Unknown'}</span>
                </p>
              </>
            )}
          </div>
          <div className={styles.walletActions}>
            {!account ? (
              <button 
                className={styles.connectButton} 
                onClick={connect}
              >
                Connect Wallet
              </button>
            ) : (
              <button 
                className={styles.disconnectButton} 
                onClick={disconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        <div className={styles.infoBox}>
          <h3>Transaction Demo</h3>
          <p className={styles.demoText}>
            Send a test tip to a creator address. This demonstrates how to send transactions from your connected wallet.
          </p>
          <div className={styles.setCreatorField}>
            <label htmlFor="creatorAddress">Test Creator Address:</label>
            <input
              id="creatorAddress"
              type="text"
              value={testCreator.address}
              onChange={(e) => setTestCreator({...testCreator, address: e.target.value})}
              className={styles.inputField}
            />
          </div>

          <div className={styles.tipDemo}>
            <TipCreator 
              creatorAddress={testCreator.address} 
              creatorName={testCreator.name}
              onTipSuccess={handleTipSuccess}
            />
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className={styles.transactionHistory}>
          <h3>Recent Transactions</h3>
          <table className={styles.transactionTable}>
            <thead>
              <tr>
                <th>Transaction Hash</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={index}>
                  <td className={styles.txHash}>{tx.hash}</td>
                  <td>{tx.amount} ETH</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.infoNote}>
        <h3>Important Note:</h3>
        <p>
          This is a demonstration interface. Real applications would validate inputs, 
          handle errors more gracefully, and include additional security measures.
          To use this demo, you'll need to have MetaMask or another Web3 wallet extension installed
          in your browser and be connected to a compatible network.
        </p>
      </div>
    </div>
  );
};

export default WalletDemo;