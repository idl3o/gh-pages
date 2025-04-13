/**
 * Token Dashboard JavaScript
 * Connects UI with the Token Generator Service
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const connectWalletBtn = document.getElementById('connect-wallet');
    const walletAddressSpan = document.getElementById('wallet-address');
    const tokenAmountSpan = document.getElementById('token-amount');
    const historyFilter = document.getElementById('history-filter');
    const tokenHistoryBody = document.getElementById('token-history-body');
    const pendingTokensBody = document.getElementById('pending-tokens-body');
    
    // Mock wallet state (in production, use real wallet connection)
    let walletConnected = false;
    let walletAddress = '';
    
    // Connect to token service (via API in production)
    async function connectToTokenService() {
        // In production, this would make API calls to the backend
        console.log('Connecting to token service...');
        return true;
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    // Connect wallet handler
    connectWalletBtn.addEventListener('click', async function() {
        if (!walletConnected) {
            try {
                // In production, this would use web3/wallet APIs
                walletAddress = '0x' + Math.random().toString(16).slice(2, 12) + '...';
                walletConnected = true;
                
                // Update UI
                walletAddressSpan.textContent = walletAddress;
                connectWalletBtn.textContent = 'Disconnect';
                
                // Connect to token service
                await connectToTokenService();
                
                // Load data
                loadTokenBalance();
                loadTokenHistory();
                loadPendingTokens();
                
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                alert('Failed to connect wallet. Please try again.');
            }
        } else {
            // Disconnect wallet
            walletConnected = false;
            walletAddress = '';
            walletAddressSpan.textContent = 'Not connected';
            connectWalletBtn.textContent = 'Connect Wallet';
            
            // Clear data
            tokenAmountSpan.textContent = '0.00';
            tokenHistoryBody.innerHTML = '';
            pendingTokensBody.innerHTML = '';
        }
    });
    
    // Load token balance
    async function loadTokenBalance() {
        if (!walletConnected) return;
        
        try {
            // In production, this would fetch from API
            const mockBalance = (Math.random() * 1000).toFixed(2);
            tokenAmountSpan.textContent = mockBalance;
        } catch (error) {
            console.error('Failed to load token balance:', error);
        }
    }
    
    // Load token history
    async function loadTokenHistory() {
        if (!walletConnected) return;
        
        try {
            // Clear existing rows
            tokenHistoryBody.innerHTML = '';
            
            // Get filter value
            const filterValue = historyFilter.value;
            
            // In production, this would fetch from API with proper filter
            const mockHistory = generateMockTokenHistory(10);
            const filteredHistory = filterValue === 'all' 
                ? mockHistory 
                : mockHistory.filter(item => item.reason.includes(filterValue));
            
            // Add rows to table
            filteredHistory.forEach(token => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(token.timestamp)}</td>
                    <td>${formatActivityType(token.reason)}</td>
                    <td>+${token.amount.toFixed(2)}</td>
                    <td>${token.status}</td>
                `;
                tokenHistoryBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Failed to load token history:', error);
        }
    }
    
    // Load pending tokens
    async function loadPendingTokens() {
        if (!walletConnected) return;
        
        try {
            // Clear existing rows
            pendingTokensBody.innerHTML = '';
            
            // In production, this would fetch from API
            const mockPending = generateMockTokenHistory(3).map(token => {
                token.status = 'pending';
                return token;
            });
            
            // Add rows to table
            mockPending.forEach(token => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(token.timestamp)}</td>
                    <td>${formatActivityType(token.reason)}</td>
                    <td>+${token.amount.toFixed(2)}</td>
                `;
                pendingTokensBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Failed to load pending tokens:', error);
        }
    }
    
    // Format activity type for display
    function formatActivityType(reason) {
        const reasonMap = {
            'reward_stream_start': 'Stream Start',
            'reward_stream_end': 'Stream End',
            'reward_viewer_watch_time': 'Watch Time',
            'reward_content_creation': 'Content Creation',
            'reward_comment_post': 'Comment',
            'reward_referral_success': 'Referral'
        };
        
        return reasonMap[reason] || reason;
    }
    
    // Generate mock token history data
    function generateMockTokenHistory(count) {
        const activities = [
            'reward_stream_start',
            'reward_stream_end',
            'reward_viewer_watch_time',
            'reward_content_creation',
            'reward_comment_post'
        ];
        
        const mockHistory = [];
        
        for (let i = 0; i < count; i++) {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const amount = activity === 'reward_stream_end' ? 
                Math.random() * 100 + 20 : 
                Math.random() * 20 + 1;
                
            mockHistory.push({
                id: `token_${i}`,
                timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                amount: amount,
                reason: activity,
                status: Math.random() > 0.2 ? 'confirmed' : 'pending'
            });
        }
        
        return mockHistory;
    }
    
    // Add event listener for history filter change
    historyFilter.addEventListener('change', loadTokenHistory);
});
