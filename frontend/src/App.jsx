import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CookieConsent } from './components/common/CookieConsent';

const App = () => {
  // Add meta tags for better SEO
  useEffect(() => {
    document.title = 'NewsAI - Personalized News Recommendations';
    
    // Create meta description if it doesn't exist
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Discover personalized news from across the web based on your interests, with AI-powered recommendations.';
    
    // Create meta viewport if it doesn't exist
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    
    // Add CSP meta tag - commented out to avoid potential runtime issues
    // Let's handle CSP through server headers instead for more reliability
    /*
    let metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaCSP) {
      metaCSP = document.createElement('meta');
      metaCSP.httpEquiv = 'Content-Security-Policy';
      document.head.appendChild(metaCSP);
    }
    metaCSP.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' https://trusted-cdn.com data:; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; font-src 'self' https://fonts.googleapis.com;";
    */
  }, []);

  return (
    <Router>
      {/* Note: AuthProvider must come before ThemeProvider since ThemeProvider uses AuthContext */}
      <AuthProvider>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <AppRoutes />
            <CookieConsent />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;