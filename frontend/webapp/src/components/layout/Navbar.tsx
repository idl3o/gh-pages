import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useWallet } from '../../hooks/useWallet';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { account, balance, connect, disconnect, formatAddress } = useWallet();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Link to="/" className={styles.logo}>
          Web3Stream
        </Link>
      </div>
      
      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="Search streams, creators, or tags..."
          className={styles.searchInput}
        />
        <button className={styles.searchButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      <div className={styles.menuIconContainer}>
        <button className={styles.menuButton} onClick={toggleMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={`${styles.navLinks} ${isMenuOpen ? styles.active : ''}`}>
        <Link to="/explore" className={styles.navLink}>Explore</Link>
        <Link to="/live" className={styles.navLink}>Live</Link>
        <Link to="/creators" className={styles.navLink}>Creators</Link>
        <Link to="/wallet-demo" className={styles.navLink}>Wallet Demo</Link>
        
        {account ? (
          <div className={styles.accountInfo}>
            <div className={styles.accountDetails}>
              <span className={styles.address}>
                {formatAddress(account)}
              </span>
              <span className={styles.balance}>
                {parseFloat(balance).toFixed(4)} ETH
              </span>
            </div>
            <button className={styles.walletButton} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className={styles.walletButton} onClick={connect}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;