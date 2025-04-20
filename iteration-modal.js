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
      timerId: null
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
      if (this.iterationCountElement) {
        this.iterationCountElement.textContent = this.state.iterationCount;
      }

      // Setup event listeners
      this.setupEventListeners();

      // Check if we should show the modal on page load
      this.checkAndShowModal();

      // Set interval to check periodically
      setInterval(() => this.checkAndShowModal(), 60000); // Check every minute
    },

    setupEventListeners() {
      // Continue button
      if (this.continueBtn) {
        this.continueBtn.addEventListener('click', () => {
          this.handleContinue();
        });
      }

      // Skip button
      if (this.skipBtn) {
        this.skipBtn.addEventListener('click', () => {
          this.hideModal();

          // Set a longer interval before showing again
          this.state.lastShown = new Date().getTime() + this.config.showInterval * 2 * 60000;
          this.saveState();
        });
      }

      // Feedback button
      if (this.feedbackBtn) {
        this.feedbackBtn.addEventListener('click', () => {
          this.hideModal();

          // Open feedback form or redirect to GitHub issues
          window.open(
            'https://github.com/yourusername/gh-pages/issues/new?template=feedback.md',
            '_blank'
          );

          // Reset iteration count after feedback
          this.state.iterationCount = 0;
          this.saveState();
        });
      }

      // Close when clicking outside the modal
      window.addEventListener('click', event => {
        if (event.target === this.modal) {
          this.hideModal();
        }
      });
    },

    loadState() {
      const savedState = localStorage.getItem('iterationModalState');

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          this.state = { ...this.state, ...parsedState };
        } catch (e) {
          console.error('Error parsing saved state:', e);
        }
      }
    },

    saveState() {
      localStorage.setItem('iterationModalState', JSON.stringify(this.state));
    },

    checkAndShowModal() {
      const now = new Date().getTime();
      const shouldShowBasedOnTime =
        !this.state.lastShown || now - this.state.lastShown > this.config.showInterval * 60000;

      // Only show if enough time has passed and user has scrolled down at least 60%
      if (shouldShowBasedOnTime && this.hasScrolledEnough()) {
        this.showModal();
      }
    },

    hasScrolledEnough() {
      const scrollPosition = window.scrollY;
      const totalHeight = document.body.scrollHeight - window.innerHeight;

      return scrollPosition / totalHeight > 0.6;
    },

    showModal() {
      if (!this.modal) return;

      // Update modal content based on iteration count
      this.updateModalContent();

      // Display the modal
      this.modal.style.display = 'flex';

      // Add animation class
      setTimeout(() => {
        this.modalContent.classList.add('bounce-in');
      }, 10);

      // Start countdown
      this.startCountdown();

      // Update state
      this.state.lastShown = new Date().getTime();
      this.saveState();
    },

    hideModal() {
      if (!this.modal) return;

      // Add fade-out animation
      this.modalContent.classList.remove('bounce-in');
      this.modalContent.classList.add('fade-out');

      // Wait for animation to complete
      setTimeout(() => {
        this.modal.style.display = 'none';
        this.modalContent.classList.remove('fade-out');

        // Stop countdown if it's running
        this.stopCountdown();
      }, 300);
    },

    updateModalContent() {
      // If user has iterated multiple times, suggest providing feedback
      const title = document.querySelector('#iteration-modal h2');
      const description = document.querySelector('#iteration-modal p');

      if (this.state.iterationCount >= this.config.maxIterationsBeforeFeedback) {
        if (title) title.textContent = 'How about some feedback?';
        if (description) {
          description.textContent = `You've been iterating for a while. Would you like to share your ideas for improvements?`;
        }

        // Make the feedback button more prominent
        if (this.feedbackBtn) {
          this.feedbackBtn.style.backgroundColor = 'var(--accent-color)';
          this.feedbackBtn.style.color = 'white';
        }
      } else {
        if (title) title.textContent = 'Continue to Iterate?';
        if (description) {
          description.textContent = `Would you like to continue working on this project? We'll auto-continue in ${this.config.autoCloseTime} seconds.`;
        }
      }

      // Update iteration count display
      if (this.iterationCountElement) {
        this.iterationCountElement.textContent = this.state.iterationCount;
      }
    },

    startCountdown() {
      // Stop any existing countdown
      this.stopCountdown();

      // Set initial time
      this.state.timeRemaining = this.config.autoCloseTime;

      // Update progress bar width
      if (this.progressBar) {
        this.progressBar.style.width = '100%';
      }

      // Start timer
      this.state.timerId = setInterval(() => {
        this.state.timeRemaining--;

        // Update progress bar
        if (this.progressBar) {
          const percentage = (this.state.timeRemaining / this.config.autoCloseTime) * 100;
          this.progressBar.style.width = `${percentage}%`;
        }

        // Auto-close when time reaches 0
        if (this.state.timeRemaining <= 0) {
          this.handleContinue();
        }
      }, 1000);
    },

    stopCountdown() {
      if (this.state.timerId) {
        clearInterval(this.state.timerId);
        this.state.timerId = null;
      }
    },

    handleContinue() {
      this.hideModal();
      this.state.iterationCount++;
      this.saveState();

      // Execute any continuation logic here
      // For example, scroll to the next section or update UI state
    }
  };

  // Initialize the iteration modal
  iterationModal.init();
});
