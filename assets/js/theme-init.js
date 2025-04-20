/**
 * Theme initialization script
 * Runs before the page content loads to prevent theme flickering
 */

(function() {
  // Theme constants
  const THEME_STORAGE_KEY = 'preferred-theme';
  const DARK_THEME = 'dark-theme';
  const LIGHT_THEME = 'light-theme';
  const SYSTEM_PREFERENCE = 'system';
  
  // Get saved theme preference
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  
  // Determine which theme to apply
  let themeToApply;
  
  if (savedTheme) {
    if (savedTheme === SYSTEM_PREFERENCE) {
      // Check system preference
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
        DARK_THEME : LIGHT_THEME;
    } else {
      themeToApply = savedTheme;
    }
  } else {
    // Default to system preference if no saved theme
    themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
      DARK_THEME : LIGHT_THEME;
  }
  
  // Apply theme class to html element immediately to prevent flickering
  document.documentElement.classList.add(themeToApply);
})();
