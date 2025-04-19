/**
 * Main JavaScript for Web3 Crypto Streaming Service
 */

<<<<<<< Updated upstream
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initThemeSwitcher();
    initSmoothScroll();
    initAnimations();
    initWalletConnect();
    loadHomepageStats(); // Load homepage statistics

    // Add scroll event listener for header
    window.addEventListener('scroll', handleHeaderScroll);
=======
document.addEventListener('DOMContentLoaded', function () {
  // Initialize components
  initThemeSwitcher();
  initSmoothScroll();
  initAnimations();
  initWalletConnect();
  loadHomepageStats(); // Load homepage statistics
>>>>>>> Stashed changes

  // Add scroll event listener for header
  window.addEventListener('scroll', handleHeaderScroll);

<<<<<<< Updated upstream
        flymodeToggle.addEventListener('click', () => {
            document.body.classList.toggle('flymode-active');
        });
    }

    // Mobile menu toggle
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.classList.add('mobile-menu-button');
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';

    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');

    if (nav && navLinks && window.innerWidth <= 768) {
        nav.insertBefore(mobileMenuButton, navLinks);

        mobileMenuButton.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Add current year to copyright notices
    document.querySelectorAll('.copyright-year').forEach(element => {
        element.textContent = new Date().getFullYear();
    });
=======
  // Add flymode toggle button if not already added by flymode.js
  if (!document.querySelector('.flymode-toggle')) {
    const flymodeToggle = document.createElement('button');
    flymodeToggle.className = 'flymode-toggle';
    flymodeToggle.innerHTML = '🚀';
    document.body.appendChild(flymodeToggle);

    flymodeToggle.addEventListener('click', () => {
      document.body.classList.toggle('flymode-active');
    });
  }
>>>>>>> Stashed changes
});

/**
 * Theme Switcher Functionality
 */
function initThemeSwitcher() {
<<<<<<< Updated upstream
    const themeSwitcher = document.getElementById('theme-switcher');

    if (!themeSwitcher) return;

    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDarkTheme)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeSwitcher.querySelector('input')) {
            themeSwitcher.querySelector('input').checked = true;
        }
    }

    // Theme switch event handler
    themeSwitcher.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
=======
  const themeSwitcher = document.getElementById('theme-switcher');

  if (!themeSwitcher) return;

  // Check for saved theme preference or respect OS preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDarkTheme)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeSwitcher.querySelector('input')) {
      themeSwitcher.querySelector('input').checked = true;
    }
  }

  // Theme switch event handler
  themeSwitcher.addEventListener('click', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
>>>>>>> Stashed changes
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
<<<<<<< Updated upstream
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            // Skip if it's just "#" or empty
            if (targetId === '#' || !targetId) return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                const menuToggle = document.querySelector('.menu-toggle');

                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    if (menuToggle) menuToggle.classList.remove('active');
                }

                // Scroll to the target element
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Account for header height
                    behavior: 'smooth'
                });

                // Update URL without scrolling
                history.pushState(null, null, targetId);
            }
=======
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');

      // Skip if it's just "#" or empty
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();

        // Close mobile menu if open
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');

        if (navLinks && navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          if (menuToggle) menuToggle.classList.remove('active');
        }

        // Scroll to the target element
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
>>>>>>> Stashed changes
        });

        // Update URL without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
}

/**
 * Handle Header Scroll Effects
 */
function handleHeaderScroll() {
<<<<<<< Updated upstream
    const header = document.querySelector('.site-header');

    if (!header) return;

    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
=======
  const header = document.querySelector('.site-header');

  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
>>>>>>> Stashed changes
}

/**
 * Initialize Scroll Animations
 */
function initAnimations() {
<<<<<<< Updated upstream
    // Only run if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) return;

    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
=======
  // Only run if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) return;

  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          // Unobserve after animation
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1
    }
  );

  animatedElements.forEach(element => {
    observer.observe(element);
  });
>>>>>>> Stashed changes
}

/**
 * Wallet Connection Functionality
 */
