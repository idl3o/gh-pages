/**
 * Registration functionality for Web3 Crypto Streaming Platform
 */

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  const connectWalletBtn = document.getElementById('connect-wallet');
  const walletAddressField = document.getElementById('wallet-address');
  const walletConnectedStatus = document.getElementById('wallet-connected');
  const submitButton = document.getElementById('submit-registration');
  const loadingIndicator = document.getElementById('loading-indicator');
  const formErrorMessage = document.getElementById('form-error');
  const formSuccessMessage = document.getElementById('form-success');
  
  // Check if wallet was previously connected
  const checkWalletConnection = async () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      updateWalletUI(window.ethereum.selectedAddress);
    }
  };
  
  // Update UI with connected wallet info
  const updateWalletUI = (address) => {
    if (address) {
      walletAddressField.value = address;
      walletConnectedStatus.textContent = `Connected: ${formatAddress(address)}`;
      walletConnectedStatus.classList.remove('hidden');
      connectWalletBtn.textContent = 'Change Wallet';
      
      // Enable submit button if form is valid
      if (validateForm()) {
        submitButton.disabled = false;
      }
    }
  };
  
  // Format address for display
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Connect wallet handler
  const connectWallet = async () => {
    if (!window.ethereum) {
      showError('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        updateWalletUI(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showError('Failed to connect wallet. ' + (error.message || 'Please try again.'));
    }
  };
  
  // Validate registration form
  const validateForm = () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const walletAddress = walletAddressField.value;
    const termsCheck = document.getElementById('terms').checked;
    
    // Basic form validation
    if (!name || !email || !walletAddress || !termsCheck) {
      return false;
    }
    
    // Email format validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
      return false;
    }
    
    // Wallet address validation (basic check)
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return false;
    }
    
    return true;
  };
  
  // Show error message
  const showError = (message) => {
    formErrorMessage.textContent = message;
    formErrorMessage.classList.remove('hidden');
    setTimeout(() => {
      formErrorMessage.classList.add('hidden');
    }, 5000);
  };
  
  // Show success message
  const showSuccess = (message) => {
    formSuccessMessage.textContent = message;
    formSuccessMessage.classList.remove('hidden');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fill in all required fields correctly.');
      return;
    }
    
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      walletAddress: walletAddressField.value,
      username: document.getElementById('username').value || undefined,
      bio: document.getElementById('bio').value || undefined
    };
    
    try {
      // Show loading state
      submitButton.disabled = true;
      loadingIndicator.classList.remove('hidden');
      
      // Call registration API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Success - clear form and show message
      registerForm.reset();
      showSuccess('Registration successful! Redirecting to dashboard...');
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      showError(error.message || 'Registration failed. Please try again.');
      
    } finally {
      submitButton.disabled = false;
      loadingIndicator.classList.add('hidden');
    }
  };
  
  // Attach event listeners
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', connectWallet);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleSubmit);
  }
  
  // Initialize form
  checkWalletConnection();
  submitButton.disabled = !validateForm();
  
  // Live validation
  document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      submitButton.disabled = !validateForm();
    });
  });
  
  // Listen for account changes in MetaMask
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        updateWalletUI(accounts[0]);
      } else {
        walletAddressField.value = '';
        walletConnectedStatus.classList.add('hidden');
        connectWalletBtn.textContent = 'Connect Wallet';
        submitButton.disabled = true;
      }
    });
  }
});