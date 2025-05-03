import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Token-based authentication component
 */
const TokenLogin = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if token is in URL (from redirection)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      handleLogin(tokenParam);
    }
  }, [location]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, location]);
  
  /**
   * Handle token login process
   */
  const handleLogin = async (tokenToUse) => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithToken(tokenToUse);
      // Redirect handled by the auth state effect
    } catch (error) {
      setError(error.message || 'Invalid authentication token. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Form submission handler
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter an authentication token');
      return;
    }
    
    handleLogin(token.trim());
  };
  
  return (
    <div className="login-container">
      <h2>Access with Token</h2>
      <p>Enter your authentication token to access your account</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="auth-token">Authentication Token</label>
          <input
            type="password" 
            id="auth-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your authentication token here"
            disabled={isLoading}
            className="form-control"
          />
        </div>
        
        <button 
          type="submit" 
          className="primary-button w-100" 
          disabled={isLoading || !token.trim()}
        >
          {isLoading ? 'Authenticating...' : 'Continue with Token'}
        </button>
      </form>
      
      <div className="help-text mt-3">
        <p>Don't have a token? <a href="/register">Sign up</a> or <a href="/login">try another login method</a>.</p>
      </div>
    </div>
  );
};

export default TokenLogin;
