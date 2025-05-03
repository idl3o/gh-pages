import { useState, useEffect, useCallback } from 'react';
import Web3Service from '../services/Web3Service';

interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  network: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    network: null,
    isConnecting: false,
    error: null,
  });

  const resetWalletState = () => {
    setWalletState({
      address: null,
      balance: null,
      isConnected: false,
      network: null,
      isConnecting: false,
      error: null,
    });
  };

  const connectWallet = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const address = await Web3Service.connect();
      
      if (address) {
        const balance = await Web3Service.getBalance(address);
        const network = await Web3Service.getNetwork();
        
        setWalletState({
          address,
          balance,
          isConnected: true,
          network,
          isConnecting: false,
          error: null,
        });
        
        // Store connection info in local storage
        localStorage.setItem('walletConnected', 'true');
      } else {
        setWalletState({
          address: null,
          balance: null,
          isConnected: false,
          network: null,
          isConnecting: false,
          error: 'Failed to connect wallet',
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletState({
        address: null,
        balance: null,
        isConnected: false,
        network: null,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error connecting to wallet',
      });
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await Web3Service.disconnect();
      resetWalletState();
      
      // Remove connection info from local storage
      localStorage.removeItem('walletConnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error disconnecting wallet',
      }));
    }
  }, []);

  const updateBalance = useCallback(async () => {
    if (walletState.address && walletState.isConnected) {
      try {
        const balance = await Web3Service.getBalance(walletState.address);
        setWalletState(prev => ({ ...prev, balance }));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  }, [walletState.address, walletState.isConnected]);

  const sendTransaction = async (to: string, amount: string) => {
    try {
      setWalletState(prev => ({ ...prev, error: null }));
      const tx = await Web3Service.sendTransaction(to, amount);
      
      // Update balance after transaction
      await updateBalance();
      
      return tx;
    } catch (error) {
      console.error('Error sending transaction:', error);
      setWalletState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error sending transaction',
      }));
      throw error;
    }
  };

  // Effect to restore connection on page load
  useEffect(() => {
    const isWalletConnected = localStorage.getItem('walletConnected') === 'true';
    
    if (isWalletConnected) {
      connectWallet();
    }
  }, [connectWallet]);

  // Effect to listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (accounts[0] !== walletState.address) {
        // User switched account
        if (walletState.isConnected) {
          try {
            const balance = await Web3Service.getBalance(accounts[0]);
            setWalletState(prev => ({
              ...prev,
              address: accounts[0],
              balance,
            }));
          } catch (error) {
            console.error('Error updating account info:', error);
          }
        }
      }
    };

    const handleChainChanged = async (chainId: string) => {
      // Reload the page on chain change as recommended by MetaMask
      window.location.reload();
    };

    if (walletState.isConnected) {
      Web3Service.listenForAccountChanges(handleAccountsChanged);
      Web3Service.listenForChainChanges(handleChainChanged);
    }
  }, [walletState.address, walletState.isConnected, disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    updateBalance,
  };
}

export default useWallet;