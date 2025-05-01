import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useBlockchain } from '../context/BlockchainContext';

const HomePage = () => {
  const { isConnected } = useBlockchain();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">PRX Blockchain</h1>
          <p className="hero-subtitle">
            A decentralized platform for content creators, powered by blockchain technology
          </p>
          <div className="hero-actions">
            {isConnected ? (
              <Link to="/dashboard" className="btn">
                Go to Dashboard
              </Link>
            ) : (
              <button className="btn">Connect Wallet</button>
            )}
            <Link to="/about" className="btn btn-outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="category-grid">
          <div className="category-box ts-sdk">
            <h3>
              <span className="icon">📱</span>
              TypeScript SDK
            </h3>
            <p>
              Access blockchain features with our powerful TypeScript SDK, 
              designed for web and mobile applications.
            </p>
            <ul>
              <li>Wallet integration</li>
              <li>IPFS content storage</li>
              <li>Smart contract interaction</li>
            </ul>
            <Link to="/docs/sdk">Explore SDK</Link>
          </div>
          <div className="category-box contracts">
            <h3>
              <span className="icon">📝</span>
              Smart Contracts
            </h3>
            <p>
              Secure and audited smart contracts for tokens, content management, 
              and governance features.
            </p>
            <ul>
              <li>ERC-20/ERC-721 tokens</li>
              <li>Content verification</li>
              <li>DAO governance</li>
            </ul>
            <Link to="/docs/contracts">View Contracts</Link>
          </div>
          <div className="category-box red-x">
            <h3>
              <span className="icon">⚡</span>
              RED X Backend
            </h3>
            <p>
              High-performance WASM backend powers content delivery and 
              processing with incredible speed.
            </p>
            <ul>
              <li>WebAssembly speed</li>
              <li>Content transformation</li>
              <li>Efficient processing</li>
            </ul>
            <Link to="/docs/red-x">RED X Details</Link>
          </div>
          <div className="category-box serverless">
            <h3>
              <span className="icon">☁️</span>
              Serverless Functions
            </h3>
            <p>
              Scale automatically with serverless backend functions for API 
              endpoints and processing.
            </p>
            <ul>
              <li>API endpoints</li>
              <li>Authentication</li>
              <li>Blockchain triggers</li>
            </ul>
            <Link to="/docs/serverless">Learn Serverless</Link>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="getting-started-section">
        <div className="card">
          <h2>Get Started in Minutes</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Connect Wallet</h3>
              <p>Link your Ethereum wallet to access the platform</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Create Profile</h3>
              <p>Set up your creator profile with details and links</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Upload Content</h3>
              <p>Securely store your content using IPFS technology</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Monetize</h3>
              <p>Set access controls and earning options for your content</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/dashboard" className="btn">Get Started Now</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;