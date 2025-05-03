/**
 * Navigation component bundle for use in HTML pages
 * This file is auto-generated from Navigation.tsx
 */

(function() {
  // Define the Navigation component
  const Navigation = function(props) {
    // Props with defaults
    const {
      activeSection = props.activeSection || 'home',
      className = props.className || '',
      includeWallet = props.includeWallet || false
    } = props;
    
    // State for mobile navigation
    const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

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
        position: 'sticky',
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
      // Mobile styles will be handled via media queries in the style tag
    };

    // Toggle mobile navigation
    const toggleMobileNav = () => {
      setMobileNavOpen(!mobileNavOpen);
    };

    return React.createElement(
      'nav', 
      { 
        style: styles.nav, 
        className: `project-redx-navigation ${className}`
      },
      [
        // Navigation container
        React.createElement(
          'div', 
          { 
            style: styles.container,
            key: 'nav-container'
          },
          [
            // Logo
            React.createElement(
              'a',
              {
                href: '/',
                style: styles.logo,
                key: 'nav-logo'
              },
              [
                React.createElement(
                  'span',
                  {
                    style: styles.logoIcon,
                    key: 'logo-icon'
                  },
                  '🔴'
                ),
                'PROJECT RED X'
              ]
            ),

            // Mobile menu toggle button
            React.createElement(
              'button',
              {
                style: styles.mobileMenuButton,
                onClick: toggleMobileNav,
                'aria-label': 'Toggle navigation menu',
                key: 'mobile-toggle'
              },
              mobileNavOpen ? '✕' : '☰'
            ),

            // Navigation links
            React.createElement(
              'ul',
              {
                style: Object.assign({}, styles.menu, mobileNavOpen && window.innerWidth <= 768 ? {
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  backgroundColor: '#2c3e50',
                  padding: '1rem 0',
                  boxShadow: '0 5px 10px rgba(0,0,0,0.2)'
                } : {}),
                key: 'nav-menu'
              },
              sections.map((section) => 
                React.createElement(
                  'li',
                  {
                    style: styles.menuItem,
                    key: `nav-item-${section.id}`
                  },
                  React.createElement(
                    'a',
                    {
                      href: section.path,
                      style: Object.assign(
                        {},
                        styles.menuLink,
                        activeSection === section.id ? styles.menuLinkActive : {}
                      )
                    },
                    section.name
                  )
                )
              ).concat(
                includeWallet ? 
                  React.createElement(
                    'li',
                    {
                      style: styles.walletContainer,
                      key: 'wallet-container'
                    },
                    React.createElement(
                      'button',
                      {
                        style: {
                          backgroundColor: '#4361ee',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '50px',
                          border: 'none',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }
                      },
                      'Connect Wallet'
                    )
                  ) : null
              )
            )
          ]
        ),
        
        // Style tag for mobile responsiveness
        React.createElement(
          'style',
          { key: 'nav-styles' },
          `
            @media (max-width: 768px) {
              .project-redx-navigation button[aria-label="Toggle navigation menu"] {
                display: block;
              }
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
              .project-redx-navigation ul li {
                margin: 0.5rem 1rem;
              }
            }
          `
        )
      ]
    );
  };

  // Register the component with the component loader
  if (window.componentLoader) {
    window.componentLoader.register('Navigation', Navigation);
    console.log('Navigation component registered successfully');
  } else {
    console.error('Component loader not found. Make sure to include component-loader.js before this script.');
  }
})();