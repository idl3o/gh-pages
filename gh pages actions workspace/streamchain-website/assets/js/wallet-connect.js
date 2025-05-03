// This file includes JavaScript code for connecting to a cryptocurrency wallet, handling user interactions related to wallet connectivity.

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.querySelector('.connect-wallet-btn');

    connectWalletBtn.addEventListener('click', async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access if needed
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Connected:', accounts[0]);
                // You can add additional logic here to handle the connected wallet
            } catch (error) {
                console.error('User denied account access or error occurred:', error);
            }
        } else {
            console.error('MetaMask is not installed. Please install it to use this feature.');
        }
    });
});