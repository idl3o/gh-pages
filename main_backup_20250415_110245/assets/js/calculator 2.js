document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateEarnings);
    }
    
    // Initialize with default values
    calculateEarnings();
});

function calculateEarnings() {
    // Get input values
    const monthlyViewers = parseInt(document.getElementById('monthly-viewers').value) || 1000;
    const subscriptionPrice = parseFloat(document.getElementById('subscription-price').value) || 5;
    const conversionRate = parseFloat(document.getElementById('conversion-rate').value) || 5;
    const avgWatchTime = parseInt(document.getElementById('avg-watch-time').value) || 15;
    
    // Calculate number of subscribers
    const subscribers = Math.floor(monthlyViewers * (conversionRate / 100));
    
    // Calculate total monthly revenue
    const monthlyRevenue = subscribers * subscriptionPrice;
    
    // Traditional platform calculations (typically 50% cut)
    const traditionalFees = monthlyRevenue * 0.5; // 50% platform fee
    const traditionalPaymentFees = monthlyRevenue * 0.1; // Approx 10% payment processing
    const traditionalEarnings = monthlyRevenue - traditionalFees - traditionalPaymentFees;
    
    // Web3 platform calculations
    const web3Fees = monthlyRevenue * 0.1; // 10% platform fee
    const web3TxFees = monthlyRevenue * 0.02; // Approx 2% transaction fees
    const web3Earnings = monthlyRevenue - web3Fees - web3TxFees;
    
    // Annual difference
    const annualDifference = (web3Earnings - traditionalEarnings) * 12;
    
    // Update the UI
    document.getElementById('trad-revenue').textContent = formatCurrency(monthlyRevenue);
    document.getElementById('trad-fees').textContent = formatCurrency(traditionalFees);
    document.getElementById('trad-payment').textContent = formatCurrency(traditionalPaymentFees);
    document.getElementById('trad-earnings').textContent = formatCurrency(traditionalEarnings);
    
    document.getElementById('web3-revenue').textContent = formatCurrency(monthlyRevenue);
    document.getElementById('web3-fees').textContent = formatCurrency(web3Fees);
    document.getElementById('web3-tx').textContent = formatCurrency(web3TxFees);
    document.getElementById('web3-earnings').textContent = formatCurrency(web3Earnings);
    
    document.getElementById('annual-difference').textContent = formatCurrency(annualDifference);
    
    // Apply highlight animation to the difference
    const diffElement = document.getElementById('annual-difference');
    diffElement.classList.remove('highlight-animation');
    void diffElement.offsetWidth; // Trigger reflow
    diffElement.classList.add('highlight-animation');
}

function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
