/**
 * Temporal Streams - Suprastream and Liminal Time
 * JavaScript for the Temporal Streams page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const apiBase = '/api';
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            const tabId = `${button.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
            
            // Load content for the active tab
            if (button.dataset.tab === 'suprastream') {
                loadSuprastreamData();
            } else if (button.dataset.tab === 'liminal') {
                loadLiminalTimeData();
            }
        });
    });
    
    // DOM Elements - Suprastream
    const suprastreamItemsContainer = document.getElementById('suprastream-items');
    const flowStateFilter = document.getElementById('flow-state-filter');
    const minBandwidthSlider = document.getElementById('min-bandwidth');
    const maxBandwidthSlider = document.getElementById('max-bandwidth');
    const minBandwidthValue = document.getElementById('min-bandwidth-value');
    const maxBandwidthValue = document.getElementById('max-bandwidth-value');
    const totalBandwidth = document.getElementById('total-bandwidth');
    const peakThroughput = document.getElementById('peak-throughput');
    const flowEfficiency = document.getElementById('flow-efficiency');
    
    // DOM Elements - Liminal Time
    const liminalItemsContainer = document.getElementById('liminal-items');
    const thresholdFilter = document.getElementById('threshold-filter');
    const hourFilter = document.getElementById('hour-filter');
    const currentThreshold = document.getElementById('current-threshold');
    const averageDuration = document.getElementById('average-duration');
    const activeHour = document.getElementById('active-hour');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Set up visualizations
            initStreamVisualization();
            initTimeVisualization();
            
            // Start with suprastream data
            await loadSuprastreamData();
            
            // Set up event listeners
            setupEventListeners();
            
            // Update current time threshold
            updateCurrentTimeThreshold();
            setInterval(updateCurrentTimeThreshold, 60000); // Update every minute
        } catch (error) {
            console.error('Error initializing Temporal Streams page:', error);
            showError('Failed to load content. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Suprastream filters
        flowStateFilter.addEventListener('change', loadSuprastreamContent);
        
        minBandwidthSlider.addEventListener('input', () => {
            minBandwidthValue.textContent = minBandwidthSlider.value;
            if (parseInt(minBandwidthSlider.value) > parseInt(maxBandwidthSlider.value)) {
                maxBandwidthSlider.value = minBandwidthSlider.value;
                maxBandwidthValue.textContent = maxBandwidthSlider.value;
            }
        });
        
        maxBandwidthSlider.addEventListener('input', () => {
            maxBandwidthValue.textContent = maxBandwidthSlider.value;
            if (parseInt(maxBandwidthSlider.value) < parseInt(minBandwidthSlider.value)) {
                minBandwidthSlider.value = maxBandwidthSlider.value;
                minBandwidthValue.textContent = minBandwidthSlider.value;
            }
        });
        
        minBandwidthSlider.addEventListener('change', loadSuprastreamContent);
        maxBandwidthSlider.addEventListener('change', loadSuprastreamContent);
        
        // Liminal Time filters
        thresholdFilter.addEventListener('change', loadLiminalTimeContent);
        hourFilter.addEventListener('change', loadLiminalTimeContent);
    }
    
    /**
     * Initialize stream visualization
     */
    function initStreamVisualization() {
        const container = document.querySelector('.stream-visualization');
        if (!container) return;
        
        const particles = container.querySelector('.particles');
        
        // Create data particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'data-particle';
            
            // Randomize appearance
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${3 + Math.random() * 7}s`;
            particle.style.animationDelay = `${Math.random() * 2}s`;
            particle.style.opacity = 0.5 + Math.random() * 0.5;
            
            particles.appendChild(particle);
        }
        
        // Create data flow paths
        const dataFlow = container.querySelector('.data-flow');
        for (let i = 0; i < 5; i++) {
            const path = document.createElement('div');
            path.className = 'flow-path';
            path.style.top = `${15 + i * 20}%`;
            path.style.animationDuration = `${5 + i * 2}s`;
            dataFlow.appendChild(path);
        }
    }
    
    /**
     * Initialize time visualization
     */
    function initTimeVisualization() {
        const clock = document.querySelector('.clock');
        if (!clock) return;
        
        updateClockHands();
        setInterval(updateClockHands, 1000);
        
        // Position threshold markers
        const thresholds = {
            dawn: 90, // 6:00, 90° from top
            noon: 180, // 12:00, 180° from top
            dusk: 270, // 18:00, 270° from top
            midnight: 0 // 0:00, 0° from top
        };
        
        Object.entries(thresholds).forEach(([threshold, angle]) => {
            const marker = document.querySelector(`.threshold-marker[data-threshold="${threshold}"]`);
            if (marker) {
                marker.style.transform = `rotate(${angle}deg) translateY(-80px)`;
            }
        });
    }
    
    /**
     * Update clock hands based on current time
     */
    function updateClockHands() {
        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');
        
        if (!hourHand || !minuteHand) return;
        
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // Calculate rotation angles
        const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30° per hour, 0.5° per minute
        const minuteAngle = minutes * 6; // 6° per minute
        
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }
    
    /**
     * Update the current time threshold
     */
    function updateCurrentTimeThreshold() {
        if (!currentThreshold) return;
        
        const now = new Date();
        const hours = now.getHours();
        
        let threshold;
        if (hours >= 5 && hours < 8) {
            threshold = 'Dawn';
        } else if (hours >= 11 && hours < 13) {
            threshold = 'Noon';
        } else if (hours >= 17 && hours < 20) {
            threshold = 'Dusk';
        } else if (hours >= 23 || hours < 2) {
            threshold = 'Midnight';
        } else {
            threshold = 'Transition';
        }
        
        currentThreshold.textContent = threshold;
        
        // Highlight the current threshold on the clock
        document.querySelectorAll('.threshold-marker').forEach(marker => {
            marker.classList.remove('active');
            if (marker.dataset.threshold === threshold.toLowerCase()) {
                marker.classList.add('active');
            }
        });
    }
    
    /**
     * Load suprastream data including stats and content
     */
    async function loadSuprastreamData() {
        try {
            // Load stats
            await loadSuprastreamStats();
            
            // Load content
            await loadSuprastreamContent();
        } catch (error) {
            console.error('Error loading suprastream data:', error);
            showError('Failed to load suprastream data');
        }
    }
    
    /**
     * Load liminal time data including stats and content
     */
    async function loadLiminalTimeData() {
        try {
            // Load stats
            await loadLiminalTimeStats();
            
            // Load content
            await loadLiminalTimeContent();
        } catch (error) {
            console.error('Error loading liminal time data:', error);
            showError('Failed to load liminal time data');
        }
    }
    
    /**
     * Load suprastream statistics
     */
    async function loadSuprastreamStats() {
        try {
            const response = await fetch(`${apiBase}/suprastream/stats`);
            if (!response.ok) throw new Error('Failed to fetch suprastream stats');
            
            const stats = await response.json();
            
            // Update UI
            if (totalBandwidth) {
                totalBandwidth.textContent = `${formatNumber(stats.totalBandwidth)} TB/s`;
            }
            
            if (peakThroughput) {
                peakThroughput.textContent = `${formatNumber(stats.peakThroughput)} TB/s`;
            }
            
            if (flowEfficiency) {
                const efficiency = stats.peakThroughput > 0 ? 
                    ((stats.totalBandwidth / stats.totalItems) / stats.peakThroughput * 100).toFixed(1) : 0;
                flowEfficiency.textContent = `${efficiency}%`;
            }
            
            return stats;
        } catch (error) {
            console.error('Error loading suprastream stats:', error);
            return null;
        }
    }
    
    /**
     * Load liminal time statistics
     */
    async function loadLiminalTimeStats() {
        try {
            const response = await fetch(`${apiBase}/liminal-time/stats`);
            if (!response.ok) throw new Error('Failed to fetch liminal time stats');
            
            const stats = await response.json();
            
            // Update UI
            if (averageDuration) {
                averageDuration.textContent = `${stats.averageDuration.toFixed(1)} minutes`;
            }
            
            if (activeHour && stats.mostActiveHour !== null) {
                const hourLabel = formatHour(stats.mostActiveHour);
                activeHour.textContent = hourLabel;
            } else if (activeHour) {
                activeHour.textContent = 'N/A';
            }
            
            return stats;
        } catch (error) {
            console.error('Error loading liminal time stats:', error);
            return null;
        }
    }
    
    /**
     * Load suprastream content with filtering
     */
    async function loadSuprastreamContent() {
        try {
            if (!suprastreamItemsContainer) return;
            
            // Show loading state
            suprastreamItemsContainer.innerHTML = '<div class="content-placeholder">Loading suprastream content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams();
            
            const flowState = flowStateFilter?.value;
            if (flowState) {
                params.append('flowState', flowState);
            }
            
            const minBandwidth = minBandwidthSlider?.value;
            if (minBandwidth) {
                params.append('minBandwidth', minBandwidth);
            }
            
            const maxBandwidth = maxBandwidthSlider?.value;
            if (maxBandwidth) {
                params.append('maxBandwidth', maxBandwidth);
            }
            
            const response = await fetch(`${apiBase}/suprastream?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch suprastream content');
            
            const items = await response.json();
            
            // Clear loading placeholder
            suprastreamItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                suprastreamItemsContainer.innerHTML = '<p class="no-content">No suprastream content matches your filters.</p>';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                suprastreamItemsContainer.appendChild(createSuprastreamCard(item));
            });
        } catch (error) {
            console.error('Error loading suprastream content:', error);
            if (suprastreamItemsContainer) {
                suprastreamItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
            }
        }
    }
    
    /**
     * Load liminal time content with filtering
     */
    async function loadLiminalTimeContent() {
        try {
            if (!liminalItemsContainer) return;
            
            // Show loading state
            liminalItemsContainer.innerHTML = '<div class="content-placeholder">Loading liminal time content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams();
            
            const threshold = thresholdFilter?.value;
            if (threshold) {
                params.append('threshold', threshold);
            }
            
            const hour = hourFilter?.value;
            if (hour) {
                params.append('activeHour', hour);
            }
            
            const response = await fetch(`${apiBase}/liminal-time?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch liminal time content');
            
            const items = await response.json();
            
            // Clear loading placeholder
            liminalItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                liminalItemsContainer.innerHTML = '<p class="no-content">No liminal time content matches your filters.</p>';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                liminalItemsContainer.appendChild(createLiminalTimeCard(item));
            });
        } catch (error) {
            console.error('Error loading liminal time content:', error);
            if (liminalItemsContainer) {
                liminalItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
            }
        }
    }
    
    /**
     * Create a suprastream content card
     * @param {Object} item Content item
     * @returns {HTMLElement} Card element
     */
    function createSuprastreamCard(item) {
        const card = document.createElement('div');
        card.className = `suprastream-card ${(item.flowState || 'standard').toLowerCase()}`;
        
        // Calculate efficiency percentage
        const efficiency = item.throughput && item.bandwidth ? 
            ((item.throughput / item.bandwidth) * 100).toFixed(1) : '--';
        
        card.innerHTML = `
            <div class="card-header">
                <span class="flow-state">${escapeHTML(item.flowState || 'Standard')}</span>
                <div class="metrics">
                    <span class="bandwidth">${formatNumber(item.bandwidth || 0)} TB/s</span>
                </div>
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="stream-efficiency">
                <div class="efficiency-label">Stream Efficiency</div>
                <div class="efficiency-meter">
                    <div class="efficiency-fill" style="width: ${efficiency}%"></div>
                </div>
                <div class="efficiency-value">${efficiency}%</div>
            </div>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/suprastream/${item.id}" class="read-more">Access Stream</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on the button
            if (e.target.classList.contains('read-more')) return;
            window.location.href = `/suprastream/${item.id}`;
        });
        
        return card;
    }
    
    /**
     * Create a liminal time content card
     * @param {Object} item Content item
     * @returns {HTMLElement} Card element
     */
    function createLiminalTimeCard(item) {
        const card = document.createElement('div');
        card.className = `liminal-card ${(item.threshold || 'transition').toLowerCase()}`;
        
        card.innerHTML = `
            <div class="card-header">
                <span class="threshold">${escapeHTML(item.threshold || 'Transition')}</span>
                <span class="duration">${item.duration || '--'} min</span>
            </div>
            <div class="active-hour">
                <span class="hour-label">Active at:</span>
                <span class="hour-value">${formatHour(item.activeHour)}</span>
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/liminal-time/${item.id}" class="read-more">Experience</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on the button
            if (e.target.classList.contains('read-more')) return;
            window.location.href = `/liminal-time/${item.id}`;
        });
        
        return card;
    }
    
    /**
     * Format a number with commas
     * @param {number} num Number to format
     * @returns {string} Formatted number
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Format hour as 12-hour time
     * @param {number} hour Hour (0-23)
     * @returns {string} Formatted hour
     */
    function formatHour(hour) {
        if (hour === undefined || hour === null) return 'N/A';
        
        const hourNum = parseInt(hour);
        if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) return 'N/A';
        
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `${hour12}:00 ${period}`;
    }
    
    /**
     * Show error message
     * @param {string} message Error message
     */
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Add to the top of the main content area
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.insertBefore(errorElement, mainContent.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
    
    /**
     * Helper to escape HTML
     * @param {string} str String to escape
     * @returns {string} Escaped string
     */
    function escapeHTML(str) {
        if (str === undefined || str === null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
