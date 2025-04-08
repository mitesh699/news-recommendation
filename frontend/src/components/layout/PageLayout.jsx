import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const PageLayout = ({ children, showSidebar = true }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header section */}
      <Header />
      
      {/* Main content */}
      <main className="flex flex-1 pt-16"> {/* pt-16 to account for fixed header */}
        {showSidebar && (
          <Sidebar className="hidden md:block w-64 border-r border-gray-200 p-4 bg-white" />
        )}
        
        <div className={`flex-1 ${showSidebar ? 'md:ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </div>
      </main>
      
      {/* Footer section */}
      <Footer />
    </div>
  );
};

export default PageLayout;