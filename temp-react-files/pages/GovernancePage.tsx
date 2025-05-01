import { useParams } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import Governance from '../components/Governance';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';

const GovernancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useBlockchain();
  const proposalId = id ? parseInt(id, 10) : undefined;

  return (
    <div className="page governance-page">
      <div className="page-header">
        <h1>Governance</h1>
        <p className="page-description">
          Participate in the PRX Blockchain governance. Create proposals, vote, and shape the future of the platform.
        </p>
      </div>
      
      <div className="page-content">
        {!isConnected ? (
          <ConnectWalletPrompt message="Connect your wallet to participate in governance" />
        ) : (
          <Governance proposalId={proposalId} />
        )}
      </div>
    </div>
  );
};

export default GovernancePage;