function initWalletConnect() {
<<<<<<< Updated upstream
    const connectButton = document.getElementById('connect-wallet');
    const walletStatus = document.getElementById('wallet-status');
    const walletAddress = document.getElementById('wallet-address');
    const walletBalance = document.getElementById('wallet-balance');

    if (!connectButton) return;

    connectButton.addEventListener('click', async function() {
        // Check if Web3 is available
        if (window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Get the first account
                const account = accounts[0];

                // Show wallet info
                if (walletStatus) walletStatus.classList.remove('hidden');
                if (connectButton) connectButton.classList.add('hidden');

                // Format and display account address
                if (walletAddress) {
                    const formattedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                    walletAddress.textContent = formattedAddress;
                }

                // Get and display balance
                if (walletBalance) {
                    const balance = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [account, 'latest']
                    });

                    const etherBalance = parseInt(balance, 16) / 1e18;
                    walletBalance.textContent = `${etherBalance.toFixed(4)} ETH`;
                }

                // Store connection in session
                sessionStorage.setItem('walletConnected', 'true');
                sessionStorage.setItem('walletAddress', account);

            } catch (error) {
                console.error('Error connecting wallet:', error);
                alert('Failed to connect wallet. Please try again.');
            }
        } else {
            alert('Web3 wallet not detected. Please install MetaMask or another Web3 wallet.');
        }
    });

    // Check if wallet was previously connected in this session
    if (sessionStorage.getItem('walletConnected') === 'true') {
        const savedAddress = sessionStorage.getItem('walletAddress');

        if (savedAddress && walletAddress) {
            const formattedAddress = `${savedAddress.substring(0, 6)}...${savedAddress.substring(savedAddress.length - 4)}`;
            walletAddress.textContent = formattedAddress;

            if (walletStatus) walletStatus.classList.remove('hidden');
            if (connectButton) connectButton.classList.add('hidden');
=======
  const connectButton = document.getElementById('connect-wallet');
  const walletStatus = document.getElementById('wallet-status');
  const walletAddress = document.getElementById('wallet-address');
  const walletBalance = document.getElementById('wallet-balance');

  if (!connectButton) return;

  connectButton.addEventListener('click', async function () {
    // Check if Web3 is available
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Get the first account
        const account = accounts[0];

        // Show wallet info
        if (walletStatus) walletStatus.classList.remove('hidden');
        if (connectButton) connectButton.classList.add('hidden');

        // Format and display account address
        if (walletAddress) {
          const formattedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
          walletAddress.textContent = formattedAddress;
        }

        // Get and display balance
        if (walletBalance) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });

          const etherBalance = parseInt(balance, 16) / 1e18;
          walletBalance.textContent = `${etherBalance.toFixed(4)} ETH`;
>>>>>>> Stashed changes
        }

        // Store connection in session
        sessionStorage.setItem('walletConnected', 'true');
        sessionStorage.setItem('walletAddress', account);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Web3 wallet not detected. Please install MetaMask or another Web3 wallet.');
    }
  });

  // Check if wallet was previously connected in this session
  if (sessionStorage.getItem('walletConnected') === 'true') {
    const savedAddress = sessionStorage.getItem('walletAddress');

    if (savedAddress && walletAddress) {
      const formattedAddress = `${savedAddress.substring(0, 6)}...${savedAddress.substring(savedAddress.length - 4)}`;
      walletAddress.textContent = formattedAddress;

      if (walletStatus) walletStatus.classList.remove('hidden');
      if (connectButton) connectButton.classList.add('hidden');
    }
  }
}

/**
 * Load and display dynamic statistics on the homepage
 */
function loadHomepageStats() {
  const creatorRevenueElement = document.getElementById('creator-revenue');
  const platformControlElement = document.getElementById('platform-control');
  const ownershipElement = document.getElementById('ownership');
  const creatorCountElement = document.getElementById('creator-count');
  const contentCountElement = document.getElementById('content-count');
  const tokenVolumeElement = document.getElementById('token-volume');
  const storageCountElement = document.getElementById('storage-count');

  if (creatorRevenueElement) creatorRevenueElement.textContent = '90%';
  if (platformControlElement) platformControlElement.textContent = '0%';
  if (ownershipElement) ownershipElement.textContent = '100%';

  // Simulate fetching stats from an API or blockchain
  setTimeout(() => {
    if (creatorCountElement) creatorCountElement.textContent = '4,328';
    if (contentCountElement) contentCountElement.textContent = '27,495';
    if (tokenVolumeElement) tokenVolumeElement.textContent = '$856,240';
    if (storageCountElement) storageCountElement.textContent = '348 TB';
  }, 1000);
}
