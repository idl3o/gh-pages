/**
 * Main JavaScript file for Web3 Crypto Streaming Service
 */

// Handle theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (!themeToggle) return;

    // Check for saved theme preference or use system preference
    if (localStorage.getItem('theme') === 'dark' ||
        (localStorage.getItem('theme') !== 'light' && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
    }

    // Handle theme toggle click
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}

// Copy to clipboard functionality
function setupCopyLinks() {
    const copyLinks = document.querySelectorAll('.copy-link');
    
    copyLinks.forEach(link => {
        link.addEventListener('click', () => {
            const url = link.dataset.url;
            navigator.clipboard.writeText(url)
                .then(() => {
                    const originalText = link.textContent;
                    link.textContent = '✓';
                    link.style.color = 'var(--success)';

                    setTimeout(() => {
                        link.textContent = originalText;
                        link.style.color = '';
                    }, 1500);
                });
        });
    });
}

// Back to top button
function setupBackToTopButton() {
    const backToTop = document.querySelector('.back-to-top');
    
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty anchors
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    setupCopyLinks();
    setupBackToTopButton();
    initSmoothScrolling();
});
