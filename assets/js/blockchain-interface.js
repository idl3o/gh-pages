// SimpleTokenChain Interface
document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const connectButton = document.getElementById('connect-button');
    const connectionStatus = document.getElementById('connection-status');
    const mintButton = document.getElementById('mint-button');
    const tokenMetadataInput = document.getElementById('token-metadata');
    const mintPriceDisplay = document.getElementById('mint-price');
    const tokenNameDisplay = document.getElementById('token-name');
    const tokenSymbolDisplay = document.getElementById('token-symbol');
    const totalSupplyDisplay = document.getElementById('total-supply');
    const blockCountDisplay = document.getElementById('block-count');
    const chainValidityDisplay = document.getElementById('chain-validity');
    const tokenListContainer = document.getElementById('tokenList');
    const blockListContainer = document.getElementById('blockList');
    
    // Contract details
    let provider;
    let signer;
    let currentAccount = null;
    let tokenChainContract = null;
    let contractAddress = null; // Will be set after deployment or read from config
    
    // Contract ABI - minimal version with only the functions we need
    const CONTRACT_ABI = [
        // Read functions
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function blockCount() view returns (uint256)",
        "function mintPrice() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function verifyChain() view returns (bool)",
        "function getBlock(uint256 blockNumber) view returns (tuple(uint256 blockNumber, uint256 timestamp, address minter, bytes32 previousBlockHash, bytes32 blockHash, string tokenMetadata))",
        "function getToken(uint256 tokenId) view returns (address, string)",
        "function tokenOwner(uint256) view returns (address)",
        
        // Write functions
        "function mint(string metadata) payable",
        "function transfer(address to, uint256 tokenId)",
        
        // Events
        "event BlockMined(uint256 indexed blockNumber, bytes32 blockHash)",
        "event TokenMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber)",
        "event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];
    
    // Initialize - connect button event
    connectButton.addEventListener('click', connectWallet);
    mintButton.addEventListener('click', mintToken);
    
    // Check if MetaMask is installed
    async function checkMetaMaskInstalled() {
        if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            return true;
        } else {
            connectionStatus.textContent = "MetaMask is not installed. Please install MetaMask to use this dApp.";
            connectButton.textContent = "Install MetaMask";
            connectButton.onclick = () => window.open("https://metamask.io/", "_blank");
            return false;
        }
    }
    
    // Connect wallet function
    async function connectWallet() {
        if (!await checkMetaMaskInstalled()) return;
        
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            connectionStatus.textContent = `Error connecting: ${error.message}`;
        }
    }
    
    // Handle accounts changed
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            connectionStatus.textContent = "No accounts connected. Please connect your wallet.";
            currentAccount = null;
            mintButton.disabled = true;
            disconnect();
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            connectionStatus.textContent = `Connected: ${formatAddress(currentAccount)}`;
            connectButton.textContent = "Change Account";
            
            // Setup contract
            setupContract();
        }
    }
    
    // Setup contract
    async function setupContract() {
        try {
            // For demo purposes, we'll look for the contract at a specific address
            // In a real app, you'd get this from a config file or deploy it
            contractAddress = localStorage.getItem('simpleTokenChainAddress');
            
            // If we don't have a contract address, we can't proceed
            if (!contractAddress) {
                mintPriceDisplay.textContent = "Contract not deployed. Deploy the contract first.";
                return;
            }
            
            // Create contract instance
            signer = provider.getSigner();
            tokenChainContract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
            
            // Enable mint button
            mintButton.disabled = false;
            
            // Update UI with contract info
            updateContractInfo();
            
            // Load user tokens and recent blocks
            loadUserTokens();
            loadRecentBlocks();
        } catch (error) {
            console.error("Error setting up contract:", error);
            connectionStatus.textContent = `Error setting up contract: ${error.message}`;
        }
    }
    
    // Update contract info
    async function updateContractInfo() {
        try {
            const name = await tokenChainContract.name();
            const symbol = await tokenChainContract.symbol();
            const totalSupply = await tokenChainContract.totalSupply();
            const blockCount = await tokenChainContract.blockCount();
            const mintPrice = await tokenChainContract.mintPrice();
            const chainValid = await tokenChainContract.verifyChain();
            
            tokenNameDisplay.textContent = name;
            tokenSymbolDisplay.textContent = symbol;
            totalSupplyDisplay.textContent = totalSupply.toString();
            blockCountDisplay.textContent = blockCount.toString();
            chainValidityDisplay.textContent = chainValid ? "Valid ✅" : "Invalid ❌";
            mintPriceDisplay.textContent = `Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`;
        } catch (error) {
            console.error("Error updating contract info:", error);
        }
    }
    
    // Load user tokens
    async function loadUserTokens() {
        try {
            const balance = await tokenChainContract.balanceOf(currentAccount);
            
            if (balance.eq(0)) {
                tokenListContainer.innerHTML = "<p>You don't own any tokens yet.</p>";
                return;
            }
            
            // Find which tokens the user owns
            tokenListContainer.innerHTML = "<p>Loading your tokens...</p>";
            const userTokens = [];
            const totalSupply = await tokenChainContract.totalSupply();
            
            for (let i = 0; i < totalSupply; i++) {
                const owner = await tokenChainContract.tokenOwner(i);
                if (owner.toLowerCase() === currentAccount.toLowerCase()) {
                    const tokenInfo = await tokenChainContract.getToken(i);
                    userTokens.push({
                        id: i,
                        metadata: tokenInfo[1]
                    });
                }
            }
            
            // Display tokens
            if (userTokens.length === 0) {
                tokenListContainer.innerHTML = "<p>You don't own any tokens yet.</p>";
            } else {
                let tokensHTML = "";
                userTokens.forEach(token => {
                    tokensHTML += `
                        <div class="card">
                            <div class="info-row">
                                <span>Token ID:</span>
                                <span>#${token.id}</span>
                            </div>
                            <div class="info-row">
                                <span>Metadata:</span>
                                <span>${token.metadata}</span>
                            </div>
                        </div>
                    `;
                });
                tokenListContainer.innerHTML = tokensHTML;
            }
        } catch (error) {
            console.error("Error loading tokens:", error);
            tokenListContainer.innerHTML = `<p>Error loading tokens: ${error.message}</p>`;
        }
    }
    
    // Load recent blocks
    async function loadRecentBlocks() {
        try {
            const blockCount = await tokenChainContract.blockCount();
            
            if (blockCount.eq(0)) {
                blockListContainer.innerHTML = "<p>No blocks in the chain yet.</p>";
                return;
            }
            
            // Load the last 5 blocks (or all if less than 5)
            blockListContainer.innerHTML = "<p>Loading recent blocks...</p>";
            const startBlock = Math.max(0, blockCount.toNumber() - 5);
            const blocks = [];
            
            for (let i = blockCount.toNumber() - 1; i >= startBlock; i--) {
                const block = await tokenChainContract.getBlock(i);
                blocks.push({
                    number: block.blockNumber.toString(),
                    timestamp: new Date(block.timestamp.toNumber() * 1000).toLocaleString(),
                    minter: block.minter,
                    metadata: block.tokenMetadata
                });
            }
            
            // Display blocks
            let blocksHTML = "";
            blocks.forEach(block => {
                blocksHTML += `
                    <div class="card">
                        <div class="info-row">
                            <span>Block #:</span>
                            <span>${block.number}</span>
                        </div>
                        <div class="info-row">
                            <span>Timestamp:</span>
                            <span>${block.timestamp}</span>
                        </div>
                        <div class="info-row">
                            <span>Minter:</span>
                            <span>${formatAddress(block.minter)}</span>
                        </div>
                        <div class="info-row">
                            <span>Metadata:</span>
                            <span>${block.metadata}</span>
                        </div>
                    </div>
                `;
            });
            blockListContainer.innerHTML = blocksHTML;
        } catch (error) {
            console.error("Error loading blocks:", error);
            blockListContainer.innerHTML = `<p>Error loading blocks: ${error.message}</p>`;
        }
    }
    
    // Mint token function
    async function mintToken() {
        try {
            // Get token metadata
            const metadata = tokenMetadataInput.value.trim();
            if (!metadata) {
                alert("Please enter token metadata");
                return;
            }
            
            // Get mint price
            const mintPrice = await tokenChainContract.mintPrice();
            
            // Disable button during minting
            mintButton.disabled = true;
            mintButton.textContent = "Minting...";
            
            // Call mint function
            const tx = await tokenChainContract.mint(metadata, { value: mintPrice });
            
            // Wait for transaction to be mined
            connectionStatus.textContent = "Minting token, please wait...";
            await tx.wait();
            
            // Update UI
            connectionStatus.textContent = `Connected: ${formatAddress(currentAccount)} | Token minted successfully!`;
            mintButton.textContent = "Mint Token";
            mintButton.disabled = false;
            tokenMetadataInput.value = "";
            
            // Update contract info, user tokens and recent blocks
            updateContractInfo();
            loadUserTokens();
            loadRecentBlocks();
        } catch (error) {
            console.error("Error minting token:", error);
            connectionStatus.textContent = `Error minting token: ${error.message}`;
            mintButton.textContent = "Mint Token";
            mintButton.disabled = false;
        }
    }
    
    // Disconnect function
    function disconnect() {
        tokenChainContract = null;
        currentAccount = null;
        connectionStatus.textContent = "Not connected";
        connectButton.textContent = "Connect Wallet";
        mintButton.disabled = true;
        
        // Reset displays
        tokenNameDisplay.textContent = "Not connected";
        tokenSymbolDisplay.textContent = "Not connected";
        totalSupplyDisplay.textContent = "Not connected";
        blockCountDisplay.textContent = "Not connected";
        chainValidityDisplay.textContent = "Not connected";
        tokenListContainer.innerHTML = "<p>Connect wallet to view your tokens</p>";
        blockListContainer.innerHTML = "<p>Connect wallet to view recent blocks</p>";
    }
    
    // Helper functions
    function formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    // Check for MetaMask and previous connection on page load
    async function init() {
        if (await checkMetaMaskInstalled()) {
            try {
                // Check if already connected
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    handleAccountsChanged(accounts);
                }
            } catch (error) {
                console.error("Error checking accounts:", error);
            }
        }
    }
    
    // Initialize on page load
    init();
});