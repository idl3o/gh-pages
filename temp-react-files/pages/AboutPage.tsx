import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <Layout>
      <section className="about-section">
        <h1>About PRX Blockchain</h1>
        
        <div className="card mb-4">
          <h2>Our Mission</h2>
          <p>
            PRX Blockchain aims to revolutionize the way content creators interact with their audience by leveraging the power of blockchain technology. We're building a decentralized platform that enables direct creator-to-consumer relationships without intermediaries, ensuring fair compensation and transparent ownership.
          </p>
        </div>
        
        <div className="card mb-4">
          <h2>Technology Stack</h2>
          
          <div className="tech-stack">
            <div className="tech-item">
              <h3>TypeScript SDK</h3>
              <p>Our core TypeScript SDK provides a seamless experience for developers to interact with the PRX blockchain, with comprehensive support for wallet integration, content management, and token operations.</p>
            </div>
            
            <div className="tech-item">
              <h3>Smart Contracts</h3>
              <p>Secure smart contracts built on Ethereum provide the foundation for our tokenomics, content rights management, and governance system. All contracts are thoroughly audited and optimized for gas efficiency.</p>
            </div>
            
            <div className="tech-item">
              <h3>RED X Backend</h3>
              <p>Our high-performance WebAssembly backend delivers lightning-fast content processing and transformation capabilities, ensuring the platform remains responsive even under high load.</p>
            </div>
            
            <div className="tech-item">
              <h3>Serverless Functions</h3>
              <p>Scalable serverless architecture enables efficient API endpoints and background processing tasks, with automatic scaling to meet demand.</p>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <h2>Roadmap</h2>
          
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker">Q2 2025</div>
              <div className="timeline-content">
                <h3>Core Platform Launch</h3>
                <p>Initial release with content uploading, wallet integration, and basic token functionality</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-marker">Q3 2025</div>
              <div className="timeline-content">
                <h3>Advanced Features</h3>
                <p>Marketplace integration, subscription models, and expanded content types</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-marker">Q4 2025</div>
              <div className="timeline-content">
                <h3>Mobile Applications</h3>
                <p>Release of iOS and Android applications with native integration</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-marker">Q1 2026</div>
              <div className="timeline-content">
                <h3>DAO Governance</h3>
                <p>Introduction of decentralized governance for platform decisions</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2>Team</h2>
          
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">JS</div>
              <h3 className="member-name">Jane Smith</h3>
              <div className="member-role">Founder & CEO</div>
              <p className="member-bio">Blockchain advocate with 10+ years in tech leadership</p>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">JD</div>
              <h3 className="member-name">John Doe</h3>
              <div className="member-role">CTO</div>
              <p className="member-bio">Smart contract expert and full-stack developer</p>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">AR</div>
              <h3 className="member-name">Alice Roberts</h3>
              <div className="member-role">Head of Product</div>
              <p className="member-bio">Product strategist focused on user experience</p>
            </div>
            
            <div className="team-member">
              <div className="member-avatar">MJ</div>
              <h3 className="member-name">Michael Johnson</h3>
              <div className="member-role">Lead Developer</div>
              <p className="member-bio">TypeScript and WebAssembly specialist</p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <Link to="/dashboard" className="btn">Explore the Platform</Link>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;