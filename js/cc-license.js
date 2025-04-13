/**
 * CC License Component
 * A reusable component for displaying and managing Creative Commons licenses
 */

class CCLicense {
  /**
   * Initialize the CC License component
   * @param {Object} options Component options
   */
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api';
    this.containerSelector = options.containerSelector || '.cc-license-container';
    this.onLicenseChange = options.onLicenseChange || null;
    this.currentLicense = options.initialLicense || null;
    this.contentId = options.contentId || null;
    this.readOnly = options.readOnly || false;
    
    this.licenses = null;
    
    this.init();
  }
  
  /**
   * Initialize the component
   */
  async init() {
    try {
      // Load license options
      await this.loadLicenseOptions();
      
      // Initialize DOM elements
      this.initElements();
      
      if (this.currentLicense) {
        this.renderLicense(this.currentLicense);
      }
    } catch (error) {
      console.error('Error initializing CC License component:', error);
    }
  }
  
  /**
   * Load available license options
   */
  async loadLicenseOptions() {
    try {
      const response = await fetch(`${this.apiEndpoint}/licenses`);
      if (!response.ok) throw new Error('Failed to fetch license options');
      
      this.licenses = await response.json();
      return this.licenses;
    } catch (error) {
      console.error('Error loading license options:', error);
      // Fallback to common licenses if API fails
      this.licenses = {
        'cc-by': { name: 'CC BY 4.0', description: 'Attribution' },
        'cc-by-sa': { name: 'CC BY-SA 4.0', description: 'Attribution-ShareAlike' },
        'cc-by-nc': { name: 'CC BY-NC 4.0', description: 'Attribution-NonCommercial' },
        'cc0': { name: 'CC0 1.0', description: 'Public Domain Dedication' }
      };
      return this.licenses;
    }
  }
  
  /**
   * Initialize DOM elements
   */
  initElements() {
    const containers = document.querySelectorAll(this.containerSelector);
    
    containers.forEach(container => {
      // Clear existing content
      container.innerHTML = '';
      
      if (this.readOnly) {
        container.classList.add('read-only');
        this.renderReadOnlyView(container);
      } else {
        this.renderEditorView(container);
      }
    });
  }
  
  /**
   * Render license editor view
   * @param {HTMLElement} container Container element
   */
  renderEditorView(container) {
    // Create license selector
    const selectorEl = document.createElement('select');
    selectorEl.className = 'cc-license-selector';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a license...';
    selectorEl.appendChild(defaultOption);
    
    // Add license options
    Object.entries(this.licenses).forEach(([key, license]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${license.name} - ${license.description}`;
      
      if (this.currentLicense && this.currentLicense.type === key) {
        option.selected = true;
      }
      
      selectorEl.appendChild(option);
    });
    
    // License change handler
    selectorEl.addEventListener('change', async () => {
      const selectedLicense = selectorEl.value;
      
      if (selectedLicense) {
        await this.applyLicense(selectedLicense);
      } else {
        this.currentLicense = null;
        if (this.onLicenseChange) {
          this.onLicenseChange(null);
        }
      }
      
      this.updateLicenseDisplay(container);
    });
    
    // Create license display area
    const displayEl = document.createElement('div');
    displayEl.className = 'cc-license-display';
    
    // Create attribution fields if a license is selected
    if (this.currentLicense) {
      this.renderAttributionFields(displayEl);
    }
    
    // Append elements to container
    container.appendChild(selectorEl);
    container.appendChild(displayEl);
  }
  
  /**
   * Render read-only license view
   * @param {HTMLElement} container Container element
   */
  renderReadOnlyView(container) {
    if (!this.currentLicense) {
      container.innerHTML = '<p class="no-license">No license information available</p>';
      return;
    }
    
    const license = this.licenses[this.currentLicense.type] || {
      name: this.currentLicense.name,
      description: '',
      url: this.currentLicense.url
    };
    
    const licenseEl = document.createElement('div');
    licenseEl.className = 'cc-license-badge';
    
    licenseEl.innerHTML = `
      <a href="${this.currentLicense.url || license.url}" target="_blank" rel="license">
        <img src="/images/licenses/${license.icon || `${this.currentLicense.type}.svg`}" 
             alt="${license.name}" class="cc-license-icon" />
        <span class="cc-license-name">${license.name}</span>
      </a>
      <p class="cc-attribution">
        This work is licensed under a <a href="${this.currentLicense.url || license.url}" target="_blank" rel="license">
        ${license.name}</a> license.
      </p>
    `;
    
    // Add attribution if available
    if (this.currentLicense.attributionName) {
      const attributionEl = document.createElement('p');
      attributionEl.className = 'cc-attribution-info';
      
      if (this.currentLicense.attributionUrl) {
        attributionEl.innerHTML = `By: <a href="${this.currentLicense.attributionUrl}" target="_blank">${this.currentLicense.attributionName}</a>`;
      } else {
        attributionEl.textContent = `By: ${this.currentLicense.attributionName}`;
      }
      
      licenseEl.appendChild(attributionEl);
    }
    
    container.appendChild(licenseEl);
  }
  
  /**
   * Render attribution fields
   * @param {HTMLElement} container Container element
   */
  renderAttributionFields(container) {
    const attributionEl = document.createElement('div');
    attributionEl.className = 'cc-attribution-fields';
    
    // Attribution name field
    const nameField = document.createElement('div');
    nameField.className = 'field';
    nameField.innerHTML = `
      <label for="cc-attribution-name">Attribution name:</label>
      <input type="text" id="cc-attribution-name" value="${this.currentLicense.attributionName || ''}">
    `;
    
    // Attribution URL field
    const urlField = document.createElement('div');
    urlField.className = 'field';
    urlField.innerHTML = `
      <label for="cc-attribution-url">Attribution URL (optional):</label>
      <input type="text" id="cc-attribution-url" value="${this.currentLicense.attributionUrl || ''}">
    `;
    
    // Additional terms field
    const termsField = document.createElement('div');
    termsField.className = 'field';
    termsField.innerHTML = `
      <label for="cc-additional-terms">Additional terms (optional):</label>
      <textarea id="cc-additional-terms">${this.currentLicense.additionalTerms || ''}</textarea>
    `;
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'cc-save-attribution';
    saveBtn.textContent = 'Save Attribution';
    
    saveBtn.addEventListener('click', async () => {
      const attributionName = document.getElementById('cc-attribution-name').value;
      const attributionUrl = document.getElementById('cc-attribution-url').value;
      const additionalTerms = document.getElementById('cc-additional-terms').value;
      
      await this.updateAttribution({
        name: attributionName,
        url: attributionUrl,
        terms: additionalTerms
      });
    });
    
    // Add fields to container
    attributionEl.appendChild(nameField);
    attributionEl.appendChild(urlField);
    attributionEl.appendChild(termsField);
    attributionEl.appendChild(saveBtn);
    
    container.appendChild(attributionEl);
  }
  
  /**
   * Update license display
   * @param {HTMLElement} container Container element
   */
  updateLicenseDisplay(container) {
    const displayEl = container.querySelector('.cc-license-display');
    if (!displayEl) return;
    
    displayEl.innerHTML = '';
    
    if (this.currentLicense) {
      const license = this.licenses[this.currentLicense.type];
      
      const licenseInfoEl = document.createElement('div');
      licenseInfoEl.className = 'cc-license-info';
      licenseInfoEl.innerHTML = `
        <div class="cc-license-badge">
          <img src="/images/licenses/${license.icon}" alt="${license.name}" class="cc-license-icon">
          <span class="cc-license-title">${license.name}</span>
        </div>
        <p class="cc-license-description">${license.description}</p>
        <a href="${license.url}" target="_blank" class="cc-license-link">Learn more</a>
      `;
      
      displayEl.appendChild(licenseInfoEl);
      
      // Add attribution fields
      this.renderAttributionFields(displayEl);
    }
  }
  
  /**
   * Apply a license to the content
   * @param {string} licenseType License type
   */
  async applyLicense(licenseType) {
    if (!this.contentId) {
      console.error('No content ID provided for license application');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiEndpoint}/content/${this.contentId}/license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseType
        })
      });
      
      if (!response.ok) throw new Error('Failed to apply license');
      
      const result = await response.json();
      this.currentLicense = result.license;
      
      if (this.onLicenseChange) {
        this.onLicenseChange(this.currentLicense);
      }
      
      return result;
    } catch (error) {
      console.error('Error applying license:', error);
      
      // Fallback for demo/development
      this.currentLicense = {
        type: licenseType,
        name: this.licenses[licenseType].name,
        url: this.licenses[licenseType].url,
        appliedAt: new Date().toISOString(),
        attributionName: 'Default Attribution'
      };
      
      if (this.onLicenseChange) {
        this.onLicenseChange(this.currentLicense);
      }
    }
  }
  
  /**
   * Update license attribution
   * @param {Object} attribution Attribution information
   */
  async updateAttribution(attribution) {
    if (!this.contentId || !this.currentLicense) {
      console.error('No content ID or license provided for attribution update');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiEndpoint}/content/${this.contentId}/attribution`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attribution)
      });
      
      if (!response.ok) throw new Error('Failed to update attribution');
      
      const result = await response.json();
      this.currentLicense = result.license;
      
      if (this.onLicenseChange) {
        this.onLicenseChange(this.currentLicense);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating attribution:', error);
      
      // Fallback for demo/development
      this.currentLicense = {
        ...this.currentLicense,
        attributionName: attribution.name,
        attributionUrl: attribution.url,
        additionalTerms: attribution.terms,
        updatedAt: new Date().toISOString()
      };
      
      if (this.onLicenseChange) {
        this.onLicenseChange(this.currentLicense);
      }
    }
  }
  
  /**
   * Render license info
   * @param {Object} license License object
   */
  renderLicense(license) {
    this.currentLicense = license;
    this.initElements();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CCLicense;
} else {
  window.CCLicense = CCLicense;
}
