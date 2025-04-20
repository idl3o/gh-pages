/**
 * Theme Controller for GitHub Pages
 * Handles theme preferences (dark/light) consistently across the site
 */

(function() {
  // Theme constants
  const THEME_STORAGE_KEY = 'preferred-theme';
  const DARK_THEME = 'dark-theme';
  const LIGHT_THEME = 'light-theme';
  const SYSTEM_PREFERENCE = 'system';
  
  // DOM elements
  const body = document.body;
  let themeToggles;
  
  /**
   * Initialize the theme controller
   */
  function init() {
    // Detect theme toggles in the page
    themeToggles = document.querySelectorAll('.theme-toggle, [data-toggle="theme"]');
    
    // Apply the current theme
    applyTheme(getCurrentTheme());
    
    // Add event listeners to theme toggles
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', toggleTheme);
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (localStorage.getItem(THEME_STORAGE_KEY) === SYSTEM_PREFERENCE) {
        applyTheme(SYSTEM_PREFERENCE);
      }
    });
    
    // Make theme controls visible after initialization
    document.querySelectorAll('.theme-control').forEach(control => {
      control.style.display = 'flex';
    });
  }
  
  /**
   * Apply the specified theme
   * @param {string} theme - The theme to apply: 'dark-theme', 'light-theme', or 'system'
   */
  function applyTheme(theme) {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Clear existing theme classes
    body.classList.remove(DARK_THEME, LIGHT_THEME);
    
    if (theme === SYSTEM_PREFERENCE) {
      // Apply theme based on system preference
      body.classList.add(prefersDarkScheme ? DARK_THEME : LIGHT_THEME);
      updateThemeIcons(prefersDarkScheme ? 'dark' : 'light');
    } else {
      // Apply specified theme
      body.classList.add(theme);
      updateThemeIcons(theme === DARK_THEME ? 'dark' : 'light');
    }
    
    // Save preference to local storage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Dispatch event for other components to react to theme change
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { 
        theme: theme,
        isDark: body.classList.contains(DARK_THEME)
      } 
    }));
  }
  
  /**
   * Toggle between dark and light themes
   */
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    
    // If using system preference or dark theme, switch to light
    if (currentTheme === SYSTEM_PREFERENCE || body.classList.contains(DARK_THEME)) {
      applyTheme(LIGHT_THEME);
    } else {
      // Otherwise switch to dark
      applyTheme(DARK_THEME);
    }
  }
  
  /**
   * Get the current theme preference
   * @returns {string} The current theme: 'dark-theme', 'light-theme', or 'system'
   */
  function getCurrentTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Default to system preference if no saved theme
    return SYSTEM_PREFERENCE;
  }
  
  /**
   * Update theme toggle icons based on current theme
   * @param {string} theme - 'dark' or 'light'
   */
  function updateThemeIcons(theme) {
    themeToggles.forEach(toggle => {
      // If the toggle uses icon elements
      const darkIcon = toggle.querySelector('.dark-icon');
      const lightIcon = toggle.querySelector('.light-icon');
      
      if (darkIcon && lightIcon) {
        darkIcon.style.display = theme === 'light' ? 'block' : 'none';
        lightIcon.style.display = theme === 'dark' ? 'block' : 'none';
      } else {
        // If the toggle uses text or other method, try to update aria-label
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
    });
  }
  
  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
