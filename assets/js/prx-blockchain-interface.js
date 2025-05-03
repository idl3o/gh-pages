// PRX Blockchain Interface
document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements - Dashboard
    const connectButton = document.getElementById('connect-button');
    const connectionStatus = document.getElementById('connection-status');
    const alertArea = document.getElementById('alert-area');
    const tokenNameDisplay = document.getElementById('token-name');
    const tokenSymbolDisplay = document.getElementById('token-symbol');
    const totalSupplyDisplay = document.getElementById('total-supply');
    const blockCountDisplay = document.getElementById('block-count');
    const chainValidityDisplay = document.getElementById('chain-validity');
    const mintPriceDisplay = document.getElementById('mint-price');
    const recentActivityContainer = document.getElementById('recent-activity');
    const blockList = document.getElementById('blockList');
    const tokenList = document.getElementById('tokenList');
    
    // DOM elements - Mint
    const mintForm = document.getElementById('mint-form');
    const tokenMetadataInput = document.getElementById('token-metadata');
    const contentUriInput = document.getElementById('content-uri');
    const contentTypeSelect = document.getElementById('content-type');
    const isPrivateCheckbox = document.getElementById('is-private');
    const mintPriceLabel = document.getElementById('mint-price-display');
    const mintButton = document.getElementById('mint-button');
    
    // DOM elements - Explorer
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const searchResultsContent = document.getElementById('search-results-content');
    
    // DOM elements - Governance
    const activeProposalsContainer = document.getElementById('active-proposals');
    const proposalForm = document.getElementById('proposal-form');
    const proposalDescriptionInput = document.getElementById('proposal-description');
    const votingPeriodInput = document.getElementById('voting-period');
    const createProposalButton = document.getElementById('create-proposal-button');
    const proposalCountDisplay = document.getElementById('proposal-count');
    const proposalStakeDisplay = document.getElementById('proposal-stake');
    const minVotingPeriodDisplay = document.getElementById('min-voting-period');
    const governanceThresholdDisplay = document.getElementById('governance-threshold');
    
    // DOM elements - My Assets
    const userTokensContainer = document.getElementById('user-tokens');
    const linkContentForm = document.getElementById('link-content-form');
    const sourceTokenSelect = document.getElementById('source-token');
    const targetTokenSelect = document.getElementById('target-token');
    const linkContentButton = document.getElementById('link-content-button');
    
    // Contract details
    let provider;
    let signer;
    let currentAccount = null;
    let prxContract = null;
    let contractAddress = null;
    let chainVisualizer = null;
    
    // Event listeners
    connectButton.addEventListener('click', connectWallet);
    mintForm.addEventListener('submit', handleMintSubmit);
    searchButton.addEventListener('click', handleSearch);
    proposalForm.addEventListener('submit', handleProposalSubmit);
    linkContentForm.addEventListener('submit', handleLinkContent);
    
    // Contract ABI - defining the functions we'll need from PRXTokenChain
    const CONTRACT_ABI = [
        // Read functions - Base
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
        
        // Read functions - PRX extensions
        "function prxMetadata(uint256 tokenId) view returns (string contentURI, string contentType, address creator, uint256 creationBlock, bool isPrivate, uint256[] linkedTokens)",
        "function getLinkedContent(uint256 tokenId) view returns (uint256[])",
        "function canAccessContent(address user, uint256 tokenId) view returns (bool)",
        "function proposalCount() view returns (uint256)",
        "function minimumVotingPeriod() view returns (uint256)",
        "function minimumVotesRequired() view returns (uint256)",
        "function governanceThreshold() view returns (uint256)",
        "function proposals(uint256 proposalId) view returns (uint256 id, string description, address proposer, uint256 startTime, uint256 endTime, bool executed, bool passed, uint256 forVotes, uint256 againstVotes)",
        
        // Write functions - Base
        "function mint(string metadata) payable",
        "function transfer(address to, uint256 tokenId)",
        
        // Write functions - PRX extensions
        "function mintWithContent(string metadata, string contentURI, string contentType, bool isPrivate) payable",
        "function linkContent(uint256 tokenId, uint256 linkedTokenId)",
        "function createProposal(string description, uint256 votingPeriod, bytes executionData)",
        "function vote(uint256 proposalId, bool support)",
        "function executeProposal(uint256 proposalId)",
        
        // Events
        "event BlockMined(uint256 indexed blockNumber, bytes32 blockHash)",
        "event TokenMinted(uint256 indexed tokenId, address indexed owner, uint256 blockNumber)",
        "event TokenTransferred(address indexed from, address indexed to, uint256 indexed tokenId)",
        "event ContentLinked(uint256 indexed tokenId, string contentURI, string contentType)",
        "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime)",
        "event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
        "event ProposalExecuted(uint256 indexed proposalId, bool passed)"
    ];
    
    // Initialize
    initApplication();
    
    // Check if MetaMask is installed
    async function checkMetaMaskInstalled() {
        if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            return true;
        } else {
            showAlert('MetaMask is not installed. Please install MetaMask to use this application.', 'danger');
            connectButton.textContent = "Install MetaMask";
            connectButton.onclick = () => window.open("https://metamask.io/", "_blank");
            return false;
        }
    }
    
    // Connect wallet
    async function connectWallet() {
        if (!await checkMetaMaskInstalled()) return;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            showAlert(`Error connecting: ${error.message}`, 'danger');
        }
    }
    
    // Handle accounts changed
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            connectionStatus.textContent = "Not connected";
            currentAccount = null;
            mintButton.disabled = true;
            createProposalButton.disabled = true;
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
            // For demo, use localStorage to store contract address
            // In production, this would come from a config file
            contractAddress = localStorage.getItem('prxTokenChainAddress');
            
            if (!contractAddress) {
                showAlert('Contract address not found. Please deploy the PRXTokenChain contract first.', 'warning');
                return;
            }
            
            signer = provider.getSigner();
            prxContract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
            
            // Enable UI controls
            mintButton.disabled = false;
            createProposalButton.disabled = false;
            sourceTokenSelect.disabled = false;
            targetTokenSelect.disabled = false;
            linkContentButton.disabled = false;
            
            // Update UI with contract info
            await updateContractInfo();
            
            // Load data for all tabs
            await loadDashboardData();
            await loadExplorerData();
            await loadGovernanceData();
            await loadUserTokens();
            
            // Initialize chain visualizer
            initChainVisualizer();
            
            // Setup event listeners for contract events
            setupEventListeners();
            
            showAlert('Connected to PRX blockchain successfully!', 'success');
        } catch (error) {
            console.error("Error setting up contract:", error);
            showAlert(`Error setting up contract: ${error.message}`, 'danger');
        }
    }
    
    // Update contract info
    async function updateContractInfo() {
        try {
            const name = await prxContract.name();
            const symbol = await prxContract.symbol();
            const totalSupply = await prxContract.totalSupply();
            const blockCount = await prxContract.blockCount();
            const mintPrice = await prxContract.mintPrice();
            const chainValid = await prxContract.verifyChain();
            
            tokenNameDisplay.textContent = name;
            tokenSymbolDisplay.textContent = symbol;
            totalSupplyDisplay.textContent = totalSupply.toString();
            blockCountDisplay.textContent = blockCount.toString();
            chainValidityDisplay.textContent = chainValid ? "Valid ✅" : "Invalid ❌";
            mintPriceDisplay.textContent = `Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`;
            mintPriceLabel.textContent = `Mint Price: ${ethers.utils.formatEther(mintPrice)} ETH`;
            
            document.title = `${name} (${symbol}) - PRX Blockchain GUI`;
        } catch (error) {
            console.error("Error updating contract info:", error);
        }
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Recent activity (last 5 events)
            const blockCount = await prxContract.blockCount();
            const totalSupply = await prxContract.totalSupply();
            
            // Show most recent blocks (up to 5)
            const startBlock = Math.max(0, blockCount.toNumber() - 5);
            const recentActivity = [];
            
            for (let i = blockCount.toNumber() - 1; i >= startBlock; i--) {
                try {
                    const block = await prxContract.getBlock(i);
                    
                    if (i === 0) {
                        recentActivity.push({
                            type: 'genesis',
                            timestamp: new Date(block.timestamp.toNumber() * 1000),
                            message: 'Genesis block created'
                        });
                    } else {
                        recentActivity.push({
                            type: 'block',
                            timestamp: new Date(block.timestamp.toNumber() * 1000),
                            blockNumber: block.blockNumber.toString(),
                            minter: block.minter
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching block ${i}:`, error);
                }
            }
            
            // Render recent activity
            if (recentActivity.length === 0) {
                recentActivityContainer.innerHTML = "<p class='text-center text-muted'>No recent activity</p>";
            } else {
                let activityHTML = "";
                recentActivity.forEach(activity => {
                    const time = activity.timestamp.toLocaleString();
                    
                    if (activity.type === 'genesis') {
                        activityHTML += `
                            <div class="block-item mb-3">
                                <small class="text-muted">${time}</small>
                                <div>${activity.message}</div>
                            </div>
                        `;
                    } else if (activity.type === 'block') {
                        activityHTML += `
                            <div class="block-item mb-3">
                                <small class="text-muted">${time}</small>
                                <div>Block #${activity.blockNumber} minted by ${formatAddress(activity.minter)}</div>
                            </div>
                        `;
                    }
                });
                recentActivityContainer.innerHTML = activityHTML;
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            recentActivityContainer.innerHTML = "<p class='text-center text-muted'>Error loading activity</p>";
        }
    }
    
    // Initialize Chain Visualizer
    function initChainVisualizer() {
        const canvas = document.getElementById('chainVisualizer');
        if (!canvas || !prxContract) return;
        
        // Use Chart.js to create a visualization of the blockchain
        if (chainVisualizer) chainVisualizer.destroy();
        
        const createChartData = async () => {
            const blockCount = await prxContract.blockCount();
            const labels = [];
            const blockTimestamps = [];
            
            // Get data for the last 10 blocks (or all if less than 10)
            const numBlocks = Math.min(10, blockCount.toNumber());
            
            for (let i = 0; i < numBlocks; i++) {
                const blockNumber = blockCount.toNumber() - i - 1;
                if (blockNumber >= 0) {
                    const block = await prxContract.getBlock(blockNumber);
                    labels.push(`Block ${blockNumber}`);
                    // Convert timestamp to relative time (seconds from first block)
                    blockTimestamps.push(block.timestamp.toNumber());
                }
            }
            
            return { labels, blockTimestamps };
        };
        
        createChartData().then(data => {
            const ctx = canvas.getContext('2d');
            
            chainVisualizer = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels.reverse(),
                    datasets: [{
                        label: 'Block Timestamps',
                        data: data.blockTimestamps.reverse(),
                        borderColor: '#3a0ca3',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        pointBackgroundColor: '#f72585',
                        pointBorderColor: '#f72585',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Unix Timestamp'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Blocks'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const timestamp = context.raw;
                                    const date = new Date(timestamp * 1000);
                                    return date.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error("Error initializing chain visualizer:", error);
        });
    }
    
    // Handle Mint Submit
    async function handleMintSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!mintForm.checkValidity()) {
            mintForm.classList.add('was-validated');
            return;
        }
        
        try {
            // Get input values
            const metadata = tokenMetadataInput.value.trim();
            const contentURI = contentUriInput.value.trim();
            const contentType = contentTypeSelect.value;
            const isPrivate = isPrivateCheckbox.checked;
            
            // Get mint price
            const mintPrice = await prxContract.mintPrice();
            
            // Disable form during transaction
            setMintFormState(false, "Minting...");
            
            // Execute transaction
            const tx = await prxContract.mintWithContent(
                metadata, 
                contentURI, 
                contentType, 
                isPrivate, 
                { value: mintPrice }
            );
            
            showAlert("Transaction submitted! Waiting for confirmation...", "info");
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Reset form
            mintForm.reset();
            mintForm.classList.remove('was-validated');
            
            // Re-enable form
            setMintFormState(true);
            
            // Get the tokenId from events
            const tokenMintedEvent = receipt.events.find(event => event.event === 'TokenMinted');
            const tokenId = tokenMintedEvent ? tokenMintedEvent.args.tokenId.toString() : "unknown";
            
            showAlert(`Token #${tokenId} minted successfully! Block added to the chain.`, "success");
            
            // Update UI
            await updateContractInfo();
            await loadDashboardData();
            await loadExplorerData();
            await loadUserTokens();
            initChainVisualizer();
            
        } catch (error) {
            console.error("Error minting token:", error);
            showAlert(`Error minting token: ${error.message}`, "danger");
            setMintFormState(true);
        }
    }
    
    // Enable/disable mint form
    function setMintFormState(enabled, buttonText = "Mint Token") {
        tokenMetadataInput.disabled = !enabled;
        contentUriInput.disabled = !enabled;
        contentTypeSelect.disabled = !enabled;
        isPrivateCheckbox.disabled = !enabled;
        mintButton.disabled = !enabled;
        mintButton.textContent = buttonText;
    }
    
    // Load Explorer Data
    async function loadExplorerData() {
        try {
            const blockCount = await prxContract.blockCount();
            const totalSupply = await prxContract.totalSupply();
            
            // Load blocks (most recent 5)
            const startBlock = Math.max(0, blockCount.toNumber() - 5);
            const blocks = [];
            
            for (let i = blockCount.toNumber() - 1; i >= startBlock; i--) {
                try {
                    const block = await prxContract.getBlock(i);
                    blocks.push({
                        number: block.blockNumber.toString(),
                        timestamp: new Date(block.timestamp.toNumber() * 1000).toLocaleString(),
                        minter: block.minter,
                        metadata: block.tokenMetadata
                    });
                } catch (error) {
                    console.error(`Error fetching block ${i}:`, error);
                }
            }
            
            // Load tokens (most recent 5)
            const startToken = Math.max(0, totalSupply.toNumber() - 5);
            const tokens = [];
            
            for (let i = totalSupply.toNumber() - 1; i >= startToken; i--) {
                try {
                    const [owner, metadata] = await prxContract.getToken(i);
                    const prxMeta = await prxContract.prxMetadata(i);
                    tokens.push({
                        id: i,
                        owner: owner,
                        metadata: metadata,
                        contentURI: prxMeta.contentURI,
                        contentType: prxMeta.contentType,
                        isPrivate: prxMeta.isPrivate
                    });
                } catch (error) {
                    console.error(`Error fetching token ${i}:`, error);
                }
            }
            
            // Render blocks
            if (blocks.length === 0) {
                blockList.innerHTML = "<p class='text-center text-muted'>No blocks found</p>";
            } else {
                let blocksHTML = "";
                blocks.forEach(block => {
                    blocksHTML += `
                        <div class="block-item mb-3">
                            <div class="d-flex justify-content-between">
                                <strong>Block #${block.number}</strong>
                                <small>${block.timestamp}</small>
                            </div>
                            <div>Minter: ${formatAddress(block.minter)}</div>
                            <div class="mt-1">
                                <small class="text-muted">Metadata: ${block.metadata}</small>
                            </div>
                        </div>
                    `;
                });
                blockList.innerHTML = blocksHTML;
            }
            
            // Render tokens
            if (tokens.length === 0) {
                tokenList.innerHTML = "<p class='text-center text-muted'>No tokens found</p>";
            } else {
                let tokensHTML = "";
                tokens.forEach(token => {
                    tokensHTML += `
                        <div class="token-item mb-3">
                            <div class="d-flex justify-content-between">
                                <strong>Token #${token.id}</strong>
                                <span class="badge ${token.isPrivate ? 'bg-warning' : 'bg-success'}">
                                    ${token.isPrivate ? 'Private' : 'Public'}
                                </span>
                            </div>
                            <div>Owner: ${formatAddress(token.owner)}</div>
                            <div>Type: ${token.contentType}</div>
                            <div class="mt-1">
                                <small class="text-muted">Metadata: ${token.metadata}</small>
                            </div>
                            <div class="mt-1">
                                <a href="${token.contentURI}" target="_blank" class="btn btn-sm btn-outline-primary">View Content</a>
                            </div>
                        </div>
                    `;
                });
                tokenList.innerHTML = tokensHTML;
            }
        } catch (error) {
            console.error("Error loading explorer data:", error);
            blockList.innerHTML = "<p class='text-center text-muted'>Error loading blocks</p>";
            tokenList.innerHTML = "<p class='text-center text-muted'>Error loading tokens</p>";
        }
    }
    
    // Handle Search
    async function handleSearch() {
        const query = searchInput.value.trim();
        
        if (!query) return;
        
        try {
            let result = null;
            searchResultsContent.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Searching...</p></div>';
            searchResults.classList.remove('d-none');
            
            // Check if query is a block number
            if (/^\d+$/.test(query)) {
                const blockNum = parseInt(query);
                const blockCount = await prxContract.blockCount();
                
                if (blockNum >= 0 && blockNum < blockCount) {
                    // It's a valid block number
                    const block = await prxContract.getBlock(blockNum);
                    result = {
                        type: 'block',
                        data: {
                            number: block.blockNumber.toString(),
                            timestamp: new Date(block.timestamp.toNumber() * 1000).toLocaleString(),
                            minter: block.minter,
                            previousHash: block.previousBlockHash,
                            hash: block.blockHash,
                            metadata: block.tokenMetadata
                        }
                    };
                }
                
                // Also check if it's a valid token ID
                const totalSupply = await prxContract.totalSupply();
                if (blockNum >= 0 && blockNum < totalSupply) {
                    // It's a valid token ID
                    const [owner, metadata] = await prxContract.getToken(blockNum);
                    const prxMeta = await prxContract.prxMetadata(blockNum);
                    
                    // If we didn't find a block earlier, set it now
                    // Otherwise, we'll add it as additional info
                    if (!result) {
                        result = {
                            type: 'token',
                            data: {
                                id: blockNum,
                                owner: owner,
                                metadata: metadata,
                                contentURI: prxMeta.contentURI,
                                contentType: prxMeta.contentType,
                                isPrivate: prxMeta.isPrivate,
                                creationBlock: prxMeta.creationBlock.toString()
                            }
                        };
                    } else {
                        result.additionalInfo = {
                            type: 'token',
                            data: {
                                id: blockNum,
                                owner: owner,
                                metadata: metadata,
                                contentURI: prxMeta.contentURI,
                                contentType: prxMeta.contentType,
                                isPrivate: prxMeta.isPrivate,
                                creationBlock: prxMeta.creationBlock.toString()
                            }
                        };
                    }
                }
            } 
            // Check if query is an Ethereum address
            else if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
                const address = query;
                const balance = await prxContract.balanceOf(address);
                
                // Find tokens owned by this address
                const totalSupply = await prxContract.totalSupply();
                const ownedTokens = [];
                
                for (let i = 0; i < totalSupply; i++) {
                    const owner = await prxContract.tokenOwner(i);
                    if (owner.toLowerCase() === address.toLowerCase()) {
                        const [_, metadata] = await prxContract.getToken(i);
                        const prxMeta = await prxContract.prxMetadata(i);
                        ownedTokens.push({
                            id: i,
                            metadata: metadata,
                            contentURI: prxMeta.contentURI,
                            contentType: prxMeta.contentType,
                            isPrivate: prxMeta.isPrivate
                        });
                    }
                }
                
                result = {
                    type: 'address',
                    data: {
                        address: address,
                        balance: balance.toString(),
                        tokens: ownedTokens
                    }
                };
            }
            
            // Render search results
            if (!result) {
                searchResultsContent.innerHTML = '<div class="alert alert-info">No results found for your query.</div>';
            } else {
                let html = '';
                
                if (result.type === 'block') {
                    html = `
                        <div class="card">
                            <div class="card-header">Block Information</div>
                            <div class="card-body">
                                <div class="mb-2"><strong>Block Number:</strong> ${result.data.number}</div>
                                <div class="mb-2"><strong>Timestamp:</strong> ${result.data.timestamp}</div>
                                <div class="mb-2"><strong>Minter:</strong> ${formatAddress(result.data.minter)}</div>
                                <div class="mb-2"><strong>Metadata:</strong> ${result.data.metadata}</div>
                                <div class="mb-2 text-truncate"><strong>Previous Hash:</strong> ${result.data.previousHash}</div>
                                <div class="mb-2 text-truncate"><strong>Block Hash:</strong> ${result.data.hash}</div>
                            </div>
                        </div>
                    `;
                    
                    // Add token info if available
                    if (result.additionalInfo && result.additionalInfo.type === 'token') {
                        const token = result.additionalInfo.data;
                        html += `
                            <div class="card mt-3">
                                <div class="card-header">Associated Token Information</div>
                                <div class="card-body">
                                    <div class="mb-2"><strong>Token ID:</strong> ${token.id}</div>
                                    <div class="mb-2"><strong>Owner:</strong> ${formatAddress(token.owner)}</div>
                                    <div class="mb-2"><strong>Metadata:</strong> ${token.metadata}</div>
                                    <div class="mb-2"><strong>Content Type:</strong> ${token.contentType}</div>
                                    <div class="mb-2"><strong>Access:</strong> ${token.isPrivate ? 'Private' : 'Public'}</div>
                                    <div class="mb-2"><strong>Content URI:</strong> <a href="${token.contentURI}" target="_blank">${token.contentURI}</a></div>
                                </div>
                            </div>
                        `;
                    }
                }
                else if (result.type === 'token') {
                    html = `
                        <div class="card">
                            <div class="card-header">Token Information</div>
                            <div class="card-body">
                                <div class="mb-2"><strong>Token ID:</strong> ${result.data.id}</div>
                                <div class="mb-2"><strong>Owner:</strong> ${formatAddress(result.data.owner)}</div>
                                <div class="mb-2"><strong>Metadata:</strong> ${result.data.metadata}</div>
                                <div class="mb-2"><strong>Content Type:</strong> ${result.data.contentType}</div>
                                <div class="mb-2"><strong>Access:</strong> ${result.data.isPrivate ? 'Private' : 'Public'}</div>
                                <div class="mb-2"><strong>Creation Block:</strong> ${result.data.creationBlock}</div>
                                <div class="mb-2"><strong>Content URI:</strong> <a href="${result.data.contentURI}" target="_blank">${result.data.contentURI}</a></div>
                                
                                ${await renderContentPreview(result.data.contentURI, result.data.contentType, result.data.isPrivate, result.data.owner)}
                            </div>
                        </div>
                    `;
                }
                else if (result.type === 'address') {
                    html = `
                        <div class="card">
                            <div class="card-header">Address Information</div>
                            <div class="card-body">
                                <div class="mb-2"><strong>Address:</strong> ${result.data.address}</div>
                                <div class="mb-2"><strong>Token Balance:</strong> ${result.data.balance}</div>
                                
                                <h5 class="mt-4">Owned Tokens</h5>
                                ${result.data.tokens.length === 0 ? 
                                    '<p>No tokens owned by this address</p>' : 
                                    result.data.tokens.map(token => `
                                        <div class="token-item mb-3">
                                            <div class="d-flex justify-content-between">
                                                <strong>Token #${token.id}</strong>
                                                <span class="badge ${token.isPrivate ? 'bg-warning' : 'bg-success'}">
                                                    ${token.isPrivate ? 'Private' : 'Public'}
                                                </span>
                                            </div>
                                            <div>Type: ${token.contentType}</div>
                                            <div class="mt-1">
                                                <small class="text-muted">Metadata: ${token.metadata}</small>
                                            </div>
                                            <div class="mt-1">
                                                <a href="${token.contentURI}" target="_blank" class="btn btn-sm btn-outline-primary">View Content</a>
                                            </div>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                    `;
                }
                
                searchResultsContent.innerHTML = html;
            }
            
        } catch (error) {
            console.error("Error searching:", error);
            searchResultsContent.innerHTML = `<div class="alert alert-danger">Error performing search: ${error.message}</div>`;
        }
    }
    
    // Render content preview
    async function renderContentPreview(uri, contentType, isPrivate, owner) {
        // Check if current user can access this content
        let canAccess = true;
        
        if (isPrivate && currentAccount) {
            canAccess = await prxContract.canAccessContent(currentAccount, tokenId);
        }
        
        // If private and not accessible, show blurred preview
        const blurClass = (isPrivate && !canAccess) ? 'private-content' : '';
        
        if (contentType === 'image') {
            return `
                <div class="mt-3">
                    <p><strong>Content Preview:</strong></p>
                    <div class="${blurClass}">
                        <img src="${uri}" alt="Token content" class="content-preview">
                        ${blurClass ? '<div class="overlay-text">Private Content</div>' : ''}
                    </div>
                </div>
            `;
        }
        else if (contentType === 'video') {
            return `
                <div class="mt-3">
                    <p><strong>Content Preview:</strong></p>
                    <div class="${blurClass}">
                        <video src="${uri}" controls class="content-preview"></video>
                        ${blurClass ? '<div class="overlay-text">Private Content</div>' : ''}
                    </div>
                </div>
            `;
        }
        else if (contentType === 'audio') {
            return `
                <div class="mt-3">
                    <p><strong>Content Preview:</strong></p>
                    <div class="${blurClass}">
                        <audio src="${uri}" controls></audio>
                        ${blurClass ? '<div class="overlay-text">Private Content</div>' : ''}
                    </div>
                </div>
            `;
        }
        else {
            return `
                <div class="mt-3">
                    <p><strong>Content Preview:</strong></p>
                    <div class="${blurClass}">
                        <p>Preview not available for ${contentType} content</p>
                        ${blurClass ? '<div class="overlay-text">Private Content</div>' : ''}
                    </div>
                </div>
            `;
        }
    }
    
    // Load Governance Data
    async function loadGovernanceData() {
        try {
            const proposalCount = await prxContract.proposalCount();
            const minVotingPeriod = await prxContract.minimumVotingPeriod();
            const minVotesRequired = await prxContract.minimumVotesRequired();
            const governanceThreshold = await prxContract.governanceThreshold();
            
            // Display governance stats
            proposalCountDisplay.textContent = proposalCount.toString();
            minVotingPeriodDisplay.textContent = `${minVotingPeriod / (24 * 60 * 60)} days`;
            proposalStakeDisplay.textContent = `1% of total supply`;
            governanceThresholdDisplay.textContent = `${governanceThreshold}%`;
            
            // Load active proposals
            if (proposalCount.eq(0)) {
                activeProposalsContainer.innerHTML = "<p class='text-center text-muted'>No proposals created yet</p>";
                return;
            }
            
            const proposals = [];
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Load the last 5 proposals (or all if less than 5)
            const startProposal = Math.max(0, proposalCount.toNumber() - 5);
            
            for (let i = proposalCount.toNumber() - 1; i >= startProposal; i--) {
                const proposal = await prxContract.proposals(i);
                
                // Determine proposal status
                let status = '';
                if (proposal.executed) {
                    status = proposal.passed ? 'Passed' : 'Rejected';
                } else if (proposal.endTime < currentTime) {
                    status = 'Voting Ended (Not Executed)';
                } else {
                    status = 'Voting Active';
                }
                
                const totalVotes = proposal.forVotes.add(proposal.againstVotes);
                const forPercentage = totalVotes.gt(0) ? 
                    proposal.forVotes.mul(100).div(totalVotes).toString() : '0';
                const againstPercentage = totalVotes.gt(0) ? 
                    proposal.againstVotes.mul(100).div(totalVotes).toString() : '0';
                
                proposals.push({
                    id: proposal.id.toString(),
                    description: proposal.description,
                    proposer: proposal.proposer,
                    startTime: new Date(proposal.startTime.toNumber() * 1000),
                    endTime: new Date(proposal.endTime.toNumber() * 1000),
                    executed: proposal.executed,
                    passed: proposal.passed,
                    status: status,
                    forVotes: proposal.forVotes.toString(),
                    againstVotes: proposal.againstVotes.toString(),
                    forPercentage: forPercentage,
                    againstPercentage: againstPercentage,
                    isActive: proposal.endTime.toNumber() > currentTime && !proposal.executed
                });
            }
            
            // Render proposals
            if (proposals.length === 0) {
                activeProposalsContainer.innerHTML = "<p class='text-center text-muted'>No proposals found</p>";
            } else {
                let proposalsHTML = "";
                proposals.forEach(proposal => {
                    const statusClass = 
                        proposal.status === 'Passed' ? 'bg-success' :
                        proposal.status === 'Rejected' ? 'bg-danger' :
                        proposal.status === 'Voting Active' ? 'bg-primary' :
                        'bg-secondary';
                    
                    proposalsHTML += `
                        <div class="governance-proposal mb-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5>Proposal #${proposal.id}</h5>
                                <span class="badge ${statusClass}">${proposal.status}</span>
                            </div>
                            <p>${proposal.description}</p>
                            <div class="mb-2">
                                <small class="text-muted">Proposed by ${formatAddress(proposal.proposer)} • ${proposal.startTime.toLocaleString()}</small>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">Voting Ends: ${proposal.endTime.toLocaleString()}</small>
                            </div>
                            
                            <div class="mb-2">
                                <div class="d-flex justify-content-between mb-1">
                                    <small>For: ${proposal.forVotes} (${proposal.forPercentage}%)</small>
                                    <small>Against: ${proposal.againstVotes} (${proposal.againstPercentage}%)</small>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${proposal.forPercentage}%" role="progressbar"></div>
                                    <div class="progress-bar bg-danger" style="width: ${proposal.againstPercentage}%" role="progressbar"></div>
                                </div>
                            </div>
                            
                            ${proposal.isActive ? `
                                <div class="d-flex mt-3">
                                    <button class="btn btn-sm btn-outline-success me-2" onclick="voteOnProposal(${proposal.id}, true)">Vote For</button>
                                    <button class="btn btn-sm btn-outline-danger me-2" onclick="voteOnProposal(${proposal.id}, false)">Vote Against</button>
                                </div>
                            ` : ''}
                            
                            ${proposal.status === 'Voting Ended (Not Executed)' ? `
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-primary" onclick="executeProposal(${proposal.id})">Execute Proposal</button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                activeProposalsContainer.innerHTML = proposalsHTML;
            }
            
        } catch (error) {
            console.error("Error loading governance data:", error);
            activeProposalsContainer.innerHTML = "<p class='text-center text-muted'>Error loading proposals</p>";
        }
    }
    
    // Handle Proposal Submit
    async function handleProposalSubmit(e) {
        e.preventDefault();
        
        if (!proposalForm.checkValidity()) {
            proposalForm.classList.add('was-validated');
            return;
        }
        
        try {
            const description = proposalDescriptionInput.value.trim();
            const votingPeriodDays = parseInt(votingPeriodInput.value);
            const votingPeriodSeconds = votingPeriodDays * 24 * 60 * 60;
            
            // Check user has enough tokens to create proposal
            const totalSupply = await prxContract.totalSupply();
            const requiredBalance = totalSupply.div(100); // 1% of total supply
            const userBalance = await prxContract.balanceOf(currentAccount);
            
            if (userBalance.lt(requiredBalance)) {
                showAlert(`You need at least ${requiredBalance.toString()} tokens to create a proposal`, "warning");
                return;
            }
            
            // Disable form during transaction
            createProposalButton.disabled = true;
            createProposalButton.textContent = "Creating...";
            
            // Create proposal (empty execution data for now)
            const emptyData = ethers.utils.hexlify(new Uint8Array(0));
            const tx = await prxContract.createProposal(description, votingPeriodSeconds, emptyData);
            
            showAlert("Proposal submitted! Waiting for confirmation...", "info");
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Reset form
            proposalForm.reset();
            proposalForm.classList.remove('was-validated');
            
            // Re-enable form
            createProposalButton.disabled = false;
            createProposalButton.textContent = "Create Proposal";
            
            // Get the proposal ID from events
            const proposalCreatedEvent = receipt.events.find(event => event.event === 'ProposalCreated');
            const proposalId = proposalCreatedEvent ? proposalCreatedEvent.args.proposalId.toString() : "unknown";
            
            showAlert(`Proposal #${proposalId} created successfully!`, "success");
            
            // Update UI
            await loadGovernanceData();
            
        } catch (error) {
            console.error("Error creating proposal:", error);
            showAlert(`Error creating proposal: ${error.message}`, "danger");
            createProposalButton.disabled = false;
            createProposalButton.textContent = "Create Proposal";
        }
    }
    
    // Vote on Proposal (called from HTML)
    window.voteOnProposal = async function(proposalId, support) {
        try {
            if (!prxContract || !currentAccount) {
                showAlert("Please connect your wallet first", "warning");
                return;
            }
            
            const tx = await prxContract.vote(proposalId, support);
            showAlert(`Voting on proposal #${proposalId}... Please wait.`, "info");
            
            await tx.wait();
            
            showAlert(`Successfully voted ${support ? 'for' : 'against'} proposal #${proposalId}`, "success");
            
            // Update UI
            await loadGovernanceData();
            
        } catch (error) {
            console.error("Error voting on proposal:", error);
            showAlert(`Error voting: ${error.message}`, "danger");
        }
    };
    
    // Execute Proposal (called from HTML)
    window.executeProposal = async function(proposalId) {
        try {
            if (!prxContract || !currentAccount) {
                showAlert("Please connect your wallet first", "warning");
                return;
            }
            
            const tx = await prxContract.executeProposal(proposalId);
            showAlert(`Executing proposal #${proposalId}... Please wait.`, "info");
            
            await tx.wait();
            
            showAlert(`Successfully executed proposal #${proposalId}`, "success");
            
            // Update UI
            await loadGovernanceData();
            
        } catch (error) {
            console.error("Error executing proposal:", error);
            showAlert(`Error executing proposal: ${error.message}`, "danger");
        }
    };
    
    // Load User Tokens
    async function loadUserTokens() {
        try {
            if (!prxContract || !currentAccount) {
                userTokensContainer.innerHTML = "<p class='text-center text-muted'>Connect wallet to view your tokens</p>";
                return;
            }
            
            const balance = await prxContract.balanceOf(currentAccount);
            
            if (balance.eq(0)) {
                userTokensContainer.innerHTML = "<p class='text-center text-muted'>You don't own any tokens yet</p>";
                sourceTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
                targetTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
                return;
            }
            
            // Find tokens owned by the user
            const totalSupply = await prxContract.totalSupply();
            const userTokens = [];
            
            for (let i = 0; i < totalSupply; i++) {
                const owner = await prxContract.tokenOwner(i);
                if (owner.toLowerCase() === currentAccount.toLowerCase()) {
                    const [_, metadata] = await prxContract.getToken(i);
                    const prxMeta = await prxContract.prxMetadata(i);
                    userTokens.push({
                        id: i,
                        metadata: metadata,
                        contentURI: prxMeta.contentURI,
                        contentType: prxMeta.contentType,
                        isPrivate: prxMeta.isPrivate,
                        linkedTokens: await prxContract.getLinkedContent(i)
                    });
                }
            }
            
            // Populate token select dropdowns
            sourceTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
            targetTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
            
            userTokens.forEach(token => {
                sourceTokenSelect.innerHTML += `<option value="${token.id}">Token #${token.id} (${token.contentType})</option>`;
                targetTokenSelect.innerHTML += `<option value="${token.id}">Token #${token.id} (${token.contentType})</option>`;
            });
            
            // Render user tokens
            if (userTokens.length === 0) {
                userTokensContainer.innerHTML = "<p class='text-center text-muted'>You don't own any tokens</p>";
            } else {
                let tokensHTML = "";
                userTokens.forEach(token => {
                    tokensHTML += `
                        <div class="card mb-3">
                            <div class="card-header d-flex justify-content-between">
                                <span>Token #${token.id}</span>
                                <span class="badge ${token.isPrivate ? 'bg-warning' : 'bg-success'}">${token.isPrivate ? 'Private' : 'Public'}</span>
                            </div>
                            <div class="card-body">
                                <div class="mb-2"><strong>Type:</strong> ${token.contentType}</div>
                                <div class="mb-2"><strong>Metadata:</strong> ${token.metadata}</div>
                                <div class="mb-2"><strong>Content:</strong> <a href="${token.contentURI}" target="_blank">${token.contentURI}</a></div>
                                
                                ${await renderContentPreview(token.contentURI, token.contentType, false, currentAccount)}
                                
                                ${token.linkedTokens.length > 0 ? `
                                    <div class="mt-3">
                                        <strong>Linked Tokens:</strong>
                                        <ul>
                                            ${token.linkedTokens.map(linkedId => `<li>Token #${linkedId}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                userTokensContainer.innerHTML = tokensHTML;
            }
            
        } catch (error) {
            console.error("Error loading user tokens:", error);
            userTokensContainer.innerHTML = `<p class='text-center text-muted'>Error loading tokens: ${error.message}</p>`;
        }
    }
    
    // Handle Link Content form submission
    async function handleLinkContent(e) {
        e.preventDefault();
        
        if (!sourceTokenSelect.value || !targetTokenSelect.value) {
            showAlert("Please select source and target tokens", "warning");
            return;
        }
        
        if (sourceTokenSelect.value === targetTokenSelect.value) {
            showAlert("Source and target tokens cannot be the same", "warning");
            return;
        }
        
        try {
            // Link the tokens
            linkContentButton.disabled = true;
            linkContentButton.textContent = "Linking...";
            
            const tx = await prxContract.linkContent(
                parseInt(sourceTokenSelect.value),
                parseInt(targetTokenSelect.value)
            );
            
            showAlert("Linking tokens... Please wait.", "info");
            
            await tx.wait();
            
            showAlert("Tokens linked successfully!", "success");
            
            // Reset form
            linkContentForm.reset();
            
            // Re-enable button
            linkContentButton.disabled = false;
            linkContentButton.textContent = "Link Tokens";
            
            // Update UI
            await loadUserTokens();
            
        } catch (error) {
            console.error("Error linking tokens:", error);
            showAlert(`Error linking tokens: ${error.message}`, "danger");
            linkContentButton.disabled = false;
            linkContentButton.textContent = "Link Tokens";
        }
    }
    
    // Setup Event Listeners for Contract Events
    function setupEventListeners() {
        if (!prxContract) return;
        
        // Listen for TokenMinted events
        prxContract.on("TokenMinted", async (tokenId, owner, blockNumber) => {
            // Only update UI if not the current user (their UI already updates)
            if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
                await updateContractInfo();
                await loadDashboardData();
                await loadExplorerData();
                initChainVisualizer();
            }
        });
        
        // Listen for ProposalCreated events
        prxContract.on("ProposalCreated", async () => {
            await loadGovernanceData();
        });
        
        // Listen for Voted events
        prxContract.on("Voted", async () => {
            await loadGovernanceData();
        });
    }
    
    // Initialize application
    async function initApplication() {
        // Set up Bootstrap form validation
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
        
        // Check for MetaMask
        await checkMetaMaskInstalled();
        
        // Check if already connected
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    handleAccountsChanged(accounts);
                }
            } catch (error) {
                console.error("Error checking accounts:", error);
            }
        }
    }
    
    // Disconnect
    function disconnect() {
        prxContract = null;
        currentAccount = null;
        
        // Reset UI elements
        connectionStatus.textContent = "Not connected";
        connectButton.textContent = "Connect Wallet";
        
        // Reset stats
        tokenNameDisplay.textContent = "Not connected";
        tokenSymbolDisplay.textContent = "Not connected";
        totalSupplyDisplay.textContent = "Not connected";
        blockCountDisplay.textContent = "Not connected";
        chainValidityDisplay.textContent = "Not connected";
        mintPriceDisplay.textContent = "Not connected";
        
        // Reset containers
        recentActivityContainer.innerHTML = "<p class='text-center text-muted'>Connect wallet to view recent activity</p>";
        blockList.innerHTML = "<p class='text-center text-muted'>Connect wallet to view recent blocks</p>";
        tokenList.innerHTML = "<p class='text-center text-muted'>Connect wallet to view recent tokens</p>";
        activeProposalsContainer.innerHTML = "<p class='text-center text-muted'>Connect wallet to view active proposals</p>";
        userTokensContainer.innerHTML = "<p class='text-center text-muted'>Connect wallet to view your tokens</p>";
        
        // Disable buttons
        mintButton.disabled = true;
        createProposalButton.disabled = true;
        
        // Reset token selects
        sourceTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
        sourceTokenSelect.disabled = true;
        targetTokenSelect.innerHTML = '<option value="" selected disabled>Select token</option>';
        targetTokenSelect.disabled = true;
        linkContentButton.disabled = true;
        
        // Destroy chart
        if (chainVisualizer) {
            chainVisualizer.destroy();
            chainVisualizer = null;
        }
    }
    
    // Helper Functions
    function formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    function showAlert(message, type) {
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        alertArea.innerHTML = alertHTML;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = alertArea.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
});