/**
 * Authentication Service for Web3 Crypto Streaming Platform
 */
import { ethers } from 'ethers';
import axios from 'axios';
import { setItem, getItem, removeItem } from '../utils/storage';

// Constants
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.cryptostreaming.com';

/**
 * Check if user is authenticated with a valid token
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = getItem(AUTH_TOKEN_KEY);
  const expiry = getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return false;
  
  // Check if token is expired
  const expiryDate = new Date(parseInt(expiry, 10));
  const now = new Date();
  
  return now < expiryDate;
};

/**
 * Get current authentication token
 * @returns {string|null} Auth token if available
 */
export const getAuthToken = () => {
  return getItem(AUTH_TOKEN_KEY);
};

/**
 * Get stored user data
 * @returns {object|null} User data object or null if not logged in
 */
export const getUserData = () => {
  const userData = getItem(USER_DATA_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

/**
 * Login with Web3 wallet
 * @param {object} provider - Ethers provider (e.g., from MetaMask)
 * @returns {Promise<object>} User data and token
 */
export const loginWithWeb3 = async (provider) => {
  try {
    // Get signer from provider
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Get auth challenge from server
    const challengeResponse = await axios.get(`${API_BASE_URL}/auth/challenge?address=${address}`);
    const { challenge } = challengeResponse.data;
    
    // Sign challenge with wallet
    const signature = await signer.signMessage(challenge);
    
    // Verify signature with backend
    const authResponse = await axios.post(`${API_BASE_URL}/auth/verify`, {
      address,
      challenge,
      signature
    });
    
    const { token, expiresIn, user } = authResponse.data;
    
    // Calculate expiry timestamp
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    
    // Store authentication data
    setItem(AUTH_TOKEN_KEY, token);
    setItem(TOKEN_EXPIRY_KEY, expiryDate.getTime().toString());
    setItem(USER_DATA_KEY, JSON.stringify(user));
    
    // Set authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, user };
  } catch (error) {
    console.error('Web3 authentication error:', error);
    throw new Error(error.response?.data?.message || 'Authentication failed');
  }
};

/**
 * Login with authentication token
 * @param {string} token - Authentication token
 * @returns {Promise<object>} User data
 */
export const loginWithToken = async (token) => {
  try {
    // Verify token with server
    const response = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { user, expiresIn } = response.data;
    
    // Calculate expiry timestamp
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    
    // Store authentication data
    setItem(AUTH_TOKEN_KEY, token);
    setItem(TOKEN_EXPIRY_KEY, expiryDate.getTime().toString());
    setItem(USER_DATA_KEY, JSON.stringify(user));
    
    // Set authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  } catch (error) {
    console.error('Token authentication error:', error);
    throw new Error(error.response?.data?.message || 'Invalid token');
  }
};

/**
 * Login with Firebase auth token
 * @param {string} firebaseToken - Firebase authentication token
 * @returns {Promise<object>} User data
 */
export const loginWithFirebase = async (firebaseToken) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/firebase`, {
      token: firebaseToken
    });
    
    const { token, expiresIn, user } = response.data;
    
    // Calculate expiry timestamp
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    
    // Store authentication data
    setItem(AUTH_TOKEN_KEY, token);
    setItem(TOKEN_EXPIRY_KEY, expiryDate.getTime().toString());
    setItem(USER_DATA_KEY, JSON.stringify(user));
    
    // Set authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  } catch (error) {
    console.error('Firebase authentication error:', error);
    throw new Error(error.response?.data?.message || 'Firebase authentication failed');
  }
};

/**
 * Logout user and clear authentication data
 */
export const logout = () => {
  removeItem(AUTH_TOKEN_KEY);
  removeItem(USER_DATA_KEY);
  removeItem(TOKEN_EXPIRY_KEY);
  
  // Remove authorization header
  delete axios.defaults.headers.common['Authorization'];
};

/**
 * Attach authentication header to axios interceptor
 */
export const setupAuthInterceptor = () => {
  const token = getItem(AUTH_TOKEN_KEY);
  
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Initialize axios interceptor
setupAuthInterceptor();
