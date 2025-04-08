/**
 * Utility for secure storage of sensitive data
 * In a production environment, consider using a dedicated encryption library
 */

// Simple encryption function (for demonstration purposes only)
// In production, use a proper encryption library with strong encryption
const encrypt = (data) => {
    try {
      // This is a very basic obfuscation, not actual encryption
      // Do not use this in production!
      const stringified = JSON.stringify(data);
      return btoa(stringified);
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  };
  
  // Simple decryption function (for demonstration purposes only)
  const decrypt = (encryptedData) => {
    try {
      // This is a very basic de-obfuscation, not actual decryption
      // Do not use this in production!
      const decoded = atob(encryptedData);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  };
  
  /**
   * Secure storage utility
   * Provides methods for securely storing and retrieving sensitive data
   */
  export const secureStorage = {
    /**
     * Stores data securely
     * @param {string} key - The key to store the data under
     * @param {any} value - The data to store
     */
    setItem: (key, value) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_${key}`;
        
        // Encrypt the data before storing
        const encryptedValue = encrypt(value);
        
        if (encryptedValue) {
          localStorage.setItem(prefixedKey, encryptedValue);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error storing data:', error);
        return false;
      }
    },
    
    /**
     * Retrieves securely stored data
     * @param {string} key - The key to retrieve data for
     * @returns {any|null} - The stored data or null if not found/error
     */
    getItem: (key) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_${key}`;
        
        // Get the encrypted data from storage
        const encryptedValue = localStorage.getItem(prefixedKey);
        
        if (!encryptedValue) {
          return null;
        }
        
        // Decrypt the data
        return decrypt(encryptedValue);
      } catch (error) {
        console.error('Error retrieving data:', error);
        return null;
      }
    },
    
    /**
     * Removes securely stored data
     * @param {string} key - The key to remove data for
     */
    removeItem: (key) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_${key}`;
        
        // Remove the data from storage
        localStorage.removeItem(prefixedKey);
        return true;
      } catch (error) {
        console.error('Error removing data:', error);
        return false;
      }
    },
    
    /**
     * Clears all securely stored data for this application
     */
    clear: () => {
      try {
        // Get all keys
        const keys = Object.keys(localStorage);
        
        // Remove all keys that start with our prefix
        keys.forEach(key => {
          if (key.startsWith('newsai_')) {
            localStorage.removeItem(key);
          }
        });
        
        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    }
  };
  
  /**
   * Cookie management utility
   * Provides methods for managing cookies with security features
   */
  export const cookieUtils = {
    /**
     * Sets a cookie with security options
     * @param {string} name - The cookie name
     * @param {string} value - The cookie value
     * @param {object} options - Cookie options
     */
    setCookie: (name, value, options = {}) => {
      try {
        // Default options for secure cookies
        const defaultOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
          sameSite: 'strict',
          maxAge: 86400 * 7 // 7 days
        };
        
        // Merge options
        const cookieOptions = { ...defaultOptions, ...options };
        
        // Build cookie string
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        // Add options to cookie string
        if (cookieOptions.path) {
          cookieString += `; path=${cookieOptions.path}`;
        }
        
        if (cookieOptions.maxAge) {
          cookieString += `; max-age=${cookieOptions.maxAge}`;
        }
        
        if (cookieOptions.domain) {
          cookieString += `; domain=${cookieOptions.domain}`;
        }
        
        if (cookieOptions.secure) {
          cookieString += '; secure';
        }
        
        if (cookieOptions.sameSite) {
          cookieString += `; samesite=${cookieOptions.sameSite}`;
        }
        
        // Set the cookie
        document.cookie = cookieString;
        return true;
      } catch (error) {
        console.error('Error setting cookie:', error);
        return false;
      }
    },
    
    /**
     * Gets a cookie by name
     * @param {string} name - The cookie name
     * @returns {string|null} - The cookie value or null if not found
     */
    getCookie: (name) => {
      try {
        const cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          
          // Check if this cookie is the one we're looking for
          if (cookie.startsWith(`${name}=`)) {
            return decodeURIComponent(cookie.substring(name.length + 1));
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
      }
    },
    
    /**
     * Removes a cookie by name
     * @param {string} name - The cookie name
     * @param {object} options - Cookie options
     */
    removeCookie: (name, options = {}) => {
      try {
        // Set max-age to -1 to delete the cookie
        cookieUtils.setCookie(name, '', {
          ...options,
          maxAge: -1
        });
        
        return true;
      } catch (error) {
        console.error('Error removing cookie:', error);
        return false;
      }
    }
  };
  
  /**
   * Session storage utility
   * Provides methods for storing temporary session data
   */
  export const sessionUtils = {
    /**
     * Stores data in session storage
     * @param {string} key - The key to store the data under
     * @param {any} value - The data to store
     */
    setItem: (key, value) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_session_${key}`;
        
        // Stringify complex data
        const stringifiedValue = JSON.stringify(value);
        
        sessionStorage.setItem(prefixedKey, stringifiedValue);
        return true;
      } catch (error) {
        console.error('Error storing session data:', error);
        return false;
      }
    },
    
    /**
     * Retrieves data from session storage
     * @param {string} key - The key to retrieve data for
     * @returns {any|null} - The stored data or null if not found/error
     */
    getItem: (key) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_session_${key}`;
        
        // Get the data from storage
        const value = sessionStorage.getItem(prefixedKey);
        
        if (!value) {
          return null;
        }
        
        // Parse complex data
        return JSON.parse(value);
      } catch (error) {
        console.error('Error retrieving session data:', error);
        return null;
      }
    },
    
    /**
     * Removes data from session storage
     * @param {string} key - The key to remove data for
     */
    removeItem: (key) => {
      try {
        // Prefix keys to avoid conflicts
        const prefixedKey = `newsai_session_${key}`;
        
        // Remove the data from storage
        sessionStorage.removeItem(prefixedKey);
        return true;
      } catch (error) {
        console.error('Error removing session data:', error);
        return false;
      }
    },
    
    /**
     * Clears all session storage data for this application
     */
    clear: () => {
      try {
        // Get all keys
        const keys = Object.keys(sessionStorage);
        
        // Remove all keys that start with our prefix
        keys.forEach(key => {
          if (key.startsWith('newsai_session_')) {
            sessionStorage.removeItem(key);
          }
        });
        
        return true;
      } catch (error) {
        console.error('Error clearing session storage:', error);
        return false;
      }
    }
  };