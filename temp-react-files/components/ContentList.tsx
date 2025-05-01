import { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { Link } from 'react-router-dom';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  ipfsHash: string;
  timestamp: string;
  price: number;
  views: number;
  earnings: number;
  tags: string[];
  fileType: string;
}

interface ContentListProps {
  className?: string;
  limit?: number;
  filter?: 'all' | 'free' | 'premium';
}

const ContentList = ({ className = '', limit, filter = 'all' }: ContentListProps) => {
  const { client, isConnected } = useBlockchain();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch content when component mounts
  useEffect(() => {
    const fetchContent = async () => {
      if (!isConnected) {
        setContent([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // In a real implementation, we would use the client to fetch actual data
        // For this demo, we'll create some mock content
        const mockContent = generateMockContent();
        
        // Apply filtering if needed
        let filteredContent = mockContent;
        if (filter === 'free') {
          filteredContent = mockContent.filter(item => item.price === 0);
        } else if (filter === 'premium') {
          filteredContent = mockContent.filter(item => item.price > 0);
        }
        
        // Apply limit if specified
        if (limit && limit > 0) {
          filteredContent = filteredContent.slice(0, limit);
        }
        
        setContent(filteredContent);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load your content. Please try again later.');
      } finally {
        // Add a small delay to simulate network request
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchContent();
  }, [client, isConnected, filter, limit]);

  // Generate mock content for demo purposes
  const generateMockContent = (): ContentItem[] => {
    const fileTypes = ['video', 'audio', 'image', 'document', 'ebook'];
    const tagSets = [
      ['music', 'rock', 'indie'],
      ['tutorial', 'education', 'tech'],
      ['art', 'digital', 'abstract'],
      ['podcast', 'interview', 'tech'],
      ['photography', 'nature', 'landscape'],
    ];
    
    return Array.from({ length: 5 }, (_, index) => ({
      id: `content-${index + 1}`,
      title: `Content #${index + 1}`,
      description: `This is a sample description for content item #${index + 1}. This would typically include details about the content.`,
      ipfsHash: `Qm${Array.from({ length: 44 }, () => 
        '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
          Math.floor(Math.random() * 58)
        ]).join('')}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 1,
      views: Math.floor(Math.random() * 1000),
      earnings: Math.floor(Math.random() * 500),
      tags: tagSets[index % tagSets.length],
      fileType: fileTypes[index % fileTypes.length]
    }));
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get icon based on file type
  const getFileTypeIcon = (fileType: string): string => {
    switch (fileType.toLowerCase()) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'document': return '📄';
      case 'ebook': return '📚';
      default: return '📁';
    }
  };

  if (isLoading) {
    return (
      <div className={`content-list ${className}`}>
        <div className="loading-spinner">
          Loading content...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`content-list ${className}`}>
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className={`content-list ${className}`}>
        <div className="empty-state">
          <p className="empty-message">You haven't uploaded any content yet.</p>
          <Link to="/dashboard/content/upload" className="btn btn-outline">
            Upload Your First Content
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`content-list ${className}`}>
      <div className="content-grid">
        {content.map((item) => (
          <div key={item.id} className="content-card">
            <div className="content-thumbnail">
              <span className="file-type-icon">
                {getFileTypeIcon(item.fileType)}
              </span>
            </div>
            
            <div className="content-details">
              <h3 className="content-title">{item.title}</h3>
              
              <div className="content-meta">
                <span className="upload-date">
                  {formatDate(item.timestamp)}
                </span>
                
                <span className="file-type">
                  {item.fileType}
                </span>
                
                <span className="price">
                  {item.price > 0 ? `${item.price} PRX` : 'Free'}
                </span>
              </div>
              
              <p className="content-description">
                {item.description.length > 100 
                  ? `${item.description.substring(0, 100)}...` 
                  : item.description}
              </p>
              
              <div className="content-tags">
                {item.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              
              <div className="content-stats">
                <span className="views">
                  <strong>{item.views}</strong> views
                </span>
                
                <span className="earnings">
                  <strong>{item.earnings}</strong> PRX earned
                </span>
              </div>
              
              <div className="content-actions">
                <a 
                  href={`https://ipfs.io/ipfs/${item.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                >
                  View
                </a>
                
                <button className="btn btn-sm btn-outline">
                  Edit
                </button>
                
                <button className="btn btn-sm btn-outline">
                  Analytics
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentList;