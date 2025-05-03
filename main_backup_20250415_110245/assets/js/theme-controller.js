/**
 * Theme Controller for Web3 Crypto Streaming Service
 * Manages dark/light mode switching with localStorage persistence
 */

class ThemeController {
  constructor() {
    this.themeKey = 'web3-theme-preference';
    this.darkModeClass = 'dark-theme';
    this.lightModeClass = 'light-theme';
    this.defaultTheme = 'dark'; // Default theme
    this.transitionDuration = 300; // ms
    
    this.currentTheme = this.loadThemePreference();
    this.listeners = [];
    
    // Initialize on instantiation
    this.applyTheme(this.currentTheme, false);
  }
  
  /**
   * Load saved theme from localStorage or use system preference
   * @returns {string} 'dark' or 'light'
   */
  loadThemePreference() {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.themeKey);
    if (savedTheme) return savedTheme;
    
    // Otherwise check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default
    return this.defaultTheme;
  }
  
  /**
   * Toggle between light and dark themes
   * @returns {string} The new theme name
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme, true);
    return newTheme;
  }
  
  /**
   * Set theme explicitly
   * @param {string} theme - 'dark' or 'light'
   */
  setTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      this.applyTheme(theme, true);
    }
  }
  
  /**
   * Apply the specified theme to the document
   * @param {string} theme - 'dark' or 'light'
   * @param {boolean} withTransition - Whether to animate the transition
   */
  applyTheme(theme, withTransition = true) {
    // Store the new theme
    this.currentTheme = theme;
    localStorage.setItem(this.themeKey, theme);
    
    // Apply transition if needed
    if (withTransition) {
      document.documentElement.style.transition = `background-color ${this.transitionDuration}ms ease, color ${this.transitionDuration}ms ease`;
      
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, this.transitionDuration);
    }
    
    // Update DOM
    document.documentElement.classList.remove(this.darkModeClass, this.lightModeClass);
    document.documentElement.classList.add(theme === 'dark' ? this.darkModeClass : this.lightModeClass);
    
    // Update HTML attribute for theme-specific CSS
    document.documentElement.setAttribute('data-theme', theme);
    
    // Notify listeners
    this.notifyListeners();
  }
  
  /**
   * Add a theme change listener
   * @param {Function} listener - Callback that receives the theme name
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      // Call immediately with current theme
      listener(this.currentTheme);
    }
  }
  
  /**
   * Remove a theme change listener
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of theme change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }
  
  /**
   * Get current theme name
   * @returns {string} 'dark' or 'light'
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Create global singleton instance
window.themeController = new ThemeController();

// Initialize theme toggle buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const toggleButtons = document.querySelectorAll('.theme-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const newTheme = window.themeController.toggleTheme();
      updateToggleButtons(newTheme);
    });
  });
  
  // Initial update of toggle buttons
  updateToggleButtons(window.themeController.getCurrentTheme());
  
  function updateToggleButtons(theme) {
    toggleButtons.forEach(button => {
      const icon = button.querySelector('i');
      if (icon) {
        if (theme === 'dark') {
          icon.className = 'fas fa-sun';
          button.setAttribute('title', 'Switch to Light Mode');
        } else {
          icon.className = 'fas fa-moon';
          button.setAttribute('title', 'Switch to Dark Mode');
        }
      }
    });
  }
});
