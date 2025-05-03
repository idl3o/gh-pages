/**
 * Flymode functionality for Web3 Crypto Streaming Service
 */

document.addEventListener('DOMContentLoaded', function() {
  initFlymode();
});

function initFlymode() {
  // Create zeppelin element
  const zeppelin = document.createElement('div');
  zeppelin.className = 'zeppelin';
  
  // Create zeppelin body
  const zeppelinBody = document.createElement('div');
  zeppelinBody.className = 'zeppelin-body';
  
  // Create zeppelin cabin
  const zeppelinCabin = document.createElement('div');
  zeppelinCabin.className = 'zeppelin-cabin';
  
  // Create zeppelin fin
  const zeppelinFin = document.createElement('div');
  zeppelinFin.className = 'zeppelin-fin';
  
  // Create message bubble
  const zeppelinMessage = document.createElement('div');
  zeppelinMessage.className = 'zeppelin-message';
  zeppelinMessage.textContent = 'Welcome to Flymode!';
  
  // Assemble zeppelin
  zeppelinBody.appendChild(zeppelinFin);
  zeppelin.appendChild(zeppelinBody);
  zeppelin.appendChild(zeppelinCabin);
  zeppelin.appendChild(zeppelinMessage);
  
  // Add to body
  document.body.appendChild(zeppelin);
  
  // Save scroll position
  let scrollPosition = 0;
  
  // Handle flymode toggle
  const flymodeToggle = document.querySelector('.flymode-toggle');
  if (flymodeToggle) {
    flymodeToggle.addEventListener('click', () => {
      const isActivating = !document.body.classList.contains('flymode-active');
      
      if (isActivating) {
        // Save current scroll position before activating flymode
        scrollPosition = window.pageYOffset;
        
        // Update message with random content when flymode is toggled
        const messages = [
          'Web3 streaming in the clouds!',
          'Decentralized content delivery!',
          'Flying above censorship!',
          'Explore the blockchain skies!',
          'STREAM tokens powering your flight!'
        ];
        zeppelinMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // Reset animation
        zeppelin.style.animation = 'none';
        setTimeout(() => {
          zeppelin.style.animation = 'fly-zeppelin 30s linear infinite';
        }, 10);
        
        // Apply flymode class to body
        document.body.classList.add('flymode-active');
        
        // Create flymode interface if needed
        createFlymodeInterface();
      } else {
        // Remove flymode class from body
        document.body.classList.remove('flymode-active');
        
        // Restore scroll position
        window.scrollTo(0, scrollPosition);
        
        // Remove flymode interface if exists
        const flymodeInterface = document.querySelector('.flymode-interface');
        if (flymodeInterface) {
          flymodeInterface.classList.add('flymode-exit');
          setTimeout(() => {
            if (flymodeInterface.parentNode) {
              flymodeInterface.parentNode.removeChild(flymodeInterface);
            }
          }, 500);
        }
      }
    });
  }
  
  // Handle resize
  window.addEventListener('resize', adjustZeppelinPath);
  adjustZeppelinPath();
}

function createFlymodeInterface() {
  // Check if the interface already exists
  if (document.querySelector('.flymode-interface')) return;
  
  // Create the flymode interface
  const interface = document.createElement('div');
  interface.className = 'flymode-interface';
  interface.innerHTML = `
    <div class="flymode-header">
      <h3>Web3 Flymode</h3>
    </div>
    <div class="flymode-content">
      <p>You're now in flymode! The page is unscrollable while you explore.</p>
    </div>
  `;
  
  document.body.appendChild(interface);
  
  // Animate the interface in
  setTimeout(() => {
    interface.classList.add('flymode-enter');
  }, 10);
}

function adjustZeppelinPath() {
  const zeppelin = document.querySelector('.zeppelin');
  if (zeppelin) {
    // Adjust animation based on viewport
    const viewportHeight = window.innerHeight;
    const randomTop = Math.floor(Math.random() * (viewportHeight / 2)) + 50;
    zeppelin.style.top = `${randomTop}px`;
  }
}
