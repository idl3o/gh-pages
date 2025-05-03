import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const FirebaseTokenLogin = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithFirebase } = useAuth();

  // Check if token is in URL (from redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('firebase_token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      handleLogin(tokenFromUrl);
    }
  }, []);

  const handleLogin = async (tokenToUse) => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithFirebase(tokenToUse);
      // Successful login - redirect will be handled by protected route
    } catch (error) {
      setError(error.message || 'Failed to authenticate with Firebase. Please check your token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a Firebase token');
      return;
    }
    
    handleLogin(token.trim());
  };

  // Validate token format
  const isValidJWT = (token) => {
    const parts = token.split('.');
    return parts.length === 3;
  };

  return (
    <div className="login-container">
      <h2>Sign in with Firebase</h2>
      <p>Enter your Firebase authentication token to continue</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firebase-token">Firebase Token</label>
          <input
            type="password"
            id="firebase-token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              // Reset error if token looks valid
              if (isValidJWT(e.target.value)) {
                setError('');
              }
            }}
            placeholder="Paste your Firebase JWT token here"
            disabled={isLoading}
          />
          {token && !isValidJWT(token) && (
            <div className="validation-error">Token format appears to be invalid</div>
          )}
        </div>
        <button 
          type="submit" 
          className="login-button" 
          disabled={isLoading || (token && !isValidJWT(token))}
        >
          {isLoading ? 'Signing in...' : 'Sign In with Firebase'}
        </button>
      </form>
      
      <div className="help-text">
        <p>Need help? <a href="https://firebase.google.com/docs/auth/admin/create-custom-tokens" target="_blank" rel="noreferrer">Learn how to get your Firebase token</a></p>
      </div>
    </div>
  );
};

export default FirebaseTokenLogin;
