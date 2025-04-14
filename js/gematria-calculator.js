/**
 * Gematria Calculator
 * Calculates numerical values of text using various Gematria systems
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const gematriaInput = document.getElementById('gematria-input');
    const systemSelect = document.getElementById('system-select');
    const calculateButton = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const historyContainer = document.getElementById('history-container');
    
    // API endpoint
    const apiBase = '/api';
    
    // Current calculation result
    let currentCalculation = null;
    
    // Initialize
    init();
    
    /**
     * Initialize the calculator
     */
    async function init() {
        // Load available systems
        await loadSystems();
        
        // Load calculation history
        await loadHistory();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Calculate button click
        calculateButton.addEventListener('click', calculateGematria);
        
        // Enter key in input field
        gematriaInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                calculateGematria();
            }
        });
    }
    
    /**
     * Load available Gematria systems
     */
    async function loadSystems() {
        try {
            const response = await fetch(`${apiBase}/gematria/systems`);
            if (!response.ok) throw new Error('Failed to load Gematria systems');
            
            const systems = await response.json();
            
            // Clear existing options
            systemSelect.innerHTML = '';
            
            // Add options for each system
            Object.entries(systems).forEach(([key, system]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = system.name;
                systemSelect.appendChild(option);
            });
            
            // Default to English system if available
            if (systems.english) {
                systemSelect.value = 'english';
            }
        } catch (error) {
            console.error('Error loading Gematria systems:', error);
            // Add default systems if API fails
            const defaultSystems = [
                { value: 'hebrew', name: 'Hebrew Gematria' },
                { value: 'english', name: 'English Gematria' },
                { value: 'pythagorean', name: 'Pythagorean Gematria' }
            ];
            
            systemSelect.innerHTML = '';
            defaultSystems.forEach(system => {
                const option = document.createElement('option');
                option.value = system.value;
                option.textContent = system.name;
                systemSelect.appendChild(option);
            });
            
            systemSelect.value = 'english';
        }
    }
    
    /**
     * Load calculation history
     */
    async function loadHistory() {
        if (!historyContainer) return;
        
        try {
            historyContainer.innerHTML = '<div class="loading">Loading history...</div>';
            
            const response = await fetch(`${apiBase}/gematria/history`);
            if (!response.ok) throw new Error('Failed to load calculation history');
            
            const history = await response.json();
            
            if (history.length === 0) {
                historyContainer.innerHTML = '<div class="no-history">No calculations yet</div>';
                return;
            }
            
            // Clear container
            historyContainer.innerHTML = '';
            
            // Add history items
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-text">${escapeHTML(truncateText(item.text, 30))}</div>
                    <div class="history-system">${escapeHTML(item.system)}</div>
                    <div class="history-value">${item.value}</div>
                    <div class="history-time" title="${new Date(item.timestamp).toLocaleString()}">
                        ${formatTimeAgo(item.timestamp)}
                    </div>
                `;
                
                // Make the history item clickable to load that calculation
                historyItem.addEventListener('click', () => {
                    gematriaInput.value = item.text;
                    // Find the system in the dropdown
                    Array.from(systemSelect.options).forEach(option => {
                        if (option.textContent === item.system) {
                            systemSelect.value = option.value;
                        }
                    });
                    calculateGematria();
                });
                
                historyContainer.appendChild(historyItem);
            });
        } catch (error) {
            console.error('Error loading calculation history:', error);
            historyContainer.innerHTML = `
                <div class="error">
                    Failed to load calculation history.
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            
            historyContainer.querySelector('.retry-btn')?.addEventListener('click', loadHistory);
        }
    }
    
    /**
     * Calculate Gematria value
     */
    async function calculateGematria() {
        const text = gematriaInput.value.trim();
        const system = systemSelect.value;
        
        if (!text) {
            showError('Please enter some text to calculate');
            return;
        }
        
        try {
            // Show loading state
            resultContainer.innerHTML = '<div class="loading">Calculating...</div>';
            
            // Call API to calculate
            const response = await fetch(`${apiBase}/gematria/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    system
                })
            });
            
            if (!response.ok) throw new Error('Calculation failed');
            
            const result = await response.json();
            currentCalculation = result;
            
            // Display result
            displayResult(result);
            
            // Refresh history
            loadHistory();
        } catch (error) {
            console.error('Error calculating Gematria:', error);
            
            // Fallback calculation for demo purposes
            const fallbackResult = fallbackCalculate(text, system);
            currentCalculation = fallbackResult;
            displayResult(fallbackResult);
        }
    }
    
    /**
     * Display calculation result
     * @param {Object} result Calculation result
     */
    function displayResult(result) {
        if (!resultContainer) return;
        
        resultContainer.innerHTML = `
            <div class="result-header">
                <h3>Gematria Value: <span class="result-value">${result.value}</span></h3>
                <div class="result-system">${escapeHTML(result.system)}</div>
            </div>
            
            <div class="result-text">
                "${escapeHTML(result.text)}"
            </div>
            
            <div class="letter-breakdown">
                <h4>Letter Breakdown</h4>
                <div class="letter-values">
                    ${result.letterValues.map(lv => `
                        <div class="letter-value-item">
                            <span class="letter">${escapeHTML(lv.letter)}</span>
                            <span class="value">${lv.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${result.isSignificant ? `
                <div class="significant-number">
                    <div class="significant-icon">✧</div>
                    <div class="significant-text">
                        ${result.value} is a significant number in mystical traditions
                    </div>
                </div>
            ` : ''}
            
            ${result.correlations.length > 0 ? `
                <div class="correlations">
                    <h4>Correlations</h4>
                    <p>Other phrases with the same value:</p>
                    <ul>
                        ${result.correlations.map(corr => `
                            <li>"${escapeHTML(truncateText(corr.text, 40))}" 
                                <span class="correlation-system">(${escapeHTML(corr.system)})</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="result-timestamp">
                Calculated on ${new Date(result.timestamp).toLocaleString()}
            </div>
        `;
    }
    
    /**
     * Show error message
     * @param {string} message Error message
     */
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-notification';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorElement.classList.add('fade-out');
            setTimeout(() => errorElement.remove(), 300);
        }, 3000);
    }
    
    /**
     * Fallback calculation for demo purposes
     * @param {string} text Text to calculate
     * @param {string} system Gematria system
     * @returns {Object} Calculation result
     */
    function fallbackCalculate(text, system) {
        // Simple English gematria (A=1, B=2...)
        const letterValues = [];
        let totalValue = 0;
        
        const englishValues = {};
        for (let i = 0; i < 26; i++) {
            englishValues[String.fromCharCode(97 + i)] = i + 1; // lowercase a-z
        }
        
        // Process each character
        for (let i = 0; i < text.length; i++) {
            const char = text[i].toLowerCase();
            if (englishValues[char]) {
                const value = englishValues[char];
                totalValue += value;
                letterValues.push({ letter: text[i], value, position: i });
            }
        }
        
        // Check if it's a "significant" number
        const significantNumbers = [7, 9, 11, 13, 18, 26, 33, 36, 72, 108, 144, 666, 777];
        const isSignificant = significantNumbers.includes(totalValue);
        
        return {
            id: 'local_' + Date.now(),
            text,
            system: system === 'hebrew' ? 'Hebrew Gematria' : 
                   system === 'pythagorean' ? 'Pythagorean Gematria' : 
                   'English Gematria',
            value: totalValue,
            letterValues,
            isSignificant,
            correlations: [],
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Format time ago string
     * @param {string} timestamp ISO timestamp
     * @returns {string} Formatted time ago
     */
    function formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);
        
        // Less than a minute
        if (seconds < 60) {
            return 'just now';
        }
        
        // Less than an hour
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        }
        
        // Less than a day
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        }
        
        // Less than a month
        const days = Math.floor(hours / 24);
        if (days < 30) {
            return days === 1 ? '1 day ago' : `${days} days ago`;
        }
        
        // Format as date
        return date.toLocaleDateString();
    }
    
    /**
     * Truncate text with ellipsis
     * @param {string} text Text to truncate
     * @param {number} maxLength Maximum length
     * @returns {string} Truncated text
     */
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text Text to escape
     * @returns {string} Escaped text
     */
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
