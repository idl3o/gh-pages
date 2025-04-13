/**
 * Platonic Forms - Philosophy Content
 * JavaScript for the Platonic Forms page
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const apiBase = '/api';
    
    // DOM Elements
    const featuredItemsContainer = document.getElementById('featured-items');
    const contentItemsContainer = document.getElementById('content-items');
    const allegoryFilter = document.getElementById('allegory-filter');
    const philosopherFilter = document.getElementById('philosopher-filter');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Load featured philosophical content
            await loadFeaturedContent();
            
            // Load all philosophical content
            await loadPhilosophicalContent();
            
            // Set up event listeners
            setupEventListeners();
            
            // Add cave animation
            initializeCaveAnimation();
        } catch (error) {
            console.error('Error initializing Platonic Forms page:', error);
            showError('Failed to load philosophical content. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Allegory filter change
        allegoryFilter.addEventListener('change', async () => {
            await loadPhilosophicalContent();
        });
        
        // Philosopher filter change
        philosopherFilter.addEventListener('change', async () => {
            await loadPhilosophicalContent();
        });
        
        // Search functionality
        searchButton.addEventListener('click', async () => {
            await loadPhilosophicalContent();
        });
        
        // Enter key in search input
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await loadPhilosophicalContent();
            }
        });
    }
    
    /**
     * Load featured philosophical content
     */
    async function loadFeaturedContent() {
        try {
            const response = await fetch(`${apiBase}/platonic-content/featured`);
            if (!response.ok) throw new Error('Failed to fetch featured content');
            
            const featuredContent = await response.json();
            
            // Clear loading placeholder
            featuredItemsContainer.innerHTML = '';
            
            // Show message if no featured content
            if (featuredContent.length === 0) {
                featuredItemsContainer.innerHTML = '<p class="no-content">No featured philosophical content available.</p>';
                return;
            }
            
            // Render featured items
            featuredContent.forEach(item => {
                featuredItemsContainer.appendChild(createPhilosophyCard(item, true));
            });
        } catch (error) {
            console.error('Error loading featured content:', error);
            featuredItemsContainer.innerHTML = '<p class="error">Failed to load featured content.</p>';
        }
    }
    
    /**
     * Load philosophical content with filtering
     */
    async function loadPhilosophicalContent() {
        try {
            // Show loading state
            contentItemsContainer.innerHTML = '<div class="content-placeholder">Loading philosophical content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams();
            
            const allegory = allegoryFilter.value;
            if (allegory) {
                params.append('allegory', allegory);
            }
            
            const philosopher = philosopherFilter.value;
            if (philosopher) {
                params.append('philosopher', philosopher);
            }
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            const response = await fetch(`${apiBase}/platonic-content?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch philosophical content');
            
            const items = await response.json();
            
            // Clear loading placeholder
            contentItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                contentItemsContainer.innerHTML = '<p class="no-content">No philosophical content available.</p>';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                contentItemsContainer.appendChild(createPhilosophyCard(item));
            });
        } catch (error) {
            console.error('Error loading philosophical content:', error);
            contentItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
        }
    }
    
    /**
     * Create a philosophical content card
     * @param {Object} item Content item
     * @param {boolean} isFeatured Whether this is a featured item
     * @returns {HTMLElement} Card element
     */
    function createPhilosophyCard(item, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `philosophy-card${isFeatured ? ' featured' : ''}`;
        
        // Add allegory-specific class
        if (item.allegory) {
            card.classList.add(`allegory-${item.allegory.toLowerCase().replace(/\s+/g, '-')}`);
        }
        
        card.innerHTML = `
            <div class="card-header">
                <span class="allegory-badge">${escapeHTML(item.allegory || 'Cave')}</span>
                <span class="philosopher-badge">${escapeHTML(item.philosopher || 'Plato')}</span>
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/platonic-forms/${item.id}" class="read-more">Explore</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', () => {
            window.location.href = `/platonic-forms/${item.id}`;
        });
        
        return card;
    }
    
    /**
     * Initialize the cave animation
     */
    function initializeCaveAnimation() {
        const caveElement = document.querySelector('.cave-illustration');
        
        if (!caveElement) return;
        
        // Add shadow movement
        let position = 0;
        setInterval(() => {
            position = (position + 1) % 100;
            const shadow = caveElement.querySelector('.shadow');
            if (shadow) {
                shadow.style.backgroundPosition = `${position}% 0`;
            }
        }, 100);
        
        // Add reality movement on hover
        caveElement.addEventListener('mouseover', () => {
            const reality = caveElement.querySelector('.reality');
            if (reality) {
                reality.style.opacity = '1';
            }
        });
        
        caveElement.addEventListener('mouseout', () => {
            const reality = caveElement.querySelector('.reality');
            if (reality) {
                reality.style.opacity = '0.3';
            }
        });
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
