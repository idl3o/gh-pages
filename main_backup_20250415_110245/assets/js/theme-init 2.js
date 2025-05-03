/**
 * Theme initialization script to prevent flash of incorrect theme
 * This runs immediately when included in the head before DOM is ready
 */
(function() {
  // Get theme from localStorage or use system preference
  function getInitialTheme() {
    const savedTheme = localStorage.getItem('web3-theme-preference');
    if (savedTheme) return savedTheme;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'dark'; // Default theme
  }
  
  // Apply theme immediately to prevent flash
  const theme = getInitialTheme();
  document.documentElement.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
  document.documentElement.setAttribute('data-theme', theme);
})();
