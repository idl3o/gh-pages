import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import TokenBalance from '../components/TokenBalance';
import TokenTransfer from '../components/TokenTransfer';
import { useBlockchain } from '../context/BlockchainContext';

const DashboardPage = () => {
  const { isConnected, connectWallet, connectedAddress } = useBlockchain();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Create sidebar navigation items
  const dashboardSidebarItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <span>📊</span>
    },
    {
      title: 'Content',
      path: '/dashboard/content',
      icon: <span>📄</span>
    },
    {
      title: 'Wallet',
      path: '/dashboard/wallet',
      icon: <span>💰</span>
    },
    {
      title: 'Settings',
      path: '/dashboard/settings',
      icon: <span>⚙️</span>
    }
  ];

  // Create sidebar component
  const dashboardSidebar = <Sidebar items={dashboardSidebarItems} title="Dashboard" />;

  if (!isConnected) {
    return (
      <Layout sidebar={dashboardSidebar}>
        <div className="connect-prompt-fullpage">
          <div className="card connect-card">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to access your dashboard.</p>
            <button className="btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout sidebar={dashboardSidebar}>
        <div className="loading-spinner">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout sidebar={dashboardSidebar}>
      <section className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-welcome">
          Welcome back! Here's an overview of your account.
        </p>
      </section>

      <div className="dashboard-grid">
        {/* User Profile Card */}
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {connectedAddress ? connectedAddress.substring(2, 4).toUpperCase() : '??'}
              </div>
            </div>
            <div className="profile-info">
              <h3>Creator Account</h3>
              <p className="profile-bio">
                {connectedAddress ? 
                  `${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}` : 
                  'Unknown address'}
              </p>
            </div>
          </div>
          
          <div className="profile-social">
            <h4>Linked Accounts</h4>
            <ul className="social-list">
              <li><a href="#twitter">Twitter</a></li>
              <li><a href="#instagram">Instagram</a></li>
              <li><a href="#youtube">YouTube</a></li>
              <li><a href="#tiktok">TikTok</a></li>
            </ul>
          </div>
        </div>

        {/* Token Balance Card */}
        <div className="card token-balance-card">
          <TokenBalance />
        </div>

        {/* Token Transfer Card */}
        <div className="card token-transfer-card">
          <TokenTransfer />
        </div>

        {/* Activity Card */}
        <div className="card activity-card">
          <h3>Recent Activity</h3>
          
          <div className="empty-state">
            <p className="placeholder-message">No recent activity to display.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/dashboard/content" className="btn">
          Manage Content
        </Link>
        <Link to="/dashboard/content/upload" className="btn btn-outline">
          Upload New Content
        </Link>
      </div>
    </Layout>
  );
};

export default DashboardPage;