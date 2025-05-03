/**
 * Animation controller for Web3 Crypto Streaming Service
 */

document.addEventListener('DOMContentLoaded', function() {
  initScrollAnimations();
  initHoverAnimations();
  initNetworkVisualization();
  initTokenAnimations();
});

/**
 * Initialize scroll-based animations
 */
function initScrollAnimations() {
  // Only run if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) return;
  
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // If element is in viewport
      if (entry.isIntersecting) {
        // Get animation type from data attribute or default to fadeIn
        const animationType = entry.target.dataset.animation || 'fadeIn';
        // Add animation class
        entry.target.classList.add('animate', animationType);
        // Unobserve after animation added
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,  // Trigger when at least 10% of the element is visible
    rootMargin: '0px 0px -50px 0px'  // Trigger slightly before the element comes into view
  });
  
  // Observe all elements with the animate-on-scroll class
  animatedElements.forEach(element => {
    observer.observe(element);
  });
}

/**
 * Initialize hover-based animations
 */
function initHoverAnimations() {
  // Card hover effects
  document.querySelectorAll('.card-hover').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)';
    });
  });
  
  // Button click animation
  document.querySelectorAll('.animate-click').forEach(button => {
    button.addEventListener('click', function() {
      this.classList.add('button-click');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        this.classList.remove('button-click');
      }, 300);
    });
  });
  
  // Button glow effect on hover
  document.querySelectorAll('.glow-hover').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.classList.add('glow');
    });
    
    element.addEventListener('mouseleave', function() {
      this.classList.remove('glow');
    });
  });
}

/**
 * Initialize blockchain network visualization animations
 */
function initNetworkVisualization() {
  const networkVisualizations = document.querySelectorAll('.network-visualization');
  
  if (networkVisualizations.length === 0) return;
  
  networkVisualizations.forEach(network => {
    // Add node pulse animations with staggered delays
    const nodes = network.querySelectorAll('.node');
    nodes.forEach((node, index) => {
      node.classList.add('node-pulse');
      node.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Animate connection lines
    const connections = network.querySelectorAll('.node-connections');
    connections.forEach((connection, index) => {
      connection.classList.add('connect-line');
      connection.style.animationDelay = `${index * 0.3}s`;
    });
  });
}

/**
 * Initialize token/crypto animations
 */
function initTokenAnimations() {
  // Handle token rain animation if present on the page
  const tokenRainContainers = document.querySelectorAll('.token-rain-container');
  
  tokenRainContainers.forEach(container => {
    createTokenRain(container);
  });
  
  // Animate token icons
  const tokenIcons = document.querySelectorAll('.token-icon');
  tokenIcons.forEach(icon => {
    icon.classList.add('float');
    
    // Randomize animation duration slightly for more natural effect
    const duration = 2 + Math.random() * 1;
    icon.style.animationDuration = `${duration}s`;
  });
}

/**
 * Create a token rain animation effect
 */
function createTokenRain(container) {
  const containerWidth = container.offsetWidth;
  const tokenCount = Math.floor(containerWidth / 50); // One token per 50px of width
  
  const tokenSymbols = ['₿', 'Ξ', '◎', 'Ł', 'Ð', '₮', '₳'];
  const tokenColors = [
    'rgba(247, 147, 26, 0.7)', // Bitcoin orange
    'rgba(110, 69, 226, 0.7)',  // Ethereum purple
    'rgba(0, 216, 255, 0.7)',   // Platform blue
    'rgba(72, 187, 120, 0.7)',  // Green
    'rgba(255, 87, 34, 0.7)'    // Red
  ];
  
  for (let i = 0; i < tokenCount; i++) {
    createRainingToken(
      container,
      tokenSymbols[Math.floor(Math.random() * tokenSymbols.length)],
      tokenColors[Math.floor(Math.random() * tokenColors.length)]
    );
  }
}

/**
 * Create a single raining token element
 */
function createRainingToken(container, symbol, color) {
  const token = document.createElement('span');
  token.textContent = symbol;
  token.className = 'token-rain';
  token.style.left = `${Math.random() * 100}%`;
  token.style.color = color;
  token.style.fontSize = `${12 + Math.random() * 24}px`;
  token.style.animationDuration = `${5 + Math.random() * 10}s`;
  token.style.animationDelay = `${Math.random() * 5}s`;
  
  container.appendChild(token);
  
  // Remove and recreate token when animation ends
  token.addEventListener('animationend', () => {
    token.remove();
    createRainingToken(container, symbol, color);
  });
}

/**
 * Create a typing text animation
 * @param {string} element - The selector for the element to animate
 * @param {string[]} texts - Array of texts to cycle through
 * @param {number} speed - Typing speed in milliseconds
 */
function createTypingAnimation(element, texts, speed = 100) {
  const textElement = document.querySelector(element);
  
  if (!textElement) return;
  
  // Add the typing class for cursor animation
  textElement.classList.add('typing');
  
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingDelay = speed;
  
  function type() {
    const currentText = texts[textIndex];
    
    if (isDeleting) {
      // Delete characters
      textElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingDelay = speed / 2; // Delete faster than typing
    } else {
      // Type characters
      textElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingDelay = speed;
    }
    
    // If finished typing the current text
    if (!isDeleting && charIndex === currentText.length) {
      isDeleting = true;
      typingDelay = 1500; // Pause at the end of typing
    } 
    // If finished deleting the current text
    else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length; // Move to next text
      typingDelay = 500; // Pause before typing next text
    }
    
    setTimeout(type, typingDelay);
  }
  
  // Start the typing animation
  type();
}

/**
 * Animate the page transition when navigating
 */
function animatePageTransition() {
  const content = document.querySelector('.page-content');
  
  if (!content) return;
  
  // First fade out
  content.style.opacity = '0';
  content.style.transform = 'translateY(20px)';
  
  // Then fade in with animation
  setTimeout(() => {
    content.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
  }, 100);
}

/**
 * Create and animate blockchain cubes
 * @param {string} container - The selector for the container element
 * @param {number} count - Number of cubes to create
 */
function createBlockchainCubes(container, count = 5) {
  const cubeContainer = document.querySelector(container);
  
  if (!cubeContainer) return;
  
  for (let i = 0; i < count; i++) {
    const cube = document.createElement('div');
    cube.className = 'blockchain-cube';
    
    // Create cube faces
    for (let j = 0; j < 6; j++) {
      const face = document.createElement('div');
      face.className = 'cube-face';
      face.textContent = j === 0 ? '₿' : j === 1 ? 'Ξ' : '#';
      cube.appendChild(face);
    }
    
    // Randomize cube position and animation
    cube.style.left = `${Math.random() * 80 + 10}%`;
    cube.style.top = `${Math.random() * 80 + 10}%`;
    cube.style.animationDuration = `${10 + Math.random() * 10}s`;
    cube.style.animationDelay = `${Math.random() * 5}s`;
    
    cubeContainer.appendChild(cube);
  }
}

// Export functions for use in other scripts
window.animations = {
  createTypingAnimation,
  animatePageTransition,
  createBlockchainCubes,
  createTokenRain
};
