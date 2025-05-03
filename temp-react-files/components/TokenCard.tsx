import React, { useState } from 'react';
import { TokenData } from '../services/ContractsService';

interface TokenCardProps {
  token: TokenData;
  onAccessContent: (tokenId: number) => Promise<string>;
  onLinkToken: (tokenId1: number, tokenId2: number) => Promise<boolean>;
  compact?: boolean;
}

const TokenCard: React.FC<TokenCardProps> = ({ 
  token, 
  onAccessContent, 
  onLinkToken, 
  compact = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [linkTokenId, setLinkTokenId] = useState<string>('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);

  const handleAccessContent = async () => {
    try {
      setIsLoading(true);
      setAccessStatus('Accessing private content...');
      const contentUri = await onAccessContent(token.id);
      setAccessStatus(`Content accessed: ${contentUri}`);
      setIsLoading(false);
    } catch (error) {
      setAccessStatus('Failed to access content. You may not have permission.');
      setIsLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const targetTokenId = parseInt(linkTokenId);
      if (isNaN(targetTokenId)) {
        throw new Error('Invalid token ID');
      }
      
      const success = await onLinkToken(token.id, targetTokenId);
      setIsLoading(false);
      setShowLinkForm(false);
      setLinkTokenId('');
      
      if (!success) {
        throw new Error('Failed to link tokens');
      }
    } catch (error) {
      console.error('Error linking tokens:', error);
      setIsLoading(false);
    }
  };

  // Render a compact version of the card for grid views
  if (compact) {
    return (
      <div className="token-card compact">
        <h3>Token #{token.id}</h3>
        <div className="token-preview">
          {token.thumbnailUrl ? (
            <img src={token.thumbnailUrl} alt={`Token #${token.id}`} />
          ) : (
            <div className="placeholder">No Preview</div>
          )}
        </div>
        <div className="token-info">
          <p className="token-type">{token.contentType}</p>
          {token.isPrivate && <span className="private-badge">Private</span>}
        </div>
      </div>
    );
  }

  // Render full token card
  return (
    <div className="token-card">
      <h2>Token #{token.id}</h2>
      
      <div className="token-content">
        <div className="token-preview">
          {token.thumbnailUrl ? (
            <img src={token.thumbnailUrl} alt={`Token #${token.id}`} />
          ) : (
            <div className="placeholder">No Preview</div>
          )}
        </div>
        
        <div className="token-details">
          <p><strong>Owner:</strong> {token.owner}</p>
          <p><strong>Content Type:</strong> {token.contentType}</p>
          <p><strong>Created:</strong> {new Date(token.createdAt).toLocaleString()}</p>
          
          {token.isPrivate ? (
            <div className="private-content">
              <p><span className="private-badge">Private Content</span></p>
              {token.hasAccess ? (
                <div className="content-access">
                  <p><strong>Content URI:</strong> {token.contentURI}</p>
                </div>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={handleAccessContent}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Access Content (0.01 ETH)'}
                </button>
              )}
              {accessStatus && <p className="access-status">{accessStatus}</p>}
            </div>
          ) : (
            <p><strong>Content URI:</strong> {token.contentURI}</p>
          )}
          
          <div className="token-links">
            <h4>Linked Tokens:</h4>
            {token.linkedTokens && token.linkedTokens.length > 0 ? (
              <ul>
                {token.linkedTokens.map(linkedId => (
                  <li key={linkedId}>Token #{linkedId}</li>
                ))}
              </ul>
            ) : (
              <p>No linked tokens</p>
            )}
            
            {showLinkForm ? (
              <form onSubmit={handleLinkSubmit} className="link-form">
                <input
                  type="text"
                  placeholder="Enter token ID to link"
                  value={linkTokenId}
                  onChange={(e) => setLinkTokenId(e.target.value)}
                  disabled={isLoading}
                />
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Link'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowLinkForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button 
                className="btn btn-outline" 
                onClick={() => setShowLinkForm(true)}
              >
                Link Another Token
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;