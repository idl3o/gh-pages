import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { TokenData } from '../services/ContractsService';
import TokenCard from './TokenCard';
import CreateTokenForm from './CreateTokenForm';

interface TokenHubProps {
  tokenId?: number;
}

const TokenHub: React.FC<TokenHubProps> = ({ tokenId }) => {
  const { contractsService } = useBlockchain();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [currentToken, setCurrentToken] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mintPrice, setMintPrice] = useState<string>('0.05');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load a specific token if ID is provided
  useEffect(() => {
    if (tokenId !== undefined && contractsService.isInitialized()) {
      loadToken(tokenId);
    }
  }, [tokenId, contractsService]);

  // Load sample tokens for demonstration
  useEffect(() => {
    if (contractsService.isInitialized()) {
      loadSampleTokens();
      loadMintPrice();
    }
  }, [contractsService]);

  const loadToken = async (id: number) => {
    try {
      setIsLoading(true);
      const token = await contractsService.getTokenData(id);
      setCurrentToken(token);
      setIsLoading(false);
    } catch (error) {
      console.error(`Error loading token ${id}:`, error);
      setIsLoading(false);
    }
  };

  const loadSampleTokens = async () => {
    try {
      setIsLoading(true);
      // In a real app, we'd fetch the user's tokens or recent tokens
      // For now, we'll create some sample tokens for demonstration
      const sampleTokens = [];
      for (let i = 10001; i < 10006; i++) {
        const token = await contractsService.getTokenData(i);
        sampleTokens.push(token);
      }
      setTokens(sampleTokens);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sample tokens:', error);
      setIsLoading(false);
    }
  };

  const loadMintPrice = async () => {
    try {
      const price = await contractsService.getMintPrice();
      setMintPrice(price);
    } catch (error) {
      console.error('Error loading mint price:', error);
    }
  };

  const handleMintToken = async (
    metadata: string,
    contentURI: string,
    contentType: string,
    isPrivate: boolean,
    contentHash: string
  ) => {
    try {
      setIsLoading(true);
      const newTokenId = await contractsService.mintTokenWithContent(
        metadata,
        contentURI,
        contentType,
        isPrivate,
        contentHash,
        mintPrice
      );
      
      // Load the new token
      const newToken = await contractsService.getTokenData(newTokenId);
      
      // Add to our list of tokens
      setTokens(prevTokens => [newToken, ...prevTokens]);
      setCurrentToken(newToken);
      setShowCreateForm(false);
      setIsLoading(false);
      
      return newTokenId;
    } catch (error) {
      console.error('Error minting token:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleAccessContent = async (tokenId: number) => {
    try {
      setIsLoading(true);
      // Assume a fixed access fee for now
      const accessFee = '0.01';
      const contentURI = await contractsService.accessPrivateContent(tokenId, accessFee);
      
      // In a real app, you'd handle the retrieved content accordingly
      console.log(`Content URI for token ${tokenId}: ${contentURI}`);
      
      // Update the current token data to reflect changes
      if (currentToken && currentToken.id === tokenId) {
        const updatedToken = await contractsService.getTokenData(tokenId);
        setCurrentToken(updatedToken);
      }
      
      setIsLoading(false);
      return contentURI;
    } catch (error) {
      console.error(`Error accessing content for token ${tokenId}:`, error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleLinkTokens = async (tokenId1: number, tokenId2: number) => {
    try {
      setIsLoading(true);
      const success = await contractsService.linkTokens(tokenId1, tokenId2);
      
      if (success) {
        // Update the token data to reflect the new link
        const updatedToken = await contractsService.getTokenData(tokenId1);
        
        // Update tokens list and current token if needed
        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === tokenId1 ? updatedToken : token
          )
        );
        
        if (currentToken && currentToken.id === tokenId1) {
          setCurrentToken(updatedToken);
        }
      }
      
      setIsLoading(false);
      return success;
    } catch (error) {
      console.error(`Error linking tokens ${tokenId1} and ${tokenId2}:`, error);
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <div className="token-hub">
      {isLoading ? (
        <div className="loading">Loading tokens...</div>
      ) : (
        <>
          {showCreateForm ? (
            <div className="create-token-container">
              <h2>Create New PRX Token</h2>
              <p>Current mint price: {mintPrice} ETH</p>
              <CreateTokenForm 
                onSubmit={handleMintToken} 
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          ) : (
            <button 
              className="btn btn-primary create-token-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Token
            </button>
          )}
          
          {currentToken ? (
            <div className="single-token-view">
              <TokenCard 
                token={currentToken}
                onAccessContent={handleAccessContent}
                onLinkToken={handleLinkTokens}
              />
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentToken(null)}
              >
                Back to All Tokens
              </button>
            </div>
          ) : (
            <div className="tokens-grid">
              {tokens.map(token => (
                <div key={token.id} className="token-card-container" onClick={() => setCurrentToken(token)}>
                  <TokenCard 
                    token={token} 
                    onAccessContent={handleAccessContent}
                    onLinkToken={handleLinkTokens}
                    compact={true}
                  />
                </div>
              ))}
              {tokens.length === 0 && (
                <div className="no-tokens">
                  No tokens found. Create a new token to get started!
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TokenHub;