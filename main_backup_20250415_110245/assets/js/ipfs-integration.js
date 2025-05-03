/**
 * IPFS Integration for Web3 Crypto Streaming Platform
 * Handles file uploads to IPFS network
 */

// IPFS Gateway URLs for retrieval
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.infura.io/ipfs/'
];

// Custom API endpoint for IPFS uploads
const IPFS_UPLOAD_ENDPOINT = '/api/ipfs/upload';

/**
 * Upload a file to IPFS
 * 
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} IPFS upload result with CID and gateway URLs
 */
async function uploadToIPFS(file, onProgress = null) {
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Get authentication token if available
    const authToken = localStorage.getItem('auth_token');
    
    // Set up headers
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Create XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest();
    
    // Set up progress tracking
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }
    
    // Create promise for async/await pattern
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.open('POST', IPFS_UPLOAD_ENDPOINT);
      
      // Set headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
    
    // Wait for upload to complete
    const result = await uploadPromise;
    
    // Add gateway URLs to result
    result.gatewayUrls = IPFS_GATEWAYS.map(gateway => `${gateway}${result.cid}`);
    
    return result;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Get the best available IPFS gateway URL for a CID
 * 
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<string>} Best gateway URL
 */
async function getBestGatewayUrl(cid) {
  // Try each gateway and return the first that responds quickly
  const promises = IPFS_GATEWAYS.map(async (gateway) => {
    const url = `${gateway}${cid}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { url, time: Date.now() };
      }
      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      return null;
    }
  });
  
  // Use Promise.any to get the first successful response
  try {
    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);
    
    if (validResults.length > 0) {
      // Sort by response time
      validResults.sort((a, b) => a.time - b.time);
      return validResults[0].url;
    }
    
    // Fallback to default gateway
    return `${IPFS_GATEWAYS[0]}${cid}`;
  } catch (error) {
    console.error('Error finding best gateway:', error);
    return `${IPFS_GATEWAYS[0]}${cid}`;
  }
}

/**
 * Initialize drag and drop functionality for file uploads
 * 
 * @param {string} dropzoneId - HTML ID of the dropzone element
 * @param {Function} onUpload - Callback when upload completes
 * @param {Function} onProgress - Optional progress callback
 */
function initializeIpfsDropzone(dropzoneId, onUpload, onProgress = null) {
  const dropzone = document.getElementById(dropzoneId);
  if (!dropzone) return;
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight dropzone on drag
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropzone.classList.add('highlight');
  }
  
  function unhighlight() {
    dropzone.classList.remove('highlight');
  }
  
  // Handle dropped files
  dropzone.addEventListener('drop', handleDrop, false);
  
  async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      try {
        const result = await uploadToIPFS(files[0], onProgress);
        if (onUpload) {
          onUpload(result);
        }
      } catch (error) {
        console.error('Drop upload error:', error);
        alert(`Upload failed: ${error.message}`);
      }
    }
  }
  
  // Handle file input
  const fileInput = dropzone.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        try {
          const result = await uploadToIPFS(e.target.files[0], onProgress);
          if (onUpload) {
            onUpload(result);
          }
        } catch (error) {
          console.error('File input upload error:', error);
          alert(`Upload failed: ${error.message}`);
        }
      }
    });
  }
}

// Export functions for use in other scripts
window.ipfsUtils = {
  uploadToIPFS,
  getBestGatewayUrl,
  initializeIpfsDropzone
};
