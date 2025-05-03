/**
 * Component Loader for Project RED X
 * Dynamically loads React components into HTML pages
 */

class ComponentLoader {
  /**
   * Initialize the component loader
   */
  constructor() {
    this.componentsLoaded = false;
    this.componentRegistry = {};
    this.mountPoints = [];
  }

  /**
   * Register a React component for later use
   * @param {string} name - Component name 
   * @param {object} component - React component
   */
  register(name, component) {
    this.componentRegistry[name] = component;
    return this;
  }

  /**
   * Load all required dependencies for React components
   * @returns {Promise} Promise that resolves when dependencies are loaded
   */
  async loadDependencies() {
    if (this.componentsLoaded) {
      return Promise.resolve();
    }

    // Check if React is already loaded
    if (window.React && window.ReactDOM) {
      this.componentsLoaded = true;
      return Promise.resolve();
    }

    // Load React and ReactDOM dynamically
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    try {
      // Load React and ReactDOM from CDN
      // In production, consider hosting these files yourself for better reliability
      await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
      await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
      await loadScript('https://unpkg.com/babel-standalone@7.21.2/babel.min.js');
      
      this.componentsLoaded = true;
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to load React dependencies:', err);
      return Promise.reject(err);
    }
  }

  /**
   * Mount a component into a DOM element
   * @param {string} componentName - Name of the registered component
   * @param {string|Element} target - DOM element or selector to mount into
   * @param {object} props - Props to pass to the component
   */
  async mount(componentName, target, props = {}) {
    // Ensure dependencies are loaded
    await this.loadDependencies();
    
    if (!this.componentRegistry[componentName]) {
      console.error(`Component "${componentName}" is not registered`);
      return;
    }
    
    // Find target element
    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!targetElement) {
      console.error(`Target element "${target}" not found`);
      return;
    }
    
    try {
      const Component = this.componentRegistry[componentName];
      const root = ReactDOM.createRoot(targetElement);
      root.render(React.createElement(Component, props));
      
      // Keep track of mount points for unmounting
      this.mountPoints.push({ 
        root, 
        element: targetElement, 
        componentName 
      });
      
      console.log(`Component "${componentName}" mounted successfully`);
    } catch (err) {
      console.error(`Error mounting component "${componentName}":`, err);
    }
  }
  
  /**
   * Unmount all components or a specific component
   * @param {string|Element} target - Optional target to unmount specific component
   */
  unmount(target = null) {
    if (target) {
      // Unmount specific component
      const targetElement = typeof target === 'string' 
        ? document.querySelector(target) 
        : target;
      
      const mountIndex = this.mountPoints.findIndex(mp => mp.element === targetElement);
      if (mountIndex > -1) {
        try {
          this.mountPoints[mountIndex].root.unmount();
          this.mountPoints.splice(mountIndex, 1);
        } catch (err) {
          console.error('Error unmounting component:', err);
        }
      }
    } else {
      // Unmount all components
      for (const mp of this.mountPoints) {
        try {
          mp.root.unmount();
        } catch (err) {
          console.error(`Error unmounting component "${mp.componentName}":`, err);
        }
      }
      this.mountPoints = [];
    }
  }
}

// Create a global instance of the component loader
window.componentLoader = new ComponentLoader();