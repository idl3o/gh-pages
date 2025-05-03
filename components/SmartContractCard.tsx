/**
 * @fileoverview Smart contract card and section components for Web3 Streaming Service
 * @module SmartContractCard
 */

import React, { memo } from 'react';

/** Smart contract card properties */
interface SmartContractCardProps {
  /** Contract title */
  title: string;
  /** Contract description */
  description: string;
  /** URL to contract details page */
  linkUrl: string;
  /** Optional custom CSS class */
  className?: string;
}

/**
 * Card component displaying information about a smart contract
 * @param {SmartContractCardProps} props - Component properties
 * @returns {JSX.Element} Rendered contract card
 */
export const SmartContractCard: React.FC<SmartContractCardProps> = ({ 
  title, 
  description, 
  linkUrl,
  className = ''
}) => {
  // Styling constants
  const CARD_STYLES = {
    card: {
      padding: '1.25rem',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    title: {
      color: '#4361ee',
      marginBottom: '0.5rem',
      fontSize: '1.1rem',
      fontWeight: 'bold' as const
    },
    description: {
      fontSize: '0.9rem',
      marginBottom: '1rem'
    },
    link: { 
      display: 'inline-block', 
      marginTop: '0.8rem',
      color: '#4361ee', 
      fontWeight: 'bold' as const, 
      textDecoration: 'none' 
    }
  };

  return (
    <div 
      className={`contract-card ${className}`} 
      style={CARD_STYLES.card}
      data-contract-id={title.toLowerCase().replace(/\s+/g, '-')}
    >
      <h3 style={CARD_STYLES.title}>{title}</h3>
      <p style={CARD_STYLES.description}>{description}</p>
      {linkUrl && (
        <div className="contract-links">
          <a href={linkUrl} style={CARD_STYLES.link}>
            View details →
          </a>
        </div>
      )}
    </div>
  );
};

/** Props for the contract section component */
interface SmartContractSectionProps {
  /** Array of contracts to display */
  contracts: Array<{
    title: string;
    description: string;
    linkUrl: string;
  }>;
  /** Optional section heading */
  sectionTitle?: string;
  /** Optional section description */
  sectionDescription?: string;
}

/**
 * Section component displaying multiple smart contract cards
 * @param {SmartContractSectionProps} props - Component properties
 * @returns {JSX.Element} Rendered section with contract cards
 */
export const SmartContractSection: React.FC<SmartContractSectionProps> = ({ 
  contracts,
  sectionTitle = 'Powered by Smart Contracts',
  sectionDescription = 'Our platform is built on secure, audited smart contracts that enable transparent transactions and automated payments.'
}) => {
  return (
    <section style={{ margin: '5rem 0' }} data-section="smart-contracts">
      <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '2rem' }}>
        {sectionTitle}
      </h2>
      <p style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
        {sectionDescription}
      </p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {contracts.map((contract, index) => (
            <SmartContractCard 
              key={`contract-${index}`}
              title={contract.title}
              description={contract.description}
              linkUrl={contract.linkUrl}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a 
            href="docs/tech.contract-list" 
            style={{ 
              display: 'inline-block', 
              color: '#4361ee', 
              fontWeight: 'bold', 
              textDecoration: 'none' 
            }}
          >
            Explore all smart contracts →
          </a>
        </div>
      </div>
    </section>
  );
};

// Export the main card component as default
export default memo(SmartContractCard);
