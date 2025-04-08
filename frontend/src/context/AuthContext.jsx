import React, { createContext, useState, useContext, useEffect } from 'react';
import { secureStorage } from '../utils/storage';

// Create the authentication context
const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Get stored user data
        const storedUser = secureStorage.getItem('user');
        const token = secureStorage.getItem('auth_token');
        
        if (storedUser && token) {
          // Validate token with the backend (in a real app)
          // const isValid = await authService.validateToken(token);
          
          // For demo, we'll just assume the token is valid
          setCurrentUser(storedUser);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Failed to authenticate. Please login again.');
        // Clear any invalid auth data
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would call an API
      // const response = await authService.login(credentials);
      
      // Mock successful login with timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock user data
          const userData = {
            id: 'user123',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            avatar: '/api/placeholder/200/200',
            preferences: {
              topics: ['Technology', 'Science', 'Health'],
              sources: ['BBC News', 'Reuters', 'Tech Review'],
              darkMode: false
            }
          };
          
          // Mock token
          const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
          
          // Store in secure storage
          secureStorage.setItem('user', userData);
          secureStorage.setItem('auth_token', token);
          
          // Update state
          setCurrentUser(userData);
          setIsLoading(false);
          
          resolve(userData);
        }, 1000);
      });
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to login. Please try again.');
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would call an API
      // const response = await authService.register(userData);
      
      // Mock successful registration with timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock user data
          const newUser = {
            id: 'user' + Math.floor(Math.random() * 10000),
            name: userData.name || userData.email.split('@')[0],
            email: userData.email,
            avatar: '/api/placeholder/200/200',
            preferences: {
              topics: [],
              sources: [],
              darkMode: false
            }
          };
          
          // Mock token
          const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
          
          // Store in secure storage
          secureStorage.setItem('user', newUser);
          secureStorage.setItem('auth_token', token);
          
          // Update state
          setCurrentUser(newUser);
          setIsLoading(false);
          
          resolve(newUser);
        }, 1000);
      });
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to register. Please try again.');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    // Clear auth data from storage
    secureStorage.removeItem('user');
    secureStorage.removeItem('auth_token');
    
    // Update state
    setCurrentUser(null);
  };

  // Update user preferences
  const updateUserPreferences = async (preferences) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would call an API
      // const response = await authService.updatePreferences(preferences);
      
      // Mock successful update with timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedUser = {
            ...currentUser,
            preferences: {
              ...currentUser.preferences,
              ...preferences
            }
          };
          
          // Update storage
          secureStorage.setItem('user', updatedUser);
          
          // Update state
          setCurrentUser(updatedUser);
          setIsLoading(false);
          
          resolve(updatedUser);
        }, 500);
      });
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to update preferences.');
      throw err;
    }
  };

  // Create context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUserPreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;