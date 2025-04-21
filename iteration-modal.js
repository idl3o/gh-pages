/**
 * Enhanced Iteration Modal
 * Provides improved functionality for the "Continue to Iterate?" feature
 */
document.addEventListener('DOMContentLoaded', () => {
  const iterationModal = {
    modal: document.getElementById('iteration-modal'),
    modalContent: document.querySelector('#iteration-modal .modal-content'),
    continueBtn: document.getElementById('continue-iteration'),
    skipBtn: document.getElementById('skip-iteration'),
    feedbackBtn: document.getElementById('provide-feedback'),
    progressBar: document.querySelector('.modal-progress-bar'),
    iterationCountElement: document.getElementById('iteration-count'),

    config: {
      // How often to show the modal (in minutes)
      showInterval: 20,
      // Auto close timeout (in seconds)
      autoCloseTime: 15,
      // Maximum number of iterations before suggesting feedback
      maxIterationsBeforeFeedback: 5
    },

    state: {
      lastShown: null,
      iterationCount: 0,
      timeRemaining: 0,
      timerId: null,
      progressTimerId: null
    },

    init() {
      // Load saved state from localStorage
      this.loadState();

      // Increment iteration count if this is a new session
      const lastSession = localStorage.getItem('lastSessionDate');
      const today = new Date().toDateString();

      if (lastSession !== today) {
        this.state.iterationCount++;
        localStorage.setItem('lastSessionDate', today);
        this.saveState();
      }

      // Update iteration count display
      this.updateIterationCount();

      // Set up event listeners
      this.setupEventListeners();

      // Check if we should show the modal based on time elapsed
      this.checkAndShowModal();

      // Set interval to periodically check if we should show the modal
      setInterval(() => this.checkAndShowModal(), 60000); // Check every minute
    },

    loadState() {
      const savedState = localStorage.getItem('iterationModalState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          this.state = { ...this.state, ...parsed };
        } catch (e) {
          console.error('Error parsing saved state:', e);
        }
      }
    },

    saveState() {
      localStorage.setItem('iterationModalState', JSON.stringify(this.state));
    },

    updateIterationCount() {
      if (this.iterationCountElement) {
        this.iterationCountElement.textContent = this.state.iterationCount;
      }
    },

    setupEventListeners() {
      // Continue button
      if (this.continueBtn) {
        this.continueBtn.addEventListener('click', () => {
          this.state.iterationCount++;
          this.updateIterationCount();
          this.hideModal();
          this.saveState();

          // Broadcast a custom event that other parts of the app can listen for
          window.dispatchEvent(
            new CustomEvent('iterationContinued', {
              detail: { iterationCount: this.state.iterationCount }
            })
          );
        });
      }

      // Skip button
      if (this.skipBtn) {
        this.skipBtn.addEventListener('click', () => {
          this.hideModal();
        });
      }

      // Feedback button
      if (this.feedbackBtn) {
        this.feedbackBtn.addEventListener('click', () => {
          this.hideModal();
          // Open feedback form or redirect to feedback page
          window.open('https://feedback.example.com', '_blank');
        });
      }
    },

    checkAndShowModal() {
      const now = Date.now();
      const minutesSinceLastShown = this.state.lastShown
        ? (now - this.state.lastShown) / (1000 * 60)
        : this.config.showInterval + 1; // Ensure we show on first load if no record

      if (minutesSinceLastShown >= this.config.showInterval) {
        this.showModal();
      }
    },

    showModal() {
      if (!this.modal) return;

      // Show feedback button if we've reached the threshold
      if (this.feedbackBtn) {
        if (this.state.iterationCount >= this.config.maxIterationsBeforeFeedback) {
          this.feedbackBtn.style.display = 'inline-block';
        } else {
          this.feedbackBtn.style.display = 'none';
        }
      }

      // Update the modal UI
      this.modal.style.display = 'block';
      this.state.lastShown = Date.now();
      this.saveState();

      // Start the auto-close countdown
      this.startCountdown();

      // Add animation class
      setTimeout(() => {
        if (this.modalContent) {
          this.modalContent.classList.add('show');
        }
      }, 10);
    },

    hideModal() {
      if (!this.modal || !this.modalContent) return;

      // Remove animation class
      this.modalContent.classList.remove('show');

      // Stop the countdown
      this.stopCountdown();

      // Hide after animation completes
      setTimeout(() => {
        this.modal.style.display = 'none';
      }, 300);
    },

    startCountdown() {
      // Clear any existing timers
      this.stopCountdown();

      // Set initial time
      this.state.timeRemaining = this.config.autoCloseTime;

      // Update progress bar width
      if (this.progressBar) {
        this.progressBar.style.width = '100%';
      }

      // Start the countdown timer
      this.state.timerId = setTimeout(() => {
        this.hideModal();
      }, this.config.autoCloseTime * 1000);

      // Start progress bar animation
      const updateProgress = () => {
        if (this.state.timeRemaining <= 0) return;

        this.state.timeRemaining--;
        const percentage = (this.state.timeRemaining / this.config.autoCloseTime) * 100;

        if (this.progressBar) {
          this.progressBar.style.width = `${percentage}%`;
        }
      };

      // Update progress bar every second
      this.state.progressTimerId = setInterval(updateProgress, 1000);
    },

    stopCountdown() {
      // Clear timers if they exist
      if (this.state.timerId) {
        clearTimeout(this.state.timerId);
        this.state.timerId = null;
      }

      if (this.state.progressTimerId) {
        clearInterval(this.state.progressTimerId);
        this.state.progressTimerId = null;
      }
    }
  };

  // Initialize the modal
  if (document.getElementById('iteration-modal')) {
    iterationModal.init();
  } else {
    // Create the modal if it doesn't exist in the DOM
    createIterationModal();
    // Try to initialize again after creating the modal
    setTimeout(() => iterationModal.init(), 100);
  }

  // Function to create the modal HTML if it doesn't exist
  function createIterationModal() {
    const modalHTML = `
      <div id="iteration-modal" class="modal">
        <div class="modal-content">
          <h2>Continue to iterate?</h2>
          <p>Your current session has been active for a while. Would you like to continue?</p>
          <p class="small">Iteration count: <span id="iteration-count">0</span></p>
          <div class="modal-actions">
            <button id="continue-iteration" class="btn btn-primary">Continue</button>
            <button id="skip-iteration" class="btn btn-secondary">Skip</button>
            <button id="provide-feedback" class="btn btn-outline">Provide Feedback</button>
          </div>
          <div class="modal-progress-container">
            <div class="modal-progress-bar"></div>
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    const modalStyles = `
      <style>
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          overflow: auto;
        }

        .modal-content {
          background-color: #fefefe;
          margin: 15% auto;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          max-width: 500px;
          transform: translateY(-20px);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .modal-content.show {
          transform: translateY(0);
          opacity: 1;
        }

        .modal h2 {
          margin-top: 0;
          color: #333;
        }

        .modal-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #4CAF50;
          color: white;
        }

        .btn-primary:hover {
          background-color: #45a049;
        }

        .btn-secondary {
          background-color: #f1f1f1;
          color: #333;
        }

        .btn-secondary:hover {
          background-color: #e1e1e1;
        }

        .btn-outline {
          background-color: transparent;
          border: 1px solid #999;
          color: #666;
          display: none;
        }

        .btn-outline:hover {
          background-color: #f9f9f9;
        }

        .small {
          font-size: 0.8em;
          color: #666;
        }

        .modal-progress-container {
          height: 4px;
          background-color: #f1f1f1;
          width: 100%;
          margin-top: 20px;
          border-radius: 2px;
          overflow: hidden;
        }

        .modal-progress-bar {
          height: 100%;
          background-color: #4CAF50;
          width: 100%;
          transition: width 1s linear;
        }
      </style>
    `;

    // Create a container for the modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML + modalStyles;

    // Append to body
    document.body.appendChild(modalContainer);
  }

  // Expose the modal to the global scope for debugging or external control
  window.iterationModal = iterationModal;
});
