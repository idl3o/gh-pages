import React, { useState } from 'react';
import TokenLogin from './TokenLogin';
import FirebaseTokenLogin from './FirebaseTokenLogin';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState('web3');
  const { isAuthenticated } = useAuth();
  
  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="login-page">
      <div className="login-method-tabs">
        <button 
          className={`tab ${loginMethod === 'web3' ? 'active' : ''}`}
          onClick={() => setLoginMethod('web3')}
        >
          Web3 Login
        </button>
        <button 
          className={`tab ${loginMethod === 'token' ? 'active' : ''}`}
          onClick={() => setLoginMethod('token')}
        >
          Token Login
        </button>
        <button 
          className={`tab ${loginMethod === 'firebase' ? 'active' : ''}`}
          onClick={() => setLoginMethod('firebase')}
        >
          Firebase Login
        </button>
      </div>
      
      <div className="login-form-container">
        {loginMethod === 'web3' && (
          <div className="web3-login">
            {/* Web3 Login Component would go here */}
            <button className="connect-wallet-button">Connect Wallet</button>
          </div>
        )}
        
        {loginMethod === 'token' && <TokenLogin />}
        
        {loginMethod === 'firebase' && <FirebaseTokenLogin />}
      </div>
    </div>
  );
};

export default LoginPage;
