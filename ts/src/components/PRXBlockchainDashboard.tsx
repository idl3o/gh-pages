import React, { useState, useEffect } from 'react';
import PRXBlockchainClient from '../PRXBlockchainClient';

// Mock ABI for demo purposes - replace with actual ABI in production
const mockABI: any[] = [];

interface Props {
  contractAddress: string;
  web3Provider: any;
}

const PRXBlockchainDashboard: React.FC<Props> = ({ contractAddress, web3Provider }) => {
  // Client instance
  const [client, setClient] = useState<PRXBlockchainClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<{
    name: string;
    symbol: string;
    totalSupply: number;
    mintPrice: string;
  } | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('tokens');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Feature-specific state
  const [tokenId, setTokenId] = useState<string>('');
  const [metadata, setMetadata] = useState<string>('');
  const [contentURI, setContentURI] = useState<string>('');
  const [contentType, setContentType] = useState<string>('image/png');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [contentHash, setContentHash] = useState<string>('');
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  
  // Quota settings
  const [dailyLimit, setDailyLimit] = useState<number>(10);
  const [timeWindow, setTimeWindow] = useState<number>(3600);
  const [windowLimit, setWindowLimit] = useState<number>(3);
  const [userAddress, setUserAddress] = useState<string>('');
  const [exempted, setExempted] = useState<boolean>(false);
  
  // Delegation
  const [delegateeAddress, setDelegateeAddress] = useState<string>('');
  
  // Governance
  const [proposalDescription, setProposalDescription] = useState<string>('');
  const [votingPeriod, setVotingPeriod] = useState<number>(259200); // 3 days in seconds
  const [proposalId, setProposalId] = useState<string>('');
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  
  // Fee model
  const [transferFee, setTransferFee] = useState<number>(25);
  const [mintFee, setMintFee] = useState<number>(100);
  const [contentFee, setContentFee] = useState<string>('0.001');
  const [platformShare, setPlatformShare] = useState<number>(4000);
  const [creatorShare, setCreatorShare] = useState<number>(4000);
  const [stakeholderShare, setStakeholderShare] = useState<number>(2000);
  const [newWallet, setNewWallet] = useState<string>('');
  const [newTreasury, setNewTreasury] = useState<string>('');
  
  // Initialize client
  useEffect(() => {
    if (web3Provider && contractAddress) {
      const newClient = new PRXBlockchainClient(contractAddress, mockABI, web3Provider);
      setClient(newClient);
    }
  }, [contractAddress, web3Provider]);
  
  // Load contract info when client is ready
  useEffect(() => {
    if (client) {
      loadContractInfo();
    }
  }, [client]);
  
  const loadContractInfo = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      const info = await client.getContractInfo();
      setContractInfo(info);
      setLoading(false);
    } catch (err) {
      setError('Failed to load contract info');
      setLoading(false);
    }
  };
  
  const connectWallet = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      const connectedAccount = await client.connect();
      setAccount(connectedAccount);
      setSuccess('Wallet connected successfully');
      setLoading(false);
    } catch (err) {
      setError('Failed to connect wallet');
      setLoading(false);
    }
  };
  
  // ==================== Token Functions ====================
  
  const mintToken = async () => {
    if (!client || !metadata) return;
    
    try {
      setLoading(true);
      const newTokenId = await client.mintToken(metadata);
      setSuccess(`Token minted successfully with ID: ${newTokenId}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to mint token');
      setLoading(false);
    }
  };
  
  const mintTokenWithContent = async () => {
    if (!client || !metadata || !contentURI || !contentHash) return;
    
    try {
      setLoading(true);
      const newTokenId = await client.mintTokenWithContent(
        metadata,
        contentURI,
        contentType,
        isPrivate,
        contentHash
      );
      setSuccess(`Token minted with content. ID: ${newTokenId}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to mint token with content');
      setLoading(false);
    }
  };
  
  const getTokenMetadata = async () => {
    if (!client || !tokenId) return;
    
    try {
      setLoading(true);
      const id = parseInt(tokenId);
      const token = await client.getToken(id);
      const prxMetadata = await client.getTokenPRXMetadata(id);
      setTokenMetadata({ ...token, ...prxMetadata });
      setSuccess('Token metadata loaded');
      setLoading(false);
    } catch (err) {
      setError('Failed to get token metadata');
      setLoading(false);
    }
  };
  
  // ==================== Minting Quota Functions ====================
  
  const updateMintingQuota = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      await client.updateMintingQuota(dailyLimit, timeWindow, windowLimit);
      setSuccess('Minting quota updated successfully');
      setLoading(false);
    } catch (err) {
      setError('Failed to update minting quota');
      setLoading(false);
    }
  };
  
  const setQuotaExemption = async () => {
    if (!client || !userAddress) return;
    
    try {
      setLoading(true);
      await client.setQuotaExemption(userAddress, exempted);
      setSuccess(`User ${userAddress} ${exempted ? 'exempted from' : 'subject to'} quota`);
      setLoading(false);
    } catch (err) {
      setError('Failed to set quota exemption');
      setLoading(false);
    }
  };
  
  // ==================== Delegation Functions ====================
  
  const delegateVotingPower = async () => {
    if (!client || !delegateeAddress) return;
    
    try {
      setLoading(true);
      await client.delegate(delegateeAddress);
      setSuccess(`Successfully delegated voting power to ${delegateeAddress}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to delegate voting power');
      setLoading(false);
    }
  };
  
  const undelegateVotingPower = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      await client.undelegate();
      setSuccess('Successfully undelegated voting power');
      setLoading(false);
    } catch (err) {
      setError('Failed to undelegate voting power');
      setLoading(false);
    }
  };
  
  // ==================== Governance Functions ====================
  
  const createProposal = async () => {
    if (!client || !proposalDescription) return;
    
    try {
      setLoading(true);
      // For this example, we'll create a proposal to update the minting quota
      const calldata = client.createProposalCalldata('updateMintingQuota', [dailyLimit, timeWindow, windowLimit]);
      
      const id = await client.createProposal(proposalDescription, votingPeriod, calldata);
      setSuccess(`Proposal created with ID: ${id}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to create proposal');
      setLoading(false);
    }
  };
  
  const voteOnProposal = async () => {
    if (!client || !proposalId) return;
    
    try {
      setLoading(true);
      await client.vote(parseInt(proposalId), voteSupport);
      setSuccess(`Voted ${voteSupport ? 'for' : 'against'} proposal ${proposalId}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to vote on proposal');
      setLoading(false);
    }
  };
  
  const executeProposal = async () => {
    if (!client || !proposalId) return;
    
    try {
      setLoading(true);
      await client.executeProposal(parseInt(proposalId));
      setSuccess(`Executed proposal ${proposalId}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to execute proposal');
      setLoading(false);
    }
  };
  
  // ==================== Fee Model Functions ====================
  
  const updateFeeModel = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      // Convert ETH to wei for contentFee
      const contentFeeWei = client ? client.web3.utils.toWei(contentFee, 'ether') : '0';
      
      await client.updateFeeModel(
        transferFee,
        mintFee,
        contentFeeWei,
        platformShare,
        creatorShare,
        stakeholderShare
      );
      setSuccess('Fee model updated successfully');
      setLoading(false);
    } catch (err) {
      setError('Failed to update fee model');
      setLoading(false);
    }
  };
  
  const updatePlatformWallet = async () => {
    if (!client || !newWallet) return;
    
    try {
      setLoading(true);
      await client.updatePlatformWallet(newWallet);
      setSuccess(`Platform wallet updated to ${newWallet}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to update platform wallet');
      setLoading(false);
    }
  };
  
  const updateCommunityTreasury = async () => {
    if (!client || !newTreasury) return;
    
    try {
      setLoading(true);
      await client.updateCommunityTreasury(newTreasury);
      setSuccess(`Community treasury updated to ${newTreasury}`);
      setLoading(false);
    } catch (err) {
      setError('Failed to update community treasury');
      setLoading(false);
    }
  };
  
  const distributeFees = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      await client.distributeFees();
      setSuccess('Fees distributed successfully');
      setLoading(false);
    } catch (err) {
      setError('Failed to distribute fees');
      setLoading(false);
    }
  };
  
  // ==================== Render UI ====================
  
  const renderTokensTab = () => (
    <div className="tab-content">
      <h3>Token Management</h3>
      
      <div className="card">
        <h4>Mint Token</h4>
        <div className="form-group">
          <label>Token Metadata:</label>
          <input 
            type="text" 
            value={metadata} 
            onChange={(e) => setMetadata(e.target.value)} 
            placeholder="Token Metadata" 
          />
        </div>
        <button onClick={mintToken} disabled={loading || !metadata}>
          Mint Token
        </button>
      </div>
      
      <div className="card">
        <h4>Mint Token with Content</h4>
        <div className="form-group">
          <label>Token Metadata:</label>
          <input 
            type="text" 
            value={metadata} 
            onChange={(e) => setMetadata(e.target.value)} 
            placeholder="Token Metadata" 
          />
        </div>
        <div className="form-group">
          <label>Content URI:</label>
          <input 
            type="text" 
            value={contentURI} 
            onChange={(e) => setContentURI(e.target.value)} 
            placeholder="ipfs://Qm..." 
          />
        </div>
        <div className="form-group">
          <label>Content Type:</label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="image/png">Image (PNG)</option>
            <option value="image/jpeg">Image (JPEG)</option>
            <option value="video/mp4">Video (MP4)</option>
            <option value="audio/mp3">Audio (MP3)</option>
            <option value="text/plain">Text</option>
            <option value="application/json">JSON</option>
          </select>
        </div>
        <div className="form-group">
          <label>Private Content:</label>
          <input 
            type="checkbox" 
            checked={isPrivate} 
            onChange={(e) => setIsPrivate(e.target.checked)} 
          />
          <span className="checkbox-label">Make content private (requires fee to access)</span>
        </div>
        <div className="form-group">
          <label>Content Hash:</label>
          <input 
            type="text" 
            value={contentHash} 
            onChange={(e) => setContentHash(e.target.value)} 
            placeholder="0x..." 
          />
        </div>
        <button 
          onClick={mintTokenWithContent} 
          disabled={loading || !metadata || !contentURI || !contentHash}
        >
          Mint Token with Content
        </button>
      </div>
      
      <div className="card">
        <h4>Get Token Metadata</h4>
        <div className="form-group">
          <label>Token ID:</label>
          <input 
            type="number" 
            value={tokenId} 
            onChange={(e) => setTokenId(e.target.value)} 
            placeholder="Token ID" 
          />
        </div>
        <button onClick={getTokenMetadata} disabled={loading || !tokenId}>
          Get Metadata
        </button>
        
        {tokenMetadata && (
          <div className="metadata-display">
            <h5>Token Information</h5>
            <p>Owner: {tokenMetadata.owner}</p>
            <p>Metadata: {tokenMetadata.metadata}</p>
            <p>Content URI: {tokenMetadata.contentURI}</p>
            <p>Content Type: {tokenMetadata.contentType}</p>
            <p>Creator: {tokenMetadata.creator}</p>
            <p>Private: {tokenMetadata.isPrivate ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderQuotasTab = () => (
    <div className="tab-content">
      <h3>Minting Quotas & Rate Limiting</h3>
      
      <div className="card">
        <h4>Update Minting Quota</h4>
        <div className="form-group">
          <label>Daily Limit:</label>
          <input 
            type="number" 
            value={dailyLimit} 
            onChange={(e) => setDailyLimit(parseInt(e.target.value))} 
            min="1" 
          />
        </div>
        <div className="form-group">
          <label>Time Window (seconds):</label>
          <input 
            type="number" 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(parseInt(e.target.value))} 
            min="60" 
            step="60" 
          />
        </div>
        <div className="form-group">
          <label>Window Limit:</label>
          <input 
            type="number" 
            value={windowLimit} 
            onChange={(e) => setWindowLimit(parseInt(e.target.value))} 
            min="1" 
          />
        </div>
        <button onClick={updateMintingQuota} disabled={loading}>
          Update Quota Settings
        </button>
      </div>
      
      <div className="card">
        <h4>Set Quota Exemption</h4>
        <div className="form-group">
          <label>User Address:</label>
          <input 
            type="text" 
            value={userAddress} 
            onChange={(e) => setUserAddress(e.target.value)} 
            placeholder="0x..." 
          />
        </div>
        <div className="form-group">
          <label>Exempt from Quota:</label>
          <input 
            type="checkbox" 
            checked={exempted} 
            onChange={(e) => setExempted(e.target.checked)} 
          />
          <span className="checkbox-label">Exempt user from minting quotas</span>
        </div>
        <button onClick={setQuotaExemption} disabled={loading || !userAddress}>
          Set Exemption
        </button>
      </div>
    </div>
  );
  
  const renderDelegationTab = () => (
    <div className="tab-content">
      <h3>Token Delegation</h3>
      
      <div className="card">
        <h4>Delegate Voting Power</h4>
        <div className="form-group">
          <label>Delegatee Address:</label>
          <input 
            type="text" 
            value={delegateeAddress} 
            onChange={(e) => setDelegateeAddress(e.target.value)} 
            placeholder="0x..." 
          />
        </div>
        <button onClick={delegateVotingPower} disabled={loading || !delegateeAddress}>
          Delegate
        </button>
      </div>
      
      <div className="card">
        <h4>Remove Delegation</h4>
        <p>This will remove your current delegation and return voting power to your address.</p>
        <button onClick={undelegateVotingPower} disabled={loading}>
          Undelegate
        </button>
      </div>
    </div>
  );
  
  const renderGovernanceTab = () => (
    <div className="tab-content">
      <h3>Governance</h3>
      
      <div className="card">
        <h4>Create Proposal</h4>
        <div className="form-group">
          <label>Proposal Description:</label>
          <textarea 
            value={proposalDescription} 
            onChange={(e) => setProposalDescription(e.target.value)} 
            placeholder="Describe your proposal" 
          />
        </div>
        <div className="form-group">
          <label>Voting Period (seconds):</label>
          <input 
            type="number" 
            value={votingPeriod} 
            onChange={(e) => setVotingPeriod(parseInt(e.target.value))} 
            min="259200" 
            step="86400" 
          />
          <p className="helper-text">Minimum voting period is 3 days (259200 seconds)</p>
        </div>
        <p>For this example, the proposal will update minting quotas with the values from the Quotas tab.</p>
        <button onClick={createProposal} disabled={loading || !proposalDescription}>
          Create Proposal
        </button>
      </div>
      
      <div className="card">
        <h4>Vote on Proposal</h4>
        <div className="form-group">
          <label>Proposal ID:</label>
          <input 
            type="number" 
            value={proposalId} 
            onChange={(e) => setProposalId(e.target.value)} 
            placeholder="Proposal ID" 
            min="0" 
          />
        </div>
        <div className="form-group">
          <label>Vote:</label>
          <select value={voteSupport.toString()} onChange={(e) => setVoteSupport(e.target.value === 'true')}>
            <option value="true">Support</option>
            <option value="false">Against</option>
          </select>
        </div>
        <button onClick={voteOnProposal} disabled={loading || !proposalId}>
          Submit Vote
        </button>
      </div>
      
      <div className="card">
        <h4>Execute Proposal</h4>
        <div className="form-group">
          <label>Proposal ID:</label>
          <input 
            type="number" 
            value={proposalId} 
            onChange={(e) => setProposalId(e.target.value)} 
            placeholder="Proposal ID" 
            min="0" 
          />
        </div>
        <p className="helper-text">Proposals can only be executed after the voting period has ended.</p>
        <button onClick={executeProposal} disabled={loading || !proposalId}>
          Execute Proposal
        </button>
      </div>
    </div>
  );
  
  const renderFeesTab = () => (
    <div className="tab-content">
      <h3>Fee Model & Distribution</h3>
      
      <div className="card">
        <h4>Update Fee Model</h4>
        <div className="form-group">
          <label>Transfer Fee (basis points, 100 = 1%):</label>
          <input 
            type="number" 
            value={transferFee} 
            onChange={(e) => setTransferFee(parseInt(e.target.value))} 
            min="0" 
            max="500" 
          />
          <p className="helper-text">Maximum: 500 (5%)</p>
        </div>
        <div className="form-group">
          <label>Mint Fee (basis points, 100 = 1%):</label>
          <input 
            type="number" 
            value={mintFee} 
            onChange={(e) => setMintFee(parseInt(e.target.value))} 
            min="0" 
            max="1000" 
          />
          <p className="helper-text">Maximum: 1000 (10%)</p>
        </div>
        <div className="form-group">
          <label>Content Access Fee (ETH):</label>
          <input 
            type="number" 
            value={contentFee} 
            onChange={(e) => setContentFee(e.target.value)} 
            min="0" 
            step="0.001" 
          />
        </div>
        <div className="form-group">
          <label>Platform Share (basis points, 100 = 1%):</label>
          <input 
            type="number" 
            value={platformShare} 
            onChange={(e) => setPlatformShare(parseInt(e.target.value))} 
            min="0" 
            max="10000" 
          />
        </div>
        <div className="form-group">
          <label>Creator Share (basis points, 100 = 1%):</label>
          <input 
            type="number" 
            value={creatorShare} 
            onChange={(e) => setCreatorShare(parseInt(e.target.value))} 
            min="0" 
            max="10000" 
          />
        </div>
        <div className="form-group">
          <label>Stakeholder Share (basis points, 100 = 1%):</label>
          <input 
            type="number" 
            value={stakeholderShare} 
            onChange={(e) => setStakeholderShare(parseInt(e.target.value))} 
            min="0" 
            max="10000" 
          />
          <p className="helper-text">All shares must add up to 10000 (100%)</p>
        </div>
        <button 
          onClick={updateFeeModel} 
          disabled={loading || (platformShare + creatorShare + stakeholderShare) !== 10000}
        >
          Update Fee Model
        </button>
      </div>
      
      <div className="card">
        <h4>Update Platform Wallet</h4>
        <div className="form-group">
          <label>New Wallet Address:</label>
          <input 
            type="text" 
            value={newWallet} 
            onChange={(e) => setNewWallet(e.target.value)} 
            placeholder="0x..." 
          />
        </div>
        <button onClick={updatePlatformWallet} disabled={loading || !newWallet}>
          Update Platform Wallet
        </button>
      </div>
      
      <div className="card">
        <h4>Update Community Treasury</h4>
        <div className="form-group">
          <label>New Treasury Address:</label>
          <input 
            type="text" 
            value={newTreasury} 
            onChange={(e) => setNewTreasury(e.target.value)} 
            placeholder="0x..." 
          />
        </div>
        <button onClick={updateCommunityTreasury} disabled={loading || !newTreasury}>
          Update Community Treasury
        </button>
      </div>
      
      <div className="card">
        <h4>Distribute Fees</h4>
        <p>Distribute accumulated fees to platform wallet and community treasury.</p>
        <button onClick={distributeFees} disabled={loading}>
          Distribute Fees
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="prx-blockchain-dashboard">
      <div className="dashboard-header">
        <h2>PRX Blockchain Dashboard</h2>
        {contractInfo && (
          <div className="contract-info">
            <p>
              <span className="label">Contract:</span> {contractInfo.name} ({contractInfo.symbol})
            </p>
            <p>
              <span className="label">Total Supply:</span> {contractInfo.totalSupply} tokens
            </p>
            <p>
              <span className="label">Mint Price:</span> {client && client.web3.utils.fromWei(contractInfo.mintPrice, 'ether')} ETH
            </p>
          </div>
        )}
        <div className="wallet-info">
          {account ? (
            <p>
              <span className="label">Connected Account:</span> {account}
            </p>
          ) : (
            <button onClick={connectWallet} disabled={loading || !client}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'tokens' ? 'active' : ''} 
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
        <button 
          className={activeTab === 'quotas' ? 'active' : ''} 
          onClick={() => setActiveTab('quotas')}
        >
          Quotas
        </button>
        <button 
          className={activeTab === 'delegation' ? 'active' : ''} 
          onClick={() => setActiveTab('delegation')}
        >
          Delegation
        </button>
        <button 
          className={activeTab === 'governance' ? 'active' : ''} 
          onClick={() => setActiveTab('governance')}
        >
          Governance
        </button>
        <button 
          className={activeTab === 'fees' ? 'active' : ''} 
          onClick={() => setActiveTab('fees')}
        >
          Fees
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'tokens' && renderTokensTab()}
        {activeTab === 'quotas' && renderQuotasTab()}
        {activeTab === 'delegation' && renderDelegationTab()}
        {activeTab === 'governance' && renderGovernanceTab()}
        {activeTab === 'fees' && renderFeesTab()}
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default PRXBlockchainDashboard;