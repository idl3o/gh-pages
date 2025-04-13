/**
 * Laplacian Angel - Mathematics for Cryptography
 * JavaScript for the Laplacian Angel page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const apiBase = '/api';
    
    // DOM Elements
    const featuredItemsContainer = document.getElementById('featured-items');
    const contentItemsContainer = document.getElementById('content-items');
    const mathTypeFilter = document.getElementById('math-type-filter');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Load featured mathematical content
            await loadFeaturedContent();
            
            // Load all mathematical content
            await loadMathContent();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize MathJax rendering
            if (window.MathJax) {
                window.MathJax.typeset();
            }
        } catch (error) {
            console.error('Error initializing Laplacian Angel page:', error);
            showError('Failed to load mathematical content. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Math type filter change
        mathTypeFilter.addEventListener('change', async () => {
            await loadMathContent();
        });
        
        // Search functionality
        searchButton.addEventListener('click', async () => {
            await loadMathContent();
        });
        
        // Enter key in search input
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await loadMathContent();
            }
        });
    }
    
    /**
     * Load featured mathematical content
     */
    async function loadFeaturedContent() {
        try {
            const response = await fetch(`${apiBase}/laplacian-angel/featured`);
            if (!response.ok) throw new Error('Failed to fetch featured content');
            
            const featuredContent = await response.json();
            
            // Clear loading placeholder
            featuredItemsContainer.innerHTML = '';
            
            // Show message if no featured content
            if (featuredContent.length === 0) {
                featuredItemsContainer.innerHTML = '<p class="no-content">No featured mathematical content available.</p>';
                return;
            }
            
            // Render featured items
            featuredContent.forEach(item => {
                featuredItemsContainer.appendChild(createMathCard(item, true));
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
     * Load mathematical content with filtering
     */
    async function loadMathContent() {
        try {
            // Show loading state
            contentItemsContainer.innerHTML = '<div class="content-placeholder">Loading mathematical content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams();
            
            const mathType = mathTypeFilter.value;
            if (mathType) {
                params.append('mathType', mathType);
            }
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            const response = await fetch(`${apiBase}/laplacian-angel?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch mathematical content');
            
            const items = await response.json();
            
            // Clear loading placeholder
            contentItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                contentItemsContainer.innerHTML = '<p class="no-content">No mathematical content available.</p>';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                contentItemsContainer.appendChild(createMathCard(item));
            });
            
            // Render math formulas
            if (window.MathJax) {
                window.MathJax.typeset();
            }
        } catch (error) {
            console.error('Error loading mathematical content:', error);
            contentItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
        }
    }
    
    /**
     * Create a mathematical content card
     * @param {Object} item Content item
     * @param {boolean} isFeatured Whether this is a featured item
     * @returns {HTMLElement} Card element
     */
    function createMathCard(item, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `math-card${isFeatured ? ' featured' : ''}`;
        
        // Extract a sample formula if present
        let formulaPreview = '';
        if (item.content && item.content.includes('\\[')) {
            const formulaMatch = item.content.match(/\\[(.*?)\\]/);
            if (formulaMatch) {
                formulaPreview = `<div class="formula-preview">\\[${formulaMatch[1]}\\]</div>`;
            }
        }
        
        card.innerHTML = `
            <div class="card-header">
                <span class="math-type">${escapeHTML(item.mathType || 'Laplacian')}</span>
                ${item.featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            ${formulaPreview}
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/laplacian-angel/${item.id}" class="read-more">Explore</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', () => {
            window.location.href = `/laplacian-angel/${item.id}`;
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
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
