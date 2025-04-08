import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cookieUtils } from '../../utils/storage';

export const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  
  // Check if user has already consented
  useEffect(() => {
    const hasConsented = cookieUtils.getCookie('cookie_consent') === 'true';
    setShowConsent(!hasConsented);
  }, []);
  
  const handleAccept = () => {
    // Set cookie for consent
    cookieUtils.setCookie('cookie_consent', 'true', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    setShowConsent(false);
  };
  
  const handleDecline = () => {
    // Set cookie for declined consent (still need to store the decision)
    cookieUtils.setCookie('cookie_consent', 'false', {
      maxAge: 7 * 24 * 60 * 60, // 1 week (ask again after a week)
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    setShowConsent(false);
  };
  
  const handleClose = () => {
    // Just hide the banner without setting a cookie
    // It will appear again on next page load
    setShowConsent(false);
  };
  
  if (!showConsent) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white shadow-lg border-t border-gray-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex-1 mb-4 md:mb-0 md:mr-8">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">We value your privacy</h3>
              <p className="text-gray-600 text-sm">
                We use cookies to enhance your browsing experience, personalize content, and analyze site traffic. 
                By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-500 md:hidden"
              aria-label="Close cookie consent"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Accept All
          </button>
          
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Decline Non-Essential
          </button>
          
          <Link
            to="/cookie-settings"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;