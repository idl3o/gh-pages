/**
 * Storage utility functions for Web3 Crypto Streaming Platform
 * Provides a consistent interface for local storage with fallbacks
 */

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Memory fallback when localStorage isn't available
const memoryStorage = new Map();

/**
 * Get an item from storage
 * @param {string} key - Storage key
 * @returns {string|null} - Stored value or null if not found
 */
export const getItem = (key) => {
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(key);
  } else {
    return memoryStorage.get(key) || null;
  }
};

/**
 * Set an item in storage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
export const setItem = (key, value) => {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(key, value);
  } else {
    memoryStorage.set(key, value);
  }
};

/**
 * Remove an item from storage
 * @param {string} key - Storage key to remove
 */
export const removeItem = (key) => {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(key);
  } else {
    memoryStorage.delete(key);
  }
};

/**
 * Clear all items from storage
 */
export const clear = () => {
  if (isLocalStorageAvailable()) {
    localStorage.clear();
  } else {
    memoryStorage.clear();
  }
};

/**
 * Get all storage keys
 * @returns {string[]} - Array of storage keys
 */
export const getAllKeys = () => {
  if (isLocalStorageAvailable()) {
    return Object.keys(localStorage);
  } else {
    return Array.from(memoryStorage.keys());
  }
};

/**
 * Store object as JSON
 * @param {string} key - Storage key
 * @param {object} value - Object to store
 */
export const setObject = (key, value) => {
  setItem(key, JSON.stringify(value));
};

/**
 * Get stored JSON object
 * @param {string} key - Storage key
 * @param {object} defaultValue - Default value if key not found
 * @returns {object} - Parsed object or default value
 */
export const getObject = (key, defaultValue = null) => {
  const value = getItem(key);
  if (!value) return defaultValue;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(`Error parsing stored JSON for key ${key}:`, e);
    return defaultValue;
  }
};
