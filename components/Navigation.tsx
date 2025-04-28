import React, { useState } from 'react';

interface NavigationProps {
  activeSection?: string;
  className?: string;
  includeWallet?: boolean;
}

/**
 * Main navigation component for Project RED X
 * Provides consistent navigation across all pages
 */
export const Navigation: React.FC<NavigationProps> = ({
  activeSection = 'home',
  className = '',
  includeWallet = false
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Navigation sections
  const sections = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'blockchain', name: 'Blockchain', path: '/pages/blockchain/' },
    { id: 'streaming', name: 'Streaming', path: '/pages/streaming/' },
    { id: 'team', name: 'Team', path: '/pages/team/' },
    { id: 'docs', name: 'Documentation', path: '/docs/' },
    { id: 'creator', name: 'Creator Dashboard', path: '/pages/creator-dashboard.html' },
    { id: 'governance', name: 'Governance', path: '/pages/governance-visualization.html' }
  ];

  // Styles for the component
  const styles = {
    nav: {
      backgroundColor: '#2c3e50',
      color: 'white',
      width: '100%',
      padding: '1rem 0',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    logo: {
      fontWeight: 700,
      fontSize: '1.5rem',
      color: '#3498db',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center'
    },
    logoIcon: {
      marginRight: '0.5rem',
      fontSize: '1.8rem'
    },
    menu: {
      display: 'flex',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    menuItem: {
      margin: '0 1rem'
    },
    menuLink: {
      color: 'white',
      textDecoration: 'none',
      padding: '0.5rem',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    menuLinkActive: {
      color: '#3498db',
      fontWeight: 600
    },
    mobileMenuButton: {
      display: 'none',
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '1.5rem',
      cursor: 'pointer'
    },
    walletContainer: {
      marginLeft: '1rem'
    },
    // Mobile styles
    '@media (max-width: 768px)': {
      mobileMenuButton: {
        display: 'block'
      },
      menu: {
        display: mobileNavOpen ? 'flex' : 'none',
        flexDirection: 'column' as const,
        position: 'absolute' as const,
        top: '100%',
        left: 0,
        width: '100%',
        backgroundColor: '#2c3e50',
        padding: '1rem 0',
        boxShadow: '0 5px 10px rgba(0,0,0,0.2)'
      },
      menuItem: {
        margin: '0.5rem 1rem'
      }
    }
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <nav style={styles.nav} className={`project-redx-navigation ${className}`}>
      <div style={styles.container}>
        <a href="/" style={styles.logo}>
          <span style={styles.logoIcon}>🔴</span>
          PROJECT RED X
        </a>

        <button 
          style={styles.mobileMenuButton as React.CSSProperties} 
          onClick={toggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? '✕' : '☰'}
        </button>

        <ul style={styles.menu as React.CSSProperties}>
          {sections.map((section) => (
            <li key={section.id} style={styles.menuItem}>
              <a
                href={section.path}
                style={{
                  ...styles.menuLink,
                  ...(activeSection === section.id ? styles.menuLinkActive : {})
                }}
              >
                {section.name}
              </a>
            </li>
          ))}
          
          {includeWallet && (
            <li style={styles.walletContainer}>
              {/* This would import your WalletConnector component */}
              {/* <WalletConnector /> */}
              {/* 
                For now we'll just add a placeholder.
                Uncomment the import at the top and the component above when integrating
              */}
              <button
                style={{
                  backgroundColor: '#4361ee',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '50px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Connect Wallet
              </button>
            </li>
          )}
        </ul>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .project-redx-navigation ul {
            display: ${mobileNavOpen ? 'flex' : 'none'};
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: #2c3e50;
            padding: 1rem 0;
            box-shadow: 0 5px 10px rgba(0,0,0,0.2);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;