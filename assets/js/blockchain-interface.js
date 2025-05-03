/**
 * SimpleTokenChain Blockchain Interface
 * Connects the frontend to the SimpleTokenChain smart contract
 */

// Contract information
let contractAddress;
let contract;
let provider;
let signer;
let userAddress;
let isConnected = false;

// DOM elements
const connectButton = document.getElementById('connect-button');
const connectionStatus = document.getElementById('connection-status');
const mintButton = document.getElementById('mint-button');
const tokenMetadataInput = document.getElementById('token-metadata');
const tokenNameDisplay = document.getElementById('token-name');
const tokenSymbolDisplay = document.getElementById('token-symbol');
const totalSupplyDisplay = document.getElementById('total-supply');
const blockCountDisplay = document.getElementById('block-count');
const chainValidityDisplay = document.getElementById('chain-validity');
const mintPriceDisplay = document.getElementById('mint-price');
const tokenListElement = document.getElementById('tokenList');
const blockListElement = document.getElementById('blockList');

// Initialize the blockchain interface on page load
window.addEventListener('load', async () => {
    // Check if MetaMask is installed
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Try to get contract address from localStorage
        contractAddress = localStorage.getItem('simpleTokenChainAddress');
        
        // If not found in localStorage, try to load from deployment file
        if (!contractAddress) {
            try {
                const response = await fetch('./assets/js/deployment-info.json');
                const data = await response.json();
                contractAddress = data.contractAddress;
                localStorage.setItem('simpleTokenChainAddress', contractAddress);
            } catch (error) {
                console.error("Error loading deployment info:", error);
                setConnectionStatus('Contract address not available. Please deploy the contract first.', 'error');
                return;
            }
        }
        
        setConnectionStatus('Please connect your wallet', 'warning');
    } else {
        setConnectionStatus('MetaMask is not installed. Please install it to use this application.', 'error');
        connectButton.disabled = true;
    }
    
    // Set up event listeners
    connectButton.addEventListener('click', connectWallet);
    mintButton.addEventListener('click', mintToken);
});

// Connect wallet function
async function connectWallet() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        
        // Create signer and contract instance
        signer = provider.getSigner();
        setupContract();
        
        // Update UI
        isConnected = true;
        setConnectionStatus(`Connected: ${formatAddress(userAddress)}`, 'success');
        connectButton.textContent = 'Wallet Connected';
        connectButton.disabled = true;
        mintButton.disabled = false;
        
        // Load blockchain data
        loadBlockchainData();
        loadUserTokens();
        loadRecentBlocks();
        
        // Set up listeners for account changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', () => window.location.reload());
    } catch (error) {
        console.error("Connection error:", error);
        setConnectionStatus('Failed to connect wallet. Please try again.', 'error');
    }
}

// Set up contract instance
function setupContract() {
    const SimpleTokenChainABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function blockCount() view returns (uint256)",
        "function mintPrice() view returns (uint256)",
        "function verifyChain() view returns (bool)",
        "function balanceOf(address) view returns (uint256)",
        "function tokenOwner(uint256) view returns (address)",
        "function getBlock(uint256) view returns (tuple(uint256 blockNumber, uint256 timestamp, address minter, bytes32 previousBlockHash, bytes32 blockHash, string tokenMetadata))",
        "function getToken(uint256) view returns (address, string)",
        "function mint(string) payable returns (uint256)",
        "function transfer(address, uint256)",
        "event BlockMined(uint256 indexed blockNumber, bytes32 blockHash)",
        "event TokenMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber)",
        "event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];
    
    contract = new ethers.Contract(contractAddress, SimpleTokenChainABI, signer);
}

// Handle account change
function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        isConnected = false;
        setConnectionStatus('Wallet disconnected. Please connect again.', 'warning');
        connectButton.textContent = 'Connect Wallet';
        connectButton.disabled = false;
        mintButton.disabled = true;
        userAddress = null;
    } else if (accounts[0] !== userAddress) {
        // User switched accounts
        userAddress = accounts[0];
        setConnectionStatus(`Connected: ${formatAddress(userAddress)}`, 'success');
        loadUserTokens();
    }
}

// Load blockchain data
async function loadBlockchainData() {
    try {
        // Get token name and symbol
        const name = await contract.name();
        const symbol = await contract.symbol();
        tokenNameDisplay.textContent = name;
        tokenSymbolDisplay.textContent = symbol;
        
        // Get total supply and block count
        const totalSupply = await contract.totalSupply();
        const blockCount = await contract.blockCount();
        totalSupplyDisplay.textContent = totalSupply.toString();
        blockCountDisplay.textContent = blockCount.toString();
        
        // Verify chain
        const isValid = await contract.verifyChain();
        chainValidityDisplay.textContent = isValid ? 'Valid ✅' : 'Invalid ❌';
        
        // Get mint price
        const mintPrice = await contract.mintPrice();
        mintPriceDisplay.textContent = `Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`;
    } catch (error) {
        console.error("Error loading blockchain data:", error);
        setConnectionStatus('Error loading blockchain data. Please refresh and try again.', 'error');
    }
}

