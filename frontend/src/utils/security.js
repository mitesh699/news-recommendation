/**
 * Security utilities for frontend protection
 * This module provides utilities to enhance security on the frontend
 */

// XSS protection utilities
export const xssSecurity = {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * This function should be used when displaying user-generated HTML content
     * 
     * @param {string} html - The HTML content to sanitize
     * @returns {string} - Sanitized HTML content
     */
    sanitizeHTML: (html) => {
      if (!html) return '';
      
      // Create a temporary DOM element
      const tempElement = document.createElement('div');
      tempElement.textContent = html;
      
      // Return sanitized HTML
      return tempElement.innerHTML;
    },
    
    /**
     * Sanitize URL to prevent javascript: and data: URLs
     * 
     * @param {string} url - The URL to sanitize
     * @returns {string|null} - Sanitized URL or null if unsafe
     */
    sanitizeURL: (url) => {
      if (!url) return null;
      
      // Convert to lowercase for easier checking
      const lowerUrl = url.toLowerCase().trim();
      
      // Check for dangerous protocols
      if (lowerUrl.startsWith('javascript:') || 
          lowerUrl.startsWith('data:') ||
          lowerUrl.startsWith('vbscript:')) {
        return null;
      }
      
      return url;
    },
    
    /**
     * Sanitize user input to prevent injection attacks
     * 
     * @param {string} input - User input to sanitize
     * @returns {string} - Sanitized input
     */
    sanitizeInput: (input) => {
      if (!input) return '';
      
      // Remove potentially dangerous HTML
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
  };
  
  // CSRF protection utilities
  export const csrfSecurity = {
    /**
     * Get CSRF token from meta tag
     * 
     * @returns {string|null} - CSRF token or null if not found
     */
    getCSRFToken: () => {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      return metaTag ? metaTag.getAttribute('content') : null;
    },
    
    /**
     * Set CSRF token in meta tag
     * 
     * @param {string} token - CSRF token
     */
    setCSRFToken: (token) => {
      if (!token) return;
      
      let metaTag = document.querySelector('meta[name="csrf-token"]');
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'csrf-token');
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', token);
    },
    
    /**
     * Initialize CSRF protection by fetching a token from the server
     * 
     * @param {Object} api - API client
     * @returns {Promise<string>} - CSRF token
     */
    initCSRFProtection: async (api) => {
      try {
        // Fetch CSRF token from server
        const response = await api.get('/auth/csrf-token');
        const token = response.token;
        
        if (token) {
          csrfSecurity.setCSRFToken(token);
        }
        
        return token;
      } catch (error) {
        console.error('Failed to initialize CSRF protection:', error);
        return null;
      }
    }
  };
  
  // Content Security Policy utilities
  export const cspSecurity = {
    /**
     * Initialize Content Security Policy
     * This function sets up a CSP meta tag
     */
    initCSP: () => {
      // Check if CSP is already set
      if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        return;
      }
      
      // Create meta tag for CSP
      const cspMetaTag = document.createElement('meta');
      cspMetaTag.httpEquiv = 'Content-Security-Policy';
      
      // Set CSP directives
      cspMetaTag.content = [
        // Restrict script sources
        "script-src 'self' https://cdnjs.cloudflare.com",
        
        // Restrict style sources
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
        
        // Restrict font sources
        "font-src 'self' https://fonts.gstatic.com",
        
        // Restrict image sources
        "img-src 'self' data: https://trusted-cdn.com",
        
        // Restrict connect sources
        "connect-src 'self' https://api.example.com",
        
        // Restrict frame sources
        "frame-src 'none'",
        
        // Restrict object sources
        "object-src 'none'",
        
        // Default sources
        "default-src 'self'"
      ].join('; ');
      
      // Add meta tag to head
      document.head.appendChild(cspMetaTag);
    }
  };
  
  // Input validation utilities
  export const validationUtils = {
    /**
     * Validate email format
     * 
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidEmail: (email) => {
      if (!email) return false;
      
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    /**
     * Validate password strength
     * 
     * @param {string} password - Password to validate
     * @returns {Object} - Validation result with isValid and reasons
     */
    validatePassword: (password) => {
      if (!password) {
        return {
          isValid: false,
          reasons: ['Password is required']
        };
      }
      
      const reasons = [];
      
      // Check length
      if (password.length < 8) {
        reasons.push('Password must be at least 8 characters long');
      }
      
      // Check for uppercase letter
      if (!/[A-Z]/.test(password)) {
        reasons.push('Password must contain at least one uppercase letter');
      }
      
      // Check for lowercase letter
      if (!/[a-z]/.test(password)) {
        reasons.push('Password must contain at least one lowercase letter');
      }
      
      // Check for number
      if (!/\d/.test(password)) {
        reasons.push('Password must contain at least one number');
      }
      
      // Check for special character
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        reasons.push('Password must contain at least one special character');
      }
      
      return {
        isValid: reasons.length === 0,
        reasons
      };
    },
    
    /**
     * Validate URL format
     * 
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidURL: (url) => {
      if (!url) return false;
      
      try {
        new URL(url);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
  
  // Security monitoring utilities
  export const securityMonitoring = {
    /**
     * Initialize security monitoring
     * This function sets up event listeners to detect potential security issues
     */
    init: () => {
      // Monitor for XSS attempts
      window.addEventListener('error', (event) => {
        // Check for suspicious errors
        if (event.message && (
          event.message.includes('script') ||
          event.message.includes('XSS') ||
          event.message.includes('injection')
        )) {
          console.error('Potential security issue detected:', event);
          // In a real app, you might want to report this to your security team
        }
      });
      
      // Monitor suspicious URL parameters
      const queryParams = new URLSearchParams(window.location.search);
      const suspiciousParams = ['script', 'eval', 'alert', 'document.cookie'];
      
      suspiciousParams.forEach(param => {
        if (window.location.search.toLowerCase().includes(param)) {
          console.error('Suspicious URL parameter detected:', param);
          // In a real app, you might want to report this to your security team
        }
      });
    },
    
    /**
     * Log security event
     * 
     * @param {string} type - Event type
     * @param {Object} details - Event details
     */
    logSecurityEvent: (type, details) => {
      console.warn(`Security event [${type}]:`, details);
      
      // In a real app, you would send this to a security monitoring service
      // api.post('/security/logs', { type, details });
    }
  };
  
  // Initialize security features
  export const initSecurity = () => {
    // Set up CSP
    cspSecurity.initCSP();
    
    // Initialize security monitoring
    securityMonitoring.init();
  };
  
  export default {
    xssSecurity,
    csrfSecurity,
    cspSecurity,
    validationUtils,
    securityMonitoring,
    initSecurity
  };