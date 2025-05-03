/**
 * Dark Mode Toggle Functionality
 * Handles theme switching between light and dark modes
 */

(function () {
  // DOM elements
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Check for saved user preference, if any, on load
  const currentTheme = localStorage.getItem('theme');

  // If the user has explicitly chosen a theme, use it
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'dark' && themeToggle) {
      themeToggle.checked = true;
    }
  }
  // Otherwise use the system preference
  else if (prefersDarkScheme.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.checked = true;
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeToggle) themeToggle.checked = false;
    localStorage.setItem('theme', 'light');
  }

  // Listen for toggle changes
  if (themeToggle) {
    themeToggle.addEventListener('change', function (e) {
      if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');

        // Trigger animation
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 500);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');

        // Trigger animation
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 500);
      }
    });
  }

  // Listen for changes in system preference
  prefersDarkScheme.addEventListener('change', e => {
    const newColorScheme = e.matches ? 'dark' : 'light';

    // Only update if the user hasn't manually set a preference
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', newColorScheme);
      if (themeToggle) {
        themeToggle.checked = e.matches;
      }
    }
  });
})();
