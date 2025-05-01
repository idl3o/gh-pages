import { Link } from 'react-router-dom';

interface FooterProps {
  companyName?: string;
}

const Footer = ({ companyName = "PRX Blockchain" }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{companyName}</h3>
            <p className="footer-description">
              A decentralized blockchain application integrating TypeScript SDK, Smart Contracts, and serverless functions.
            </p>
            <div className="social-links">
              <a href="https://github.com/yourusername/react-webapp" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Products</h4>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/roadmap">Roadmap</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/docs">Documentation</Link></li>
              <li><Link to="/api">API</Link></li>
              <li><Link to="/help">Help Center</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;