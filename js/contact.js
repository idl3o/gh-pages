/**
 * Contact Form Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formResponse = document.getElementById('form-response');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    /**
     * Handle contact form submission
     * @param {Event} event - Form submit event
     */
    async function handleFormSubmit(event) {
        // Prevent default form submission
        event.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const formValues = Object.fromEntries(formData.entries());
        
        // Show loading state
        showResponse('Sending message...', 'loading');
        
        try {
            // Since GitHub Pages is static hosting, we'd normally send this to an API
            // For demonstration, we'll simulate a successful submission
            await simulateFormSubmission(formValues);
            
            // Show success message
            showResponse('Message sent successfully! We\'ll get back to you soon.', 'success');
            
            // Reset form
            contactForm.reset();
        } catch (error) {
            // Show error message
            showResponse(`Error sending message: ${error.message}`, 'error');
        }
    }
    
    /**
     * Simulate form submission (since GitHub Pages doesn't support backend processing)
     * @param {Object} formData - Form data to submit
     * @returns {Promise} - Resolves when submission is complete
     */
    function simulateFormSubmission(formData) {
        return new Promise((resolve, reject) => {
            console.log('Form submission data:', formData);
            
            // Simulate network delay
            setTimeout(() => {
                // For demo purposes, we'll randomly succeed or fail
                const simulateError = Math.random() < 0.1; // 10% chance of error
                
                if (simulateError) {
                    reject(new Error('Network error, please try again later.'));
                } else {
                    resolve({ success: true });
                }
            }, 1500);
        });
    }
    
    /**
     * Show response message
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, loading)
     */
    function showResponse(message, type) {
        if (!formResponse) return;
        
        // Clear existing classes
        formResponse.className = 'form-response';
        
        // Add appropriate class
        formResponse.classList.add(type);
        
        // Set message
        formResponse.textContent = message;
        
        // Show element
        formResponse.classList.remove('hidden');
        
        // If it's a success or error message, hide after a delay
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                formResponse.classList.add('hidden');
            }, 8000);
        }
    }
    
    /**
     * Helper function to validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});
