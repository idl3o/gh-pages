import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import ContentUploader from '../components/ContentUploader';
import ContentList from '../components/ContentList';
import { useBlockchain } from '../context/BlockchainContext';

const ContentPage = () => {
  const location = useLocation();
  const { isConnected, connectWallet } = useBlockchain();
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'free' | 'premium'>('all');

  // Check if we're on the upload page or main content page
  const isUploadPage = location.pathname.includes('/upload');

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
      title: 'Upload Content',
      path: '/dashboard/content/upload',
      icon: <span>⬆️</span>
    },
    {
      title: 'Settings',
      path: '/dashboard/settings',
      icon: <span>⚙️</span>
    }
  ];

  // Create sidebar component
  const dashboardSidebar = <Sidebar items={dashboardSidebarItems} title="Content Management" />;

  const handleUploadSuccess = (contentId: string) => {
    setActiveContent(contentId);
    // Could redirect to content list after successful upload
  };

  const handleFilterChange = (filter: 'all' | 'free' | 'premium') => {
    setContentFilter(filter);
  };

  if (!isConnected) {
    return (
      <Layout sidebar={dashboardSidebar}>
        <div className="connect-prompt-fullpage">
          <div className="card connect-card">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to access your content.</p>
            <button className="btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout sidebar={dashboardSidebar}>
      <section className="content-header">
        <h1>{isUploadPage ? 'Upload New Content' : 'My Content'}</h1>
        <p className="content-description">
          {isUploadPage 
            ? 'Share your creative work on the PRX Blockchain platform.'
            : 'Manage your content and track performance.'
          }
        </p>
        
        {!isUploadPage && (
          <div className="content-actions">
            <Link to="/dashboard/content/upload" className="btn">
              Upload New Content
            </Link>
            
            <div className="content-filter">
              <button 
                className={`filter-btn ${contentFilter === 'all' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${contentFilter === 'free' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('free')}
              >
                Free
              </button>
              <button 
                className={`filter-btn ${contentFilter === 'premium' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('premium')}
              >
                Premium
              </button>
            </div>
          </div>
        )}
      </section>

      {isUploadPage ? (
        <div className="content-upload-container">
          <ContentUploader onSuccess={handleUploadSuccess} />
        </div>
      ) : (
        <div className="content-management">
          <ContentList filter={contentFilter} />
        </div>
      )}
    </Layout>
  );
};

export default ContentPage;