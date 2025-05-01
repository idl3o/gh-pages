import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';

interface HeaderProps {
  title?: string;
}

const Header = ({ title = "PRX Blockchain" }: HeaderProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="container header-container">
        <div className="header-left">
          <h1 className="header-title">
            <Link to="/">{title}</Link>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <ul className="nav-list">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard" 
                className={location.pathname === '/dashboard' ? 'active' : ''}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className={location.pathname === '/about' ? 'active' : ''}
              >
                About
              </Link>
            </li>
          </ul>
        </nav>

        {/* Wallet Connect Component */}
        <div className="header-actions">
          <WalletConnect />
        </div>

        {/* Mobile Navigation Toggle */}
        <button 
          className="mobile-menu-button" 
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="mobile-menu-header">
            <button 
              className="close-menu" 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <ul className="mobile-nav-list">
            <li>
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={location.pathname === '/' ? 'active' : ''}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className={location.pathname === '/dashboard' ? 'active' : ''}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className={location.pathname === '/about' ? 'active' : ''}
              >
                About
              </Link>
            </li>
            {/* Wallet connect in mobile menu */}
            <li className="mobile-wallet-connect">
              <WalletConnect buttonClassName="btn btn-outline" />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;