/**
 * Link extractor module for Project RED X
 * Extracts links from .txt files and displays them in the application
 */

class LinkExtractor {
  /**
   * Constructs a new LinkExtractor
   * @param {string} containerId - ID of the container to display links in
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
    }
  }

  /**
   * Loads and parses links from a .txt file
   * @param {string} txtFilePath - Path to the txt file containing HTML links
   * @returns {Promise<void>}
   */
  async loadLinks(txtFilePath) {
    try {
      // Add a timestamp to prevent caching issues
      const cacheBuster = `?t=${Date.now()}`;
      const url = txtFilePath + cacheBuster;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain'
        },
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load ${txtFilePath}: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      this.parseAndDisplay(content);
    } catch (error) {
      console.error('Error loading links:', error);
      this.container.innerHTML = `<p class="error">Failed to load links: ${error.message}</p>`;
      
      // Fallback to local data for demo purposes
      console.log('Using fallback data');
      this.useFallbackData();
    }
  }
  
  /**
   * Use fallback data if remote file can't be loaded
   */
  useFallbackData() {
    const fallbackData = `# WUB - Web URLs and Bookmarks Collection (Fallback Data)

## Music Production Resources
<a href="https://www.musicradar.com/how-to/how-to-make-dubstep-wobble-bass">How to make dubstep wobble bass</a>
<a href="https://www.soundonsound.com/techniques/creating-dubstep">Creating Dubstep Tutorial</a>

## Project RED X Resources
<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>
<a href="https://emscripten.org/">Emscripten</a>
<a href="https://github.com/emscripten-core/emscripten/wiki/WebAssembly">Emscripten WebAssembly</a>`;

    this.parseAndDisplay(fallbackData);
  }

  /**
   * Parses text content and extracts HTML links
   * @param {string} content - Text content containing HTML links
   */
  parseAndDisplay(content) {
    // Clear current container
    this.container.innerHTML = '';
    
    // Regular expression to match HTML links
    const linkRegex = /<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;
    
    // Find section headers (lines starting with ##)
    const sections = content.split(/^## /m);
    
    // Skip the first element if it doesn't contain a section name
    const firstSection = sections.shift();
    if (firstSection && !firstSection.includes('#')) {
      // Create intro section if there's content before first ##
      this.createSection('Introduction', firstSection);
    }
    
    // Process each section
    sections.forEach(section => {
      const sectionLines = section.trim().split('\n');
      const sectionName = sectionLines.shift();
      const sectionContent = sectionLines.join('\n');
      
      this.createSection(sectionName, sectionContent);
    });
  }

  /**
   * Creates a section with links
   * @param {string} name - Section name
   * @param {string} content - Section content
   */
  createSection(name, content) {
    if (!content.trim()) return;
    
    // Create section container
    const section = document.createElement('div');
    section.className = 'link-section';
    
    // Create section header
    const header = document.createElement('h3');
    header.textContent = name;
    section.appendChild(header);
    
    // Extract links from content
    const linkRegex = /<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;
    let match;
    const linksList = document.createElement('ul');
    
    // Find all links in the content
    let hasLinks = false;
    while ((match = linkRegex.exec(content)) !== null) {
      hasLinks = true;
      const url = match[1];
      const text = match[2];
      
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = text;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      listItem.appendChild(link);
      linksList.appendChild(listItem);
    }
    
    if (hasLinks) {
      section.appendChild(linksList);
    } else {
      // Add non-link content as paragraph
      const para = document.createElement('p');
      para.textContent = content.trim();
      section.appendChild(para);
    }
    
    this.container.appendChild(section);
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkExtractor;
}
