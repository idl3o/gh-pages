import { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import type { Proposal } from '../services/ContractsService';

interface GovernanceProps {
  proposalId?: number; // Optional: If provided, shows details for a specific proposal
}

const Governance: React.FC<GovernanceProps> = ({ proposalId }) => {
  const { isConnected, contractsService, walletAddress } = useBlockchain();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Form state for new proposal
  const [newProposalForm, setNewProposalForm] = useState({
    description: '',
    votingPeriod: 7, // Default 7 days
    executionData: ''
  });
  
  // Mock proposals for demonstration
  // In a real application, you would fetch these from the blockchain
  useEffect(() => {
    const loadProposals = async () => {
      if (!isConnected || !contractsService) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // This is a mock implementation since we don't have a real
        // method to fetch all proposals from the contract
        const mockProposals: Proposal[] = [
          {
            id: 1,
            description: "Update fee structure: reduce transfer fees to 0.1%",
            proposer: "0x123...abc",
            startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),   // 2 days from now
            executed: false,
            passed: false,
            forVotes: 75,
            againstVotes: 25
          },
          {
            id: 2,
            description: "Increase minimum verifications to 5 for content",
            proposer: "0x456...def",
            startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),    // 3 days ago
            executed: true,
            passed: true,
            forVotes: 80,
            againstVotes: 20
          },
          {
            id: 3,
            description: "Add new content type support for audio files",
            proposer: "0x789...ghi",
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),   // 5 days from now
            executed: false,
            passed: false,
            forVotes: 40,
            againstVotes: 30
          }
        ];
        
        setProposals(mockProposals);
        
        // If a specific proposalId is provided, select that proposal
        if (proposalId !== undefined) {
          const proposal = mockProposals.find(p => p.id === proposalId);
          if (proposal) {
            setSelectedProposal(proposal);
          }
        }
      } catch (err) {
        console.error('Error loading proposals:', err);
        setError('Failed to load governance proposals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [isConnected, contractsService, proposalId]);

  // Handle proposal selection
  const handleProposalSelect = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProposalForm(prev => ({
      ...prev,
      [name]: name === 'votingPeriod' ? parseInt(value) : value
    }));
  };

  // Handle creating a new proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractsService || !isConnected) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, this would call the contract
      // const proposalId = await contractsService.createProposal(
      //   newProposalForm.description,
      //   newProposalForm.votingPeriod,
      //   newProposalForm.executionData
      // );
      
      // Mock implementation
      const newProposalId = proposals.length + 1;
      const now = new Date();
      const endDate = new Date(now.getTime() + newProposalForm.votingPeriod * 24 * 60 * 60 * 1000);
      
      const newProposal: Proposal = {
        id: newProposalId,
        description: newProposalForm.description,
        proposer: walletAddress || '0xUnknown',
        startTime: now,
        endTime: endDate,
        executed: false,
        passed: false,
        forVotes: 0,
        againstVotes: 0
      };
      
      setProposals(prev => [newProposal, ...prev]);
      setSelectedProposal(newProposal);
      
      // Reset form
      setNewProposalForm({
        description: '',
        votingPeriod: 7,
        executionData: ''
      });
      
      setError(null);
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError('Failed to create proposal. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle voting on a proposal
  const handleVote = async (proposalId: number, support: boolean) => {
    if (!contractsService || !isConnected) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, this would call the contract
      // await contractsService.voteOnProposal(proposalId, support);
      
      // Mock implementation
      setProposals(prev => 
        prev.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              forVotes: support ? p.forVotes + 10 : p.forVotes,
              againstVotes: !support ? p.againstVotes + 10 : p.againstVotes
            };
          }
          return p;
        })
      );
      
      // Update selected proposal if it's the one we voted on
      if (selectedProposal?.id === proposalId) {
        setSelectedProposal(prev => {
          if (prev) {
            return {
              ...prev,
              forVotes: support ? prev.forVotes + 10 : prev.forVotes,
              againstVotes: !support ? prev.againstVotes + 10 : prev.againstVotes
            };
          }
          return prev;
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error voting on proposal:', err);
      setError('Failed to cast vote. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle executing a proposal
  const handleExecuteProposal = async (proposalId: number) => {
    if (!contractsService || !isConnected) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, this would call the contract
      // await contractsService.executeProposal(proposalId);
      
      // Mock implementation
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error('Proposal not found');
      
      // Check if proposal has passed (more for votes than against)
      const passed = proposal.forVotes > proposal.againstVotes;
      
      setProposals(prev => 
        prev.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              executed: true,
              passed
            };
          }
          return p;
        })
      );
      
      // Update selected proposal if it's the one we executed
      if (selectedProposal?.id === proposalId) {
        setSelectedProposal(prev => {
          if (prev) {
            return {
              ...prev,
              executed: true,
              passed
            };
          }
          return prev;
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError('Failed to execute proposal. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="governance">
        <div className="card text-center">
          <h2>Governance</h2>
          <p>Please connect your wallet to participate in governance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="governance">
      <div className="card">
        <h2>PRX Governance</h2>
        
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="btn btn-sm">Dismiss</button>
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner center">
            <div className="spinner"></div>
            <p>Loading governance data...</p>
          </div>
        ) : (
          <>
            <div className="governance-sections">
              <div className="proposal-creation section">
                <h3>Create Proposal</h3>
                <form onSubmit={handleCreateProposal}>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea 
                      id="description"
                      name="description"
                      value={newProposalForm.description}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter a clear description of your proposal"
                      rows={4}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="votingPeriod">Voting Period (days)</label>
                    <input 
                      type="number" 
                      id="votingPeriod"
                      name="votingPeriod"
                      value={newProposalForm.votingPeriod}
                      onChange={handleFormChange}
                      min={3}
                      max={30}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="executionData">Execution Data (optional)</label>
                    <input 
                      type="text" 
                      id="executionData"
                      name="executionData"
                      value={newProposalForm.executionData}
                      onChange={handleFormChange}
                      placeholder="Function signature and parameters"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn" 
                    disabled={loading || !newProposalForm.description}
                  >
                    Submit Proposal
                  </button>
                </form>
              </div>
              
              <div className="proposals-list section">
                <h3>Active Proposals</h3>
                
                {proposals.length === 0 ? (
                  <div className="no-proposals-message">
                    <p>No proposals found.</p>
                    <p>Create the first proposal to start governance!</p>
                  </div>
                ) : (
                  <div className="proposal-table">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Votes</th>
                          <th>End Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map(proposal => (
                          <tr 
                            key={proposal.id} 
                            className={`proposal-row ${selectedProposal?.id === proposal.id ? 'selected' : ''}`}
                            onClick={() => handleProposalSelect(proposal)}
                          >
                            <td>#{proposal.id}</td>
                            <td className="proposal-description">
                              {proposal.description.length > 50 
                                ? proposal.description.substring(0, 50) + '...' 
                                : proposal.description}
                            </td>
                            <td className="proposal-status">
                              {proposal.executed ? (
                                proposal.passed ? (
                                  <span className="status passed">Passed</span>
                                ) : (
                                  <span className="status rejected">Rejected</span>
                                )
                              ) : (
                                <span className="status active">Active</span>
                              )}
                            </td>
                            <td className="proposal-votes">
                              <div className="vote-bar">
                                <div 
                                  className="for-votes" 
                                  style={{ 
                                    width: `${proposal.forVotes / (proposal.forVotes + proposal.againstVotes) * 100 || 0}%` 
                                  }}
                                ></div>
                                <div 
                                  className="against-votes" 
                                  style={{ 
                                    width: `${proposal.againstVotes / (proposal.forVotes + proposal.againstVotes) * 100 || 0}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="vote-numbers">
                                {proposal.forVotes} For / {proposal.againstVotes} Against
                              </div>
                            </td>
                            <td>
                              {proposal.endTime.toLocaleDateString()}
                            </td>
                            <td>
                              {!proposal.executed && new Date() < proposal.endTime ? (
                                <button 
                                  className="btn btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row selection
                                    handleProposalSelect(proposal);
                                  }}
                                >
                                  View
                                </button>
                              ) : (
                                !proposal.executed && new Date() >= proposal.endTime ? (
                                  <button 
                                    className="btn btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row selection
                                      handleExecuteProposal(proposal.id);
                                    }}
                                  >
                                    Execute
                                  </button>
                                ) : (
                                  <button 
                                    className="btn btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row selection
                                      handleProposalSelect(proposal);
                                    }}
                                  >
                                    Details
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            {selectedProposal && (
              <div className="proposal-details section">
                <h3>Proposal Details</h3>
                <div className="proposal-detail-card">
                  <h4>Proposal #{selectedProposal.id}</h4>
                  
                  <div className="detail-section">
                    <h5>Description</h5>
                    <p className="proposal-full-description">{selectedProposal.description}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h5>Metadata</h5>
                    <ul className="detail-list">
                      <li><strong>Proposer:</strong> {selectedProposal.proposer}</li>
                      <li><strong>Start Time:</strong> {selectedProposal.startTime.toLocaleString()}</li>
                      <li><strong>End Time:</strong> {selectedProposal.endTime.toLocaleString()}</li>
                      <li><strong>Status:</strong> {
                        selectedProposal.executed 
                          ? (selectedProposal.passed ? 'Passed and Executed' : 'Rejected') 
                          : 'Active'
                      }</li>
                      <li>
                        <strong>Current Votes:</strong> {selectedProposal.forVotes} For / {selectedProposal.againstVotes} Against
                      </li>
                    </ul>
                  </div>
                  
                  {!selectedProposal.executed && new Date() < selectedProposal.endTime && (
                    <div className="voting-actions">
                      <h5>Cast Your Vote</h5>
                      <div className="vote-buttons">
                        <button 
                          onClick={() => handleVote(selectedProposal.id, true)}
                          className="btn btn-success"
                          disabled={loading}
                        >
                          Vote For
                        </button>
                        <button 
                          onClick={() => handleVote(selectedProposal.id, false)}
                          className="btn btn-danger"
                          disabled={loading}
                        >
                          Vote Against
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!selectedProposal.executed && new Date() >= selectedProposal.endTime && (
                    <div className="execution-actions">
                      <button 
                        onClick={() => handleExecuteProposal(selectedProposal.id)}
                        className="btn"
                        disabled={loading}
                      >
                        Execute Proposal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Governance;