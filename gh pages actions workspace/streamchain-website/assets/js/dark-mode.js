// This file contains JavaScript code to handle dark mode functionality, allowing users to toggle between light and dark themes.

const darkModeToggle = document.querySelector('.dark-mode-toggle');
const sunIcon = document.querySelector('.sun');
const moonIcon = document.querySelector('.moon');

// Check if user prefers dark mode
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-theme');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
}

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    sunIcon.classList.toggle('hidden');
    moonIcon.classList.toggle('hidden');
});