// Load user tokens
async function loadUserTokens() {
    if (!isConnected) return;
    
    try {
        // Get user's token balance
        const balance = await contract.balanceOf(userAddress);
        
        if (balance.toNumber() === 0) {
            tokenListElement.innerHTML = '<p>You don\'t own any tokens yet. Mint some!</p>';
            return;
        }
        
        // Clear existing tokens
        tokenListElement.innerHTML = '';
        
        // We need to iterate through all tokens to find which ones the user owns
        const totalSupply = await contract.totalSupply();
        
        let userTokens = [];
        for (let i = 0; i < totalSupply; i++) {
            const owner = await contract.tokenOwner(i);
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
                userTokens.push(i);
                
                if (userTokens.length >= balance) {
                    break; // We found all user's tokens
                }
            }
        }
        
        // Display user's tokens
        for (const tokenId of userTokens) {
            const [, metadata] = await contract.getToken(tokenId);
            
            const tokenCard = document.createElement('div');
            tokenCard.className = 'card';
            tokenCard.innerHTML = `
                <div class="info-row">
                    <span>Token ID:</span>
                    <span>${tokenId}</span>
                </div>
                <div class="info-row">
                    <span>Metadata:</span>
                    <span>${metadata}</span>
                </div>
                <button class="transfer-button" data-token-id="${tokenId}">Transfer Token</button>
            `;
            
            // Add transfer functionality
            const transferButton = tokenCard.querySelector('.transfer-button');
            transferButton.addEventListener('click', () => showTransferDialog(tokenId));
            
            tokenListElement.appendChild(tokenCard);
        }
    } catch (error) {
        console.error("Error loading user tokens:", error);
        tokenListElement.innerHTML = '<p>Error loading tokens. Please try again.</p>';
    }
}

// Load recent blocks
async function loadRecentBlocks() {
    if (!isConnected) return;
    
    try {
        // Get block count
        const blockCount = await contract.blockCount();
        
        if (blockCount.toNumber() === 0) {
            blockListElement.innerHTML = '<p>No blocks in the chain yet.</p>';
            return;
        }
        
        // Clear existing blocks
        blockListElement.innerHTML = '';
        
        // Get most recent 5 blocks (or less if there aren't 5 yet)
        const blocksToShow = Math.min(blockCount.toNumber(), 5);
        
        for (let i = blockCount.toNumber() - 1; i >= blockCount.toNumber() - blocksToShow; i--) {
            const block = await contract.getBlock(i);
            
            const blockCard = document.createElement('div');
            blockCard.className = 'card';
            blockCard.innerHTML = `
                <div class="info-row">
                    <span>Block Number:</span>
                    <span>${block.blockNumber}</span>
                </div>
                <div class="info-row">
                    <span>Timestamp:</span>
                    <span>${new Date(block.timestamp.toNumber() * 1000).toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span>Minted By:</span>
                    <span>${formatAddress(block.minter)}</span>
                </div>
                <div class="info-row">
                    <span>Token Metadata:</span>
                    <span>${block.tokenMetadata}</span>
                </div>
            `;
            
            blockListElement.appendChild(blockCard);
        }
    } catch (error) {
        console.error("Error loading recent blocks:", error);
        blockListElement.innerHTML = '<p>Error loading blocks. Please try again.</p>';
    }
}

// Mint token function
async function mintToken() {
    if (!isConnected) return;
    
    const metadata = tokenMetadataInput.value.trim();
    if (!metadata) {
        alert('Please enter token metadata');
        return;
    }
    
    try {
        mintButton.disabled = true;
        mintButton.textContent = 'Minting...';
        
        const mintPrice = await contract.mintPrice();
        const tx = await contract.mint(metadata, { value: mintPrice });
        
        setConnectionStatus('Minting in progress. Please wait for confirmation...', 'info');
        
        // Wait for the transaction to be mined
        await tx.wait();
        
        setConnectionStatus(`Token minted successfully! Transaction: ${tx.hash}`, 'success');
        
        // Clear input
        tokenMetadataInput.value = '';
        
        // Reload data
        loadBlockchainData();
        loadUserTokens();
        loadRecentBlocks();
    } catch (error) {
        console.error("Error minting token:", error);
        setConnectionStatus('Failed to mint token. Please try again.', 'error');
    } finally {
        mintButton.disabled = false;
        mintButton.textContent = 'Mint Token';
    }
}

// Show transfer dialog
function showTransferDialog(tokenId) {
    const recipient = prompt('Enter recipient address:');
    if (!recipient) return;
    
    if (!ethers.utils.isAddress(recipient)) {
        alert('Invalid Ethereum address');
        return;
    }
    
    transferToken(tokenId, recipient);
}

// Transfer token function
async function transferToken(tokenId, recipient) {
    try {
        setConnectionStatus('Transferring token. Please confirm the transaction...', 'info');
        
        const tx = await contract.transfer(recipient, tokenId);
        await tx.wait();
        
        setConnectionStatus(`Token transferred successfully! Transaction: ${tx.hash}`, 'success');
        
        // Reload user tokens
        loadUserTokens();
    } catch (error) {
        console.error("Error transferring token:", error);
        setConnectionStatus('Failed to transfer token. Please try again.', 'error');
    }
}

// Helper functions
function formatAddress(address) {
    return `${address.substr(0, 6)}...${address.substr(-4)}`;
}

function setConnectionStatus(message, type) {
    connectionStatus.textContent = message;
    
    // Reset classes
    connectionStatus.className = '';
    
    // Add appropriate class
    switch (type) {
        case 'error':
            connectionStatus.classList.add('status-error');
            break;
        case 'success':
            connectionStatus.classList.add('status-success');
            break;
        case 'warning':
            connectionStatus.classList.add('status-warning');
            break;
        case 'info':
            connectionStatus.classList.add('status-info');
            break;
    }
}