/**
 * Codex Artemis - Advanced Knowledge System
 * JS Implementation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const apiBase = '/api';
    let currentFilters = {
        domain: '',
        competencyLevel: '',
        minComplexity: 1,
        maxComplexity: 10,
        keyword: ''
    };
    
    // DOM Elements
    const domainFilter = document.getElementById('domain-filter');
    const competencyFilter = document.getElementById('competency-filter');
    const minComplexitySlider = document.getElementById('min-complexity');
    const maxComplexitySlider = document.getElementById('max-complexity');
    const minComplexityValue = document.getElementById('min-complexity-value');
    const maxComplexityValue = document.getElementById('max-complexity-value');
    const keywordSearch = document.getElementById('keyword-search');
    const searchButton = document.getElementById('search-button');
    const knowledgeGrid = document.getElementById('knowledge-grid');
    
    // Stats elements
    const totalEntriesElement = document.getElementById('total-entries');
    const totalReferencesElement = document.getElementById('total-references');
    const connectivityIndexElement = document.getElementById('connectivity-index');
    const domainsCountElement = document.getElementById('domains-count');
    
    // Knowledge graph
    const knowledgeGraph = document.querySelector('.knowledge-graph');
    
    // Initialize the page
    init();
    
    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Load codex statistics
            await loadCodexStats();
            
            // Initialize filters
            await initializeFilters();
            
            // Load initial entries
            await loadCodexEntries();
            
            // Initialize knowledge graph visualization
            initKnowledgeGraph();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize complexity gauges
            initComplexityGauges();
        } catch (error) {
            console.error('Error initializing Codex Artemis:', error);
            showError('Failed to initialize Codex Artemis. Please try again later.');
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Domain filter change
        domainFilter.addEventListener('change', () => {
            currentFilters.domain = domainFilter.value;
            loadCodexEntries();
        });
        
        // Competency filter change
        competencyFilter.addEventListener('change', () => {
            currentFilters.competencyLevel = competencyFilter.value;
            loadCodexEntries();
        });
        
        // Complexity sliders
        minComplexitySlider.addEventListener('input', () => {
            currentFilters.minComplexity = parseFloat(minComplexitySlider.value);
            minComplexityValue.textContent = currentFilters.minComplexity;
            
            // Ensure min doesn't exceed max
            if (currentFilters.minComplexity > currentFilters.maxComplexity) {
                maxComplexitySlider.value = minComplexitySlider.value;
                maxComplexityValue.textContent = currentFilters.minComplexity;
                currentFilters.maxComplexity = currentFilters.minComplexity;
            }
        });
        
        maxComplexitySlider.addEventListener('input', () => {
            currentFilters.maxComplexity = parseFloat(maxComplexitySlider.value);
            maxComplexityValue.textContent = currentFilters.maxComplexity;
            
            // Ensure max doesn't go below min
            if (currentFilters.maxComplexity < currentFilters.minComplexity) {
                minComplexitySlider.value = maxComplexitySlider.value;
                minComplexityValue.textContent = currentFilters.maxComplexity;
                currentFilters.minComplexity = currentFilters.maxComplexity;
            }
        });
        
        minComplexitySlider.addEventListener('change', loadCodexEntries);
        maxComplexitySlider.addEventListener('change', loadCodexEntries);
        
        // Keyword search
        searchButton.addEventListener('click', () => {
            currentFilters.keyword = keywordSearch.value.trim();
            loadCodexEntries();
        });
        
        keywordSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilters.keyword = keywordSearch.value.trim();
                loadCodexEntries();
            }
        });
        
        // Domain card clicks
        document.querySelectorAll('.domain-card').forEach(card => {
            card.addEventListener('click', () => {
                const domain = card.dataset.domain;
                domainFilter.value = domain;
                currentFilters.domain = domain;
                loadCodexEntries();
                
                // Scroll to explorer section
                document.querySelector('.codex-explorer').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        });
    }
    
    /**
     * Initialize filters with taxonomy data
     */
    async function initializeFilters() {
        try {
            const response = await fetch(`${apiBase}/codex-artemis/taxonomy`);
            if (!response.ok) throw new Error('Failed to fetch taxonomy data');
            
            const taxonomy = await response.json();
            
            // Populate domain filter
            if (taxonomy.domains && Array.isArray(taxonomy.domains)) {
                taxonomy.domains.forEach(domain => {
                    const option = document.createElement('option');
                    option.value = domain;
                    option.textContent = domain;
                    domainFilter.appendChild(option);
                });
            }
            
            // Populate competency filter
            if (taxonomy.competencies && Array.isArray(taxonomy.competencies)) {
                taxonomy.competencies.forEach(competency => {
                    const option = document.createElement('option');
                    option.value = competency;
                    option.textContent = competency;
                    competencyFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading taxonomy:', error);
            // Add fallback options if taxonomy loading fails
            const fallbackDomains = ['Natural Sciences', 'Formal Sciences', 'Social Sciences', 'Humanities', 'Applied Sciences', 'Interdisciplinary'];
            fallbackDomains.forEach(domain => {
                const option = document.createElement('option');
                option.value = domain;
                option.textContent = domain;
                domainFilter.appendChild(option);
            });
            
            const fallbackCompetencies = ['Novice', 'Advanced Beginner', 'Competent', 'Proficient', 'Expert', 'Master'];
            fallbackCompetencies.forEach(competency => {
                const option = document.createElement('option');
                option.value = competency;
                option.textContent = competency;
                competencyFilter.appendChild(option);
            });
        }
    }
    
    /**
     * Load Codex Artemis statistics
     */
    async function loadCodexStats() {
        try {
            const response = await fetch(`${apiBase}/codex-artemis/stats`);
            if (!response.ok) throw new Error('Failed to fetch codex stats');
            
            const stats = await response.json();
            
            // Update stats display
            if (totalEntriesElement) {
                totalEntriesElement.textContent = formatNumber(stats.totalEntries);
            }
            
            if (totalReferencesElement) {
                totalReferencesElement.textContent = formatNumber(stats.totalReferences);
            }
            
            if (connectivityIndexElement) {
                connectivityIndexElement.textContent = stats.connectivityIndex.toFixed(1);
            }
            
            if (domainsCountElement) {
                const domainsCount = Object.keys(stats.byDomain).length;
                domainsCountElement.textContent = domainsCount;
            }
            
            return stats;
        } catch (error) {
            console.error('Error loading Codex Artemis stats:', error);
            // Display fallback stats
            if (totalEntriesElement) totalEntriesElement.textContent = '- -';
            if (totalReferencesElement) totalReferencesElement.textContent = '- -';
            if (connectivityIndexElement) connectivityIndexElement.textContent = '- -';
            if (domainsCountElement) domainsCountElement.textContent = '- -';
            
            return null;
        }
    }
    
    /**
     * Load Codex Artemis entries based on current filters
     */
    async function loadCodexEntries() {
        try {
            if (!knowledgeGrid) return;
            
            // Show loading state
            knowledgeGrid.innerHTML = '<div class="loading">Loading knowledge entries...</div>';
            
            // Build query string
            const params = new URLSearchParams();
            
            if (currentFilters.domain) {
                params.append('domain', currentFilters.domain);
            }
            
            if (currentFilters.competencyLevel) {
                params.append('competencyLevel', currentFilters.competencyLevel);
            }
            
            params.append('minComplexity', currentFilters.minComplexity);
            params.append('maxComplexity', currentFilters.maxComplexity);
            
            if (currentFilters.keyword) {
                params.append('keyword', currentFilters.keyword);
            }
            
            const response = await fetch(`${apiBase}/codex-artemis/entries?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch codex entries');
            
            const entries = await response.json();
            
            // Clear loading state
            knowledgeGrid.innerHTML = '';
            
            // Show no results message if needed
            if (entries.length === 0) {
                knowledgeGrid.innerHTML = `
                    <div class="no-results">
                        <p>No knowledge entries match your criteria.</p>
                        <button class="reset-filters-btn">Reset Filters</button>
                    </div>
                `;
                
                document.querySelector('.reset-filters-btn').addEventListener('click', resetFilters);
                return;
            }
            
            // Render entries
            const template = document.getElementById('knowledge-entry-template');
            
            entries.forEach(entry => {
                if (!template) {
                    // Fallback if template isn't available
                    const entryElement = document.createElement('div');
                    entryElement.className = 'knowledge-entry';
                    entryElement.innerHTML = `
                        <h3>${escapeHTML(entry.title)}</h3>
                        <p>${escapeHTML(entry.summary)}</p>
                    `;
                    knowledgeGrid.appendChild(entryElement);
                    return;
                }
                
                // Use template to create entry
                const entryElement = template.content.cloneNode(true);
                
                // Fill in data
                entryElement.querySelector('.domain-badge').textContent = entry.domain;
                entryElement.querySelector('.competency-badge').textContent = entry.competencyLevel;
                entryElement.querySelector('.entry-title').textContent = entry.title;
                entryElement.querySelector('.entry-summary').textContent = entry.summary;
                
                // Set up complexity indicator
                const complexityBar = entryElement.querySelector('.complexity-bar');
                const complexityValue = entryElement.querySelector('.complexity-value');
                
                if (complexityBar) {
                    complexityBar.style.width = `${(entry.complexityLevel / 10) * 100}%`;
                    
                    // Color based on complexity
                    if (entry.complexityLevel < 4) {
                        complexityBar.classList.add('low');
                    } else if (entry.complexityLevel < 7) {
                        complexityBar.classList.add('medium');
                    } else {
                        complexityBar.classList.add('high');
                    }
                }
                
                if (complexityValue) {
                    complexityValue.textContent = entry.complexityLevel;
                }
                
                // Connection and reference counts
                const connectionsCount = entryElement.querySelector('.connections-count');
                const referencesCount = entryElement.querySelector('.references-count');
                
                if (connectionsCount) {
                    const count = entry.connections?.length || 0;
                    connectionsCount.textContent = `${count} connection${count !== 1 ? 's' : ''}`;
                }
                
                if (referencesCount) {
                    const count = entry.references?.length || 0;
                    referencesCount.textContent = `${count} reference${count !== 1 ? 's' : ''}`;
                }
                
                // Set up view button
                const viewButton = entryElement.querySelector('.view-entry-btn');
                if (viewButton) {
                    viewButton.href = `/codex-entry/${entry.id}`;
                }
                
                // Add the entry to the grid
                knowledgeGrid.appendChild(entryElement);
            });
        } catch (error) {
            console.error('Error loading Codex Artemis entries:', error);
            if (knowledgeGrid) {
                knowledgeGrid.innerHTML = `
                    <div class="error-message">
                        <p>Failed to load knowledge entries. Please try again later.</p>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Reset all filters to default values
     */
    function resetFilters() {
        // Reset filter values
        domainFilter.value = '';
        competencyFilter.value = '';
        minComplexitySlider.value = 1;
        maxComplexitySlider.value = 10;
        minComplexityValue.textContent = '1';
        maxComplexityValue.textContent = '10';
        keywordSearch.value = '';
        
        // Reset filter object
        currentFilters = {
            domain: '',
            competencyLevel: '',
            minComplexity: 1,
            maxComplexity: 10,
            keyword: ''
        };
        
        // Reload entries
        loadCodexEntries();
    }
    
    /**
     * Initialize the knowledge graph visualization
     */
    function initKnowledgeGraph() {
        if (!knowledgeGraph) return;
        
        // This is a simplified placeholder for a real graph visualization
        // A real implementation would use D3.js, Sigma.js, or similar
        
        // Create nodes
        for (let i = 0; i < 15; i++) {
            const node = document.createElement('div');
            node.className = 'graph-node';
            
            // Randomize position
            node.style.left = `${10 + Math.random() * 80}%`;
            node.style.top = `${10 + Math.random() * 80}%`;
            
            // Randomize size based on connections
            const size = 6 + Math.random() * 12;
            node.style.width = `${size}px`;
            node.style.height = `${size}px`;
            
            // Randomize domain/category
            const domains = ['natural', 'formal', 'social', 'humanities', 'applied', 'interdisciplinary'];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            node.classList.add(domain);
            
            knowledgeGraph.appendChild(node);
        }
        
        // Create edges (connections)
        for (let i = 0; i < 20; i++) {
            const edge = document.createElement('div');
            edge.className = 'graph-edge';
            
            // Randomize position and rotation
            edge.style.left = `${20 + Math.random() * 60}%`;
            edge.style.top = `${20 + Math.random() * 60}%`;
            edge.style.width = `${20 + Math.random() * 80}px`;
            edge.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            knowledgeGraph.appendChild(edge);
        }
    }
    
    /**
     * Initialize complexity gauges on domain cards
     */
    function initComplexityGauges() {
        document.querySelectorAll('.complexity-gauge').forEach(gauge => {
            const complexity = parseFloat(gauge.dataset.complexity);
            
            const fill = document.createElement('div');
            fill.className = 'gauge-fill';
            fill.style.width = `${(complexity / 10) * 100}%`;
            
            // Add color based on complexity
            if (complexity < 4) {
                fill.classList.add('low');
            } else if (complexity < 7) {
                fill.classList.add('medium');
            } else {
                fill.classList.add('high');
            }
            
            gauge.appendChild(fill);
            
            const value = document.createElement('span');
            value.className = 'gauge-value';
            value.textContent = complexity.toFixed(1);
            gauge.appendChild(value);
        });
    }
    
    /**
     * Format a number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-notification';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.classList.add('fade-out');
            setTimeout(() => {
                errorElement.remove();
            }, 500);
        }, 5000);
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, (match) => {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }
});
