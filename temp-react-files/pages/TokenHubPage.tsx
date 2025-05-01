import { useParams } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import TokenHub from '../components/TokenHub';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';

const TokenHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useBlockchain();
  const tokenId = id ? parseInt(id, 10) : undefined;

  return (
    <div className="page token-hub-page">
      <div className="page-header">
        <h1>Token Hub</h1>
        <p className="page-description">
          Manage your PRX tokens, mint new tokens, and interact with content on the blockchain.
        </p>
      </div>
      
      <div className="page-content">
        {!isConnected ? (
          <ConnectWalletPrompt message="Connect your wallet to view and manage your PRX tokens" />
        ) : (
          <TokenHub tokenId={tokenId} />
        )}
      </div>
    </div>
  );
};

export default TokenHubPage;