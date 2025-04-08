import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Search, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <PageLayout showSidebar={false}>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-blue-600">404</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 max-w-xl mb-8">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or try one of the options below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-12">
          <Link 
            to="/"
            className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <Home size={36} className="text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Go Home</h3>
            <p className="text-gray-600 text-sm">
              Return to our homepage
            </p>
          </Link>
          
          <Link 
            to="/search"
            className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <Search size={36} className="text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search</h3>
            <p className="text-gray-600 text-sm">
              Find what you're looking for
            </p>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <ArrowLeft size={36} className="text-blue-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Go Back</h3>
            <p className="text-gray-600 text-sm">
              Return to previous page
            </p>
          </button>
        </div>
        
        <div className="w-full max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Topics</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              to="/topic/technology"
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-800"
            >
              Technology
            </Link>
            <Link 
              to="/topic/business"
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-800"
            >
              Business
            </Link>
            <Link 
              to="/topic/science"
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-800"
            >
              Science
            </Link>
            <Link 
              to="/topic/health"
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-800"
            >
              Health
            </Link>
            <Link 
              to="/topic/world"
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-800"
            >
              World
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFoundPage;