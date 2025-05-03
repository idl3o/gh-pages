/**
 * AWS Jobs Integration Module for Web3 Crypto Streaming Service
 * Handles job board functionality with AWS backend services
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const jobContainer = document.getElementById('jobs-container');
  const jobSearchInput = document.getElementById('job-search');
  const jobCategorySelect = document.getElementById('job-category');
  const searchButton = document.getElementById('search-button');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');
  const viewToggleBtns = document.querySelectorAll('.toggle-btn');
  const jobForm = document.getElementById('job-post-form');
  const previewButton = document.getElementById('preview-job');
  const connectWalletBtn = document.getElementById('connect-wallet-job');
  const walletStatusElement = document.getElementById('wallet-status-job');
  const submitJobBtn = document.getElementById('submit-job');
  const jobPreviewModal = document.getElementById('job-preview-modal');
  const jobPreviewContent = document.getElementById('job-preview-content');
  const closePreviewBtn = document.querySelector('#job-preview-modal .close-modal');
  const publishFromPreviewBtn = document.getElementById('publish-from-preview');
  const reloadBtn = document.getElementById('reload-jobs');
  
  // State
  let currentPage = 1;
  let totalPages = 1;
  let currentView = 'grid';
  let jobsData = [];
  let connectedWalletAddress = null;
  let isLoading = false;
  
  // AWS Configuration
  const AWS_CONFIG = {
    apiUrl: 'https://api-gateway-url.execute-api.us-east-1.amazonaws.com/prod',
    region: 'us-east-1',
    cognitoPoolId: 'us-east-1:1234567-abcd-1234-efgh-1234567890ab',
    uploadBucket: 'web3-job-attachments',
    jobsTable: 'web3-jobs-table'
  };
  
  // Initialize AWS SDK (in real implementation)
  function initAWS() {
    console.log('Initializing AWS SDK with config:', AWS_CONFIG);
    // In a real implementation, this would initialize the AWS SDK:
    // AWS.config.region = AWS_CONFIG.region;
    // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    //   IdentityPoolId: AWS_CONFIG.cognitoPoolId
    // });
    
    // For our implementation, we'll simulate initialization
    setTimeout(() => {
      console.log('AWS SDK initialized successfully');
      loadJobs();
    }, 500);
  }
  
  // Reload jobs functionality
  function reloadJobs() {
    // Show loading spinner on reload button
    if (reloadBtn) {
      reloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      reloadBtn.disabled = true;
    }
    
    // Reset to page 1 and current filters
    const search = jobSearchInput ? jobSearchInput.value : '';
    const category = jobCategorySelect ? jobCategorySelect.value : '';
    
    // Clear current jobs
    if (jobContainer) {
      jobContainer.innerHTML = '<div class="job-loading">Refreshing job data from AWS Cloud...</div>';
    }
    
    // Load jobs with current filters
    loadJobs(search, category, 1).finally(() => {
      // Reset reload button
      if (reloadBtn) {
        reloadBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Reload Jobs';
        reloadBtn.disabled = false;
      }
    });
  }
  
  // Fetch jobs from AWS
  async function loadJobs(search = '', category = '', page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    setLoading(true);
    
    try {
      // In a real implementation, this would call the AWS API Gateway:
      // const response = await fetch(`${AWS_CONFIG.apiUrl}/jobs?search=${search}&category=${category}&page=${page}`);
      // const data = await response.json();
      
      // For our implementation, we'll simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated data
      const mockResponse = generateMockJobs(search, category, page);
      
      jobsData = mockResponse.jobs;
      totalPages = mockResponse.totalPages;
      currentPage = page;
      
      renderJobs(jobsData);
      updatePagination();
      
    } catch (error) {
      console.error('Error loading jobs:', error);
      jobContainer.innerHTML = `
        <div class="job-error">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load jobs. Please try again later.</p>
        </div>
      `;
    } finally {
      isLoading = false;
      setLoading(false);
    }
  }
  
  // Handle view toggle
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      
      // Update active toggle button
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update view
      currentView = view;
      jobContainer.className = `jobs-container ${view}-view`;
    });
  });
  
  // Initialize content moderation for job listings
  if (window.contentModerator) {
    window.contentModerator.initialize({
      level: 'standard',
      context: 'job-listings'
    });
  }
  
  // Render jobs with content moderation
  async function renderJobs(jobs) {
    if (!jobContainer) return;
    
    if (jobs.length === 0) {
      jobContainer.innerHTML = `
        <div class="no-jobs">
          <i class="fas fa-search"></i>
          <h3>No jobs found</h3>
          <p>Try adjusting your search criteria or check back later.</p>
        </div>
      `;
      return;
    }
    
    jobContainer.innerHTML = '';
    
    jobs.forEach(async (job) => {
      // Apply content moderation to job description if available
      let jobDescription = job.description;
      let jobTitle = job.title;
      let moderationApplied = false;
      
      if (window.contentModerator) {
        try {
          // Moderate job description
          const descResult = await window.contentModerator.moderateContent(jobDescription, {
            mode: 'redact',
            context: 'job-description'
          });
          
          jobDescription = descResult.modifiedContent;
          moderationApplied = descResult.moderated;
          
          // Moderate job title
          const titleResult = await window.contentModerator.moderateContent(jobTitle, {
            mode: 'redact',
            context: 'job-title'
          });
          
          jobTitle = titleResult.modifiedContent;
          moderationApplied = moderationApplied || titleResult.moderated;
          
        } catch (error) {
          console.error('Job content moderation error:', error);
        }
      }
      
      const jobCard = document.createElement('div');
      jobCard.className = 'job-card';
      if (moderationApplied) {
        jobCard.classList.add('moderated-content');
      }
      
      jobCard.innerHTML = `
        <div class="job-header">
          <div class="job-company">
            <img src="${job.companyLogo || 'https://via.placeholder.com/50?text=Logo'}" alt="${job.company} logo">
            <h3>${job.company}</h3>
          </div>
          <div class="job-tags">
            <span class="job-tag ${job.category}">${job.category}</span>
            <span class="job-tag">${job.type}</span>
            <span class="job-tag">${job.location}</span>
            ${moderationApplied ? '<span class="job-tag moderated"><i class="fas fa-shield-alt"></i> Protected</span>' : ''}
          </div>
        </div>
        <h2 class="job-title">${jobTitle}</h2>
        <div class="job-summary">${jobDescription.substring(0, 150)}...</div>
        <div class="job-footer">
          <div class="job-payment">
            <i class="fas fa-coins"></i>
            <span>${job.paymentType}</span>
          </div>
          <div class="job-posted">
            <i class="far fa-clock"></i>
            <span>Posted ${job.postedDate}</span>
          </div>
        </div>
        <a href="/job/${job.id}" class="job-link">View Details</a>
      `;
      
      jobCard.addEventListener('click', (e) => {
        if (!e.target.classList.contains('job-link')) {
          window.location.href = `/job/${job.id}`;
        }
      });
      
      jobContainer.appendChild(jobCard);
    });
  }
  
  // Update pagination
  function updatePagination() {
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
  }
  
  // Set loading state
  function setLoading(isLoading) {
    if (isLoading) {
      jobContainer.innerHTML = `<div class="job-loading">Loading opportunities from AWS Cloud...</div>`;
    }
  }
  
  // Generate mock job data
  function generateMockJobs(search = '', category = '', page = 1) {
    const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance'];
    const locations = ['Remote', 'Hybrid', 'On-site'];
    const paymentTypes = ['Fiat', 'Crypto', 'Hybrid (Fiat + Crypto)', 'Project Tokens'];
    const categories = ['Development', 'Content', 'Marketing', 'Community', 'Design'];
    
    const companies = [
      { name: 'Ethereum Foundation', logo: 'https://ethereum.org/favicon-32x32.png' },
      { name: 'Chainlink Labs', logo: 'https://chain.link/favicon.ico' },
      { name: 'Polygon', logo: 'https://polygon.technology/favicon.ico' },
      { name: 'Filecoin', logo: 'https://filecoin.io/images/favicon-32x32.png' },
      { name: 'The Graph', logo: 'https://thegraph.com/favicon.svg' },
      { name: 'Aave', logo: 'https://aave.com/favicon.ico' },
      { name: 'Uniswap', logo: 'https://uniswap.org/favicon.ico' },
      { name: 'Web3 Streaming', logo: '/favicon.ico' }
    ];
    
    // Generate 16 jobs per page
    let jobs = [];
    const jobsPerPage = 12;
    const totalJobs = 37; // Simulate this many total jobs
    
    for (let i = 0; i < jobsPerPage; i++) {
      const index = (page - 1) * jobsPerPage + i;
      
      // Only create jobs up to the total
      if (index >= totalJobs) break;
      
      const company = companies[index % companies.length];
      const jobCategory = categories[index % categories.length];
      
      const job = {
        id: `job-${index + 1}`,
        title: `${jobCategory} ${index % 3 === 0 ? 'Specialist' : index % 2 === 0 ? 'Engineer' : 'Creator'}`,
        company: company.name,
        companyLogo: company.logo,
        category: jobCategory.toLowerCase(),
        type: jobTypes[index % jobTypes.length],
        location: locations[index % locations.length],
        paymentType: paymentTypes[index % paymentTypes.length],
        description: `This is a job description for a ${jobCategory} position. The role involves working with Web3 technologies and blockchain platforms to create innovative solutions.`,
        postedDate: `${index % 7 + 1}d ago`,
        applyLink: 'https://example.com/apply',
        skills: ['Web3', 'Blockchain', 'Smart Contracts', 'DeFi'],
      };
      
      // Apply filters
      if (
        (search === '' || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase())) &&
        (category === '' || job.category === category)
      ) {
        jobs.push(job);
      }
    }
    
    // Calculate total pages based on filters
    const filteredTotalJobs = (search === '' && category === '') ? totalJobs : jobs.length;
    const calculatedTotalPages = Math.ceil(filteredTotalJobs / jobsPerPage);
    
    return {
      jobs: jobs.slice(0, jobsPerPage), // Return only the current page worth of jobs
      totalPages: calculatedTotalPages
    };
  }
  
  // Search jobs
  function searchJobs() {
    const search = jobSearchInput ? jobSearchInput.value : '';
    const category = jobCategorySelect ? jobCategorySelect.value : '';
    loadJobs(search, category, 1); // Reset to first page on search
  }
  
  // Wallet connection
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async function() {
      try {
        if (window.ethereum) {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          connectedWalletAddress = accounts[0];
          
          // Update wallet status display
          walletStatusElement.innerHTML = `
            <span class="wallet-connected">
              <i class="fas fa-check-circle"></i>
              Connected: ${connectedWalletAddress.substring(0, 6)}...${connectedWalletAddress.substring(38)}
            </span>
          `;
          
          connectWalletBtn.classList.add('connected');
          connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> Wallet Connected';
        } else {
          throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        walletStatusElement.innerHTML = `
          <span class="wallet-error">
            <i class="fas fa-exclamation-circle"></i>
            Connection failed: ${error.message}
          </span>
        `;
      }
    });
  }
  
  // Preview job post
  if (previewButton && jobForm) {
    previewButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const companyName = document.getElementById('company-name').value;
      const jobTitle = document.getElementById('job-title').value;
      const jobDescription = document.getElementById('job-description').value;
      const jobCategory = document.getElementById('job-category-select').value;
      const jobType = document.getElementById('job-type').value;
      const paymentType = document.getElementById('payment-type').value;
      const locationType = document.getElementById('location-type').value;
      
      if (!companyName || !jobTitle || !jobDescription) {
        alert('Please fill in the required fields.');
        return;
      }
      
      jobPreviewContent.innerHTML = `
        <div class="job-preview">
          <div class="preview-header">
            <h3>${companyName}</h3>
            <div class="preview-tags">
              <span class="job-tag ${jobCategory}">${jobCategory || 'uncategorized'}</span>
              <span class="job-tag">${jobType || 'Not specified'}</span>
              <span class="job-tag">${locationType || 'Not specified'}</span>
            </div>
          </div>
          <h2>${jobTitle}</h2>
          <div class="preview-description">
            <div class="markdown-preview">
              ${jobDescription.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div class="preview-footer">
            <div class="preview-payment">
              <i class="fas fa-coins"></i>
              <span>${paymentType || 'Not specified'}</span>
            </div>
            <div class="preview-date">
              <i class="far fa-clock"></i>
              <span>Will be posted today</span>
            </div>
          </div>
        </div>
      `;
      
      jobPreviewModal.style.display = 'block';
    });
  }
  
  // Close preview modal
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', function() {
      jobPreviewModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === jobPreviewModal) {
      jobPreviewModal.style.display = 'none';
    }
  });
  
  // Publish job from preview
  if (publishFromPreviewBtn) {
    publishFromPreviewBtn.addEventListener('click', function() {
      if (!connectedWalletAddress) {
        alert('Please connect your wallet to post a job.');
        jobPreviewModal.style.display = 'none';
        return;
      }
      
      // In real implementation, this would submit the job to AWS
      submitJobToAWS();
    });
  }
  
  // Submit job form
  if (jobForm) {
    jobForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!connectedWalletAddress) {
        alert('Please connect your wallet to post a job.');
        return;
      }
      
      submitJobToAWS();
    });
  }
  
  // Submit job to AWS with content moderation
  async function submitJobToAWS() {
    const submitButton = jobForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
      // Collect job data
      const jobData = {
        companyName: document.getElementById('company-name').value,
        jobTitle: document.getElementById('job-title').value,
        jobDescription: document.getElementById('job-description').value,
        category: document.getElementById('job-category-select').value,
        jobType: document.getElementById('job-type').value,
        paymentType: document.getElementById('payment-type').value,
        locationType: document.getElementById('location-type').value,
        applicationLink: document.getElementById('application-link').value,
        posterAddress: connectedWalletAddress
      };
      
      // Apply content moderation if available
      if (window.contentModerator) {
        try {
          // Check for sensitive info in job description
          const descResult = await window.contentModerator.moderateContent(jobData.jobDescription, {
            mode: 'flag',  // Just flag, don't modify yet
            context: 'job-submission'
          });
          
          // If critical severity, block submission
          if (descResult.moderated && descResult.metadata.severity === 'critical') {
            throw new Error('Your job posting contains sensitive blockchain information that should not be shared publicly. Please review and remove private keys, seed phrases, or full wallet addresses.');
          }
          
          // Apply redaction to sensitive fields before submission
          const redactedDesc = await window.contentModerator.moderateContent(jobData.jobDescription, {
            mode: 'redact',
            context: 'job-submission'
          });
          
          const redactedTitle = await window.contentModerator.moderateContent(jobData.jobTitle, {
            mode: 'redact',
            context: 'job-submission'
          });
          
          // Update with redacted content
          jobData.jobDescription = redactedDesc.modifiedContent;
          jobData.jobTitle = redactedTitle.modifiedContent;
          jobData.moderationApplied = redactedDesc.moderated || redactedTitle.moderated;
          
        } catch (error) {
          throw new Error(`Content moderation: ${error.message}`);
        }
      }
      
      // In real implementation, this would make an API call to AWS API Gateway
      // For demo, simulate a call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      jobPreviewModal.style.display = 'none';
      
      // Show success message
      alert('Your job has been successfully posted! It will be reviewed and published shortly.');
      
      // Reset the form
      jobForm.reset();
      
    } catch (error) {
      console.error('Error submitting job:', error);
      alert(`There was an error posting your job: ${error.message}`);
    } finally {
      // Reset button
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
  
  // Event Listeners
  if (searchButton) searchButton.addEventListener('click', searchJobs);
  if (jobSearchInput) jobSearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchJobs();
  });
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) loadJobs(jobSearchInput.value, jobCategorySelect.value, currentPage - 1);
  });
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) loadJobs(jobSearchInput.value, jobCategorySelect.value, currentPage + 1);
  });
  if (reloadBtn) reloadBtn.addEventListener('click', reloadJobs);
  
  // Character counter for job description
  const jobDescription = document.getElementById('job-description');
  const charCounter = document.querySelector('.char-counter');
  
  if (jobDescription && charCounter) {
    jobDescription.addEventListener('input', function() {
      const count = this.value.length;
      charCounter.textContent = `${count}/5000`;
      
      if (count > 5000) {
        charCounter.style.color = '#f44336';
        this.value = this.value.substring(0, 5000);
      } else {
        charCounter.style.color = '';
      }
    });
  }
  
  // Initialize
  initAWS();
});
