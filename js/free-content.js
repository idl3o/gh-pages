/**
 * Free Content Page JavaScript
 * Handles fetching and displaying free content
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const apiBase = '/api';
    let currentPage = 1;
    const itemsPerPage = 9;
    let currentCategory = '';
    let currentSearch = '';
    
    // DOM Elements
    const featuredItemsContainer = document.getElementById('featured-items');
    const contentItemsContainer = document.getElementById('content-items');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Load categories for filter
            await loadCategories();
            
            // Load featured content
            await loadFeaturedContent();
            
            // Load regular content (first page)
            await loadContent();
            
            // Set up event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing free content page:', error);
            showError('Failed to load content. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Category filter change
        categoryFilter.addEventListener('change', async () => {
            currentCategory = categoryFilter.value;
            currentPage = 1;
            await loadContent();
        });
        
        // Search functionality
        searchButton.addEventListener('click', async () => {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            await loadContent();
        });
        
        // Enter key in search input
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                currentSearch = searchInput.value.trim();
                currentPage = 1;
                await loadContent();
            }
        });
        
        // Pagination
        prevPageButton.addEventListener('click', async () => {
            if (currentPage > 1) {
                currentPage--;
                await loadContent();
            }
        });
        
        nextPageButton.addEventListener('click', async () => {
            currentPage++;
            await loadContent();
        });
    }
    
    /**
     * Load available categories
     */
    async function loadCategories() {
        try {
            const response = await fetch(`${apiBase}/free-content/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const categories = await response.json();
            
            // Add options to category filter
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    /**
     * Load featured content
     */
    async function loadFeaturedContent() {
        try {
            const response = await fetch(`${apiBase}/free-content?featured=true`);
            if (!response.ok) throw new Error('Failed to fetch featured content');
            
            const featuredContent = await response.json();
            
            // Clear loading placeholder
            featuredItemsContainer.innerHTML = '';
            
            // Show message if no featured content
            if (featuredContent.length === 0) {
                featuredItemsContainer.innerHTML = '<p class="no-content">No featured content available.</p>';
                return;
            }
            
            // Render featured items
            featuredContent.forEach(item => {
                featuredItemsContainer.appendChild(createContentCard(item, true));
            });
        } catch (error) {
            console.error('Error loading featured content:', error);
            featuredItemsContainer.innerHTML = '<p class="error">Failed to load featured content.</p>';
        }
    }
    
    /**
     * Load content with pagination
     */
    async function loadContent() {
        try {
            // Show loading state
            contentItemsContainer.innerHTML = '<div class="content-placeholder">Loading content...</div>';
            
            // Build query parameters
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage
            });
            
            if (currentCategory) {
                params.append('category', currentCategory);
            }
            
            if (currentSearch) {
                params.append('search', currentSearch);
            }
            
            const response = await fetch(`${apiBase}/free-content?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch content');
            
            const result = await response.json();
            const { items, pagination } = result;
            
            // Clear loading placeholder
            contentItemsContainer.innerHTML = '';
            
            // Show message if no content
            if (items.length === 0) {
                contentItemsContainer.innerHTML = '<p class="no-content">No content available.</p>';
                prevPageButton.disabled = true;
                nextPageButton.disabled = true;
                pageInfo.textContent = 'No results';
                return;
            }
            
            // Render content items
            items.forEach(item => {
                contentItemsContainer.appendChild(createContentCard(item));
            });
            
            // Update pagination controls
            updatePagination(pagination);
        } catch (error) {
            console.error('Error loading content:', error);
            contentItemsContainer.innerHTML = '<p class="error">Failed to load content.</p>';
        }
    }
    
    /**
     * Create a content card element
     */
    function createContentCard(item, isFeatured = false) {
        const card = document.createElement('div');
        card.className = `content-card${isFeatured ? ' featured' : ''}`;
        card.innerHTML = `
            <div class="card-header">
                <span class="category">${escapeHTML(item.category)}</span>
                ${item.featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            <h3 class="title">${escapeHTML(item.title)}</h3>
            <p class="description">${escapeHTML(item.description)}</p>
            <div class="card-footer">
                <span class="views">${item.views || 0} views</span>
                <a href="/content/${item.id}" class="read-more">Read More</a>
            </div>
        `;
        
        // Add click event to the card
        card.addEventListener('click', () => {
            window.location.href = `/content/${item.id}`;
        });
        
        return card;
    }
    
    /**
     * Update pagination controls
     */
    function updatePagination(pagination) {
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= pagination.totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${pagination.totalPages}`;
    }
    
    /**
     * Show error message
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
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
