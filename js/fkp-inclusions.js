/**
 * Fermat Kardashev Pauli Inclusions
 * JavaScript for the FKP Inclusions page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const apiBase = '/api';
    
    // DOM Elements
    const featuredItemsContainer = document.getElementById('featured-items');
    const contentItemsContainer = document.getElementById('content-items');
    const theoremFilter = document.getElementById('theorem-filter');
    const kardashevFilter = document.getElementById('kardashev-filter');
    const pauliFilter = document.getElementById('pauli-filter');
    const minComplexitySlider = document.getElementById('min-complexity');
    const maxComplexitySlider = document.getElementById('max-complexity');
    const minComplexityValue = document.getElementById('min-complexity-value');
    const maxComplexityValue = document.getElementById('max-complexity-value');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const averageComplexity = document.getElementById('average-complexity');
    const complexityValue = document.getElementById('complexity-value');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Initialize visualizations
            initFermatSpiral();
            initKardashevScale();
            initPauliMatrix();
            
            // Load FKP stats
            await loadFKPStats();
            
            // Load featured FKP content
            await loadFeaturedContent();
            
            // Load all FKP content
            await loadFKPContent();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize MathJax rendering
            if (window.MathJax) {
                window.MathJax.typeset();
            }
        } catch (error) {
            console.error('Error initializing FKP Inclusions page:', error);
            showError('Failed to load FKP content. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Theorem filter change
        theoremFilter.addEventListener('change', loadFKPContent);
        
        // Kardashev filter change
        kardashevFilter.addEventListener('change', loadFKPContent);
        
        // Pauli filter change
        pauliFilter.addEventListener('change', loadFKPContent);
        
        // Complexity sliders
        minComplexitySlider.addEventListener('input', () => {
            minComplexityValue.textContent = minComplexitySlider.value;
            // Ensure min doesn't exceed max
            if (parseInt(minComplexitySlider.value) > parseInt(maxComplexitySlider.value)) {
                maxComplexitySlider.value = minComplexitySlider.value;
                maxComplexityValue.textContent = maxComplexitySlider.value;
            }
        });
        
        maxComplexitySlider.addEventListener('input', () => {
            maxComplexityValue.textContent = maxComplexitySlider.value;
            // Ensure max isn't less than min
            if (parseInt(maxComplexitySlider.value) < parseInt(minComplexitySlider.value)) {
                minComplexitySlider.value = maxComplexitySlider.value;
                minComplexityValue.textContent = minComplexitySlider.value;
            }
        });
        
        minComplexitySlider.addEventListener('change', loadFKPContent);
        maxComplexitySlider.addEventListener('change', loadFKPContent);
        
        // Search functionality
        searchButton.addEventListener('click', loadFKPContent);
        
        // Enter key in search input
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadFKPContent();
            }
        });
    }
    
    /**
     * Initialize Fermat spiral visualization
     */
    function initFermatSpiral() {
        const spiral = document.querySelector('.fermat-spiral');
        if (!spiral) return;
        
        // Create spiral points
        for (let i = 0; i < 200; i++) {
            const point = document.createElement('div');
            point.className = 'spiral-point';
            
            // Fermat spiral formula: r = a * sqrt(θ)
            const theta = i * 0.5;
            const radius = 5 * Math.sqrt(theta);
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);
            
            point.style.left = `calc(50% + ${x}px)`;
            point.style.top = `calc(50% + ${y}px)`;
            point.style.animationDelay = `${i * 0.02}s`;
            
            spiral.appendChild(point);
        }
    }
    
    /**
     * Initialize Kardashev scale visualization
     */
    function initKardashevScale() {
        const scale = document.querySelector('.kardashev-scale');
        if (!scale) return;
        
        // Create concentric circles for each level
        for (let i = 1; i <= 5; i++) {
            const circle = document.createElement('div');
            circle.className = 'kardashev-circle';
            circle.dataset.level = i;
            scale.appendChild(circle);
        }
    }
    
    /**
     * Initialize Pauli matrix visualization
     */
    function initPauliMatrix() {
        const matrix = document.querySelector('.pauli-matrix');
        if (!matrix) return;
        
        // Create matrix cells
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Pauli matrix values
                const values = [
                    ['1', '0'],
                    ['0', '1']
                ];
                
                cell.textContent = values[i][j];
                matrix.appendChild(cell);
            }
        }
    }
    
    /**
     * Load FKP statistics
     */
    async function loadFKPStats() {
        try {
            const response = await fetch(`${apiBase}/fkp/stats`);
            if (!response.ok) throw new Error('Failed to fetch FKP stats');
            
            const stats = await response.json();
            
            // Update average complexity gauge
            if (averageComplexity && complexityValue) {
                const avg = stats.averageComplexity || 0;
                averageComplexity.style.width = `${avg}%`;
                complexityValue.textContent = avg.toFixed(1);
                
                // Set color based on complexity
                if (avg < 30) {
                    averageComplexity.style.backgroundColor = '#4caf50'; // green
                } else if (avg < 70) {
                    averageComplexity.style.backgroundColor = '#ff9800'; // orange
                } else {
                    averageComplexity.style.backgroundColor = '#f44336'; // red
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Error loading FKP stats:', error);
            if (complexityValue) {
                complexityValue.textContent = 'Error';
            }
            return null;
        }
    }
    
    /**
     * Load featured FKP content
     */
    async function loadFeaturedContent() {
        try {
            const response = await fetch(`${apiBase}/fkp/featured`);
            if (!response.ok) throw new Error('Failed to fetch featured content');
            
            const featuredContent = await response.json();
            
            // Clear loading placeholder
            featuredItemsContainer.innerHTML = '';
            
            // Show message if no featured content
            if (featuredContent.length === 0) {
                featuredItemsContainer.innerHTML = '<p class="no-content">No featured FKP content available.</p>';
                return;
            }
            
            // Render featured items
            featuredContent.forEach(item => {
                featuredItemsContainer.appendChild(createFKPCard(item, true));
            });
            
            // Render math formulas
            if (window.MathJax) {
                window.MathJax.typeset();
            }
        } catch (error) {
            console.error('Error loading featured content:', error);
            featuredItemsContainer.innerHTML = '<p class="error">Failed to load featured content.</p>';
        }
    }
    
    /**
     * Load FKP content with filtering
     */
    async function loadFKPContent() {
        try {
            // Show loading state
            contentItemsContainer.innerHTML = '<div class="content-placeholder">Loading FKP content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams();
            
            const theorem = theoremFilter.value;
            if (theorem) {
                params.append('theorem', theorem);
            }
            
            const kardashevLevel = kardashevFilter.value;
            if (kardashevLevel) {
                params.append('kardashevLevel', kardashevLevel);
            }
            
            const pauliState = pauliFilter.value;
            if (pauliState) {
                params.append('pauliState', pauliState);
            }
            
            const minComplexity = minComplexitySlider.value;
            params.append('minComplexity', minComplexity);
            
            const maxComplexity = maxComplexitySlider.value;
            params.append('maxComplexity', maxComplexity);
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            const response = await fetch(`${apiBase}/fkp?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch FKP content');
            
            const items = await response.json();
            
            // Clear loading placeholder
            contentItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                contentItemsContainer.innerHTML = '<p class="no-content">No FKP content matches your filters.</p>';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                contentItemsContainer.appendChild(createFKPCard(item));
            });
            
            // Render math formulas
            if (window.MathJax) {
                window.MathJax.typeset();
            }
        } catch (error) {
            console.error('Error loading FKP content:', error);
            contentItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
        }
    }
    
    /**
     * Create an FKP content card
     * @param {Object} item Content item
     * @param {boolean} isFeatured Whether this is a featured item
     * @returns {HTMLElement} Card element
     */
    function createFKPCard(item, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `fkp-card k${item.kardashevLevel || 0}${isFeatured ? ' featured' : ''}`;
        
        // Add complexity class
        const complexity = item.complexityIndex || 0;
        if (complexity < 30) {
            card.classList.add('low-complexity');
        } else if (complexity < 70) {
            card.classList.add('medium-complexity');
        } else {
            card.classList.add('high-complexity');
        }
        
        let formula = '';
        if (item.formula) {
            formula = `<div class="formula">\\[${escapeHTML(item.formula)}\\]</div>`;
        }
        
        card.innerHTML = `
            <div class="card-header">
                <div class="badges">
                    <span class="theorem-badge">${escapeHTML(item.theorem || 'Fermat')}</span>
                    <span class="kardashev-badge">K-${item.kardashevLevel || 0}</span>
                    <span class="pauli-badge">${escapeHTML(item.pauliState || 'Exclusive')}</span>
                </div>
                <div class="complexity-indicator" title="Complexity Index: ${complexity}">
                    <div class="complexity-bar" style="width: ${complexity}%"></div>
                    <span class="complexity-value">${complexity.toFixed(1)}</span>
                </div>
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            ${formula}
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/fkp/${item.id}" class="read-more">Explore</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', () => {
            window.location.href = `/fkp/${item.id}`;
        });
        
        return card;
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
        mainContent.insertBefore(errorElement, mainContent.firstChild);
        
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
