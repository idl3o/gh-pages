import { useState, useRef, FormEvent } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

interface ContentUploaderProps {
  className?: string;
  onSuccess?: (contentId: string) => void;
}

const ContentUploader = ({ className = '', onSuccess }: ContentUploaderProps) => {
  const { client, isConnected } = useBlockchain();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [price, setPrice] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!title) {
      setError('Please enter a title for your content');
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Use the client to upload to IPFS
      const metadata = {
        title,
        description,
        tags,
        price: parseFloat(price) || 0,
        timestamp: new Date().toISOString(),
      };
      
      // This would be the actual SDK call in a production environment
      // For this demo, we'll simulate a successful upload after a delay
      const hash = await simulateIpfsUpload(file, metadata);
      
      // SDK would return the IPFS hash for the content
      setIpfsHash(hash);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(hash);
      }
      
      // Reset the form after successful upload
      setTitle('');
      setDescription('');
      setFile(null);
      setTags([]);
      setPrice('0');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  // Simulate IPFS upload for demo purposes
  const simulateIpfsUpload = (file: File, metadata: any): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a fake IPFS hash based on the file name and current time
        const hash = `Qm${Array.from({ length: 44 }, () => 
          '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
            Math.floor(Math.random() * 58)
          ]).join('')}`;
        resolve(hash);
      }, 2000); // Simulate 2-second upload time
    });
  };

  return (
    <div className={`content-uploader ${className}`}>
      <h3>Upload New Content</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {ipfsHash && (
        <div className="upload-success">
          <p>Content successfully uploaded to IPFS!</p>
          <p>
            <strong>IPFS Hash:</strong>{' '}
            <span className="ipfs-link">{ipfsHash}</span>
          </p>
          <p>
            <a 
              href={`https://ipfs.io/ipfs/${ipfsHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm"
            >
              View on IPFS Gateway
            </a>
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            type="text"
            id="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Content Title"
            disabled={uploading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Content Description"
            rows={3}
            disabled={uploading}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="file" className="form-label">
            Content File
          </label>
          <input
            type="file"
            id="file"
            className="form-control"
            onChange={handleFileChange}
            disabled={uploading}
            ref={fileInputRef}
            required
          />
          
          {file && (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                type="button"
                className="btn-link"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="tags" className="form-label">
            Tags
          </label>
          <div className="tags-input-container">
            <input
              type="text"
              id="tags"
              className="form-control"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              placeholder="Add tags..."
              disabled={uploading}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleAddTag}
              disabled={uploading || !currentTag.trim()}
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="tags-container">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={uploading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="price" className="form-label">
            Price in PRX Tokens (optional)
          </label>
          <div className="amount-input-container">
            <input
              type="number"
              id="price"
              className="form-control"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              disabled={uploading}
            />
            <span className="token-symbol-badge">PRX</span>
          </div>
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {uploadProgress < 100 ? 'Uploading...' : 'Processing...'} {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Content'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentUploader;