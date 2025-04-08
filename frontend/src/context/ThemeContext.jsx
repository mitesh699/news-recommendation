import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser } = useAuth();
  
  // Initialize theme from user preferences or system preference
  useEffect(() => {
    // If user is logged in, use their preference
    if (currentUser && currentUser.preferences && currentUser.preferences.darkMode !== undefined){
      setDarkMode(currentUser.preferences.darkMode);
      return;
    }
    
    // Otherwise check localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      return;
    }
    
    // If no saved preference, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      return;
    }
    
    // Default to light mode
    setDarkMode(false);
  }, [currentUser]);
  
  // Update theme when darkMode changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    
    // Apply theme to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  // Set specific theme
  const setTheme = (isDark) => {
    setDarkMode(isDark);
  };
  
  const value = {
    darkMode,
    toggleTheme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;