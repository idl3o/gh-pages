import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { useToast } from './ToastContext';

// Create auth context
const AuthContext = createContext();

/**
 * Authentication Provider for managing user authentication state
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  
  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUserData();
          setCurrentUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  /**
   * Connect and authenticate with Web3 wallet
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.showError('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      return null;
    }
    
    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts from wallet
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Login with the provider
      const { user } = await authService.loginWithWeb3(provider);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.showSuccess('Wallet connected successfully!');
      
      return user;
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.showError(error.message || 'Failed to connect wallet');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Login with authentication token
   */
  const loginWithToken = useCallback(async (token) => {
    try {
      setIsLoading(true);
      const user = await authService.loginWithToken(token);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.showSuccess('Login successful!');
      
      return user;
    } catch (error) {
      console.error('Token login error:', error);
      toast.showError(error.message || 'Invalid authentication token');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Login with Firebase token
   */
  const loginWithFirebase = useCallback(async (firebaseToken) => {
    try {
      setIsLoading(true);
      const user = await authService.loginWithFirebase(firebaseToken);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.showSuccess('Firebase login successful!');
      
      return user;
    } catch (error) {
      console.error('Firebase login error:', error);
      toast.showError(error.message || 'Firebase authentication failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  /**
   * Logout user
   */
  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.showInfo('You have been logged out');
  }, [toast]);
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    connectWallet,
    loginWithToken,
    loginWithFirebase,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
