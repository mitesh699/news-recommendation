import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X, Bell, User } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality or navigation to search results
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'Technology', path: '/topic/technology' },
    { name: 'Business', path: '/topic/business' },
    { name: 'Politics', path: '/topic/politics' },
    { name: 'Science', path: '/topic/science' },
    { name: 'Health', path: '/topic/health' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">NewsAI</span>
            </Link>
          </div>

          {/* Search bar - visible on desktop */}
          <div className="hidden md:block flex-1 mx-8">
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search news, topics, sources..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-blue-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* Navigation - visible on desktop */}
          <nav className="hidden md:flex space-x-4">
            {navigationLinks.map((link, index) => (
              <Link 
                key={index}
                to={link.path}
                className="px-2 py-1 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-blue-600">
              <Bell size={20} />
            </button>
            <Link to="/profile" className="text-gray-600 hover:text-blue-600">
              <User size={20} />
            </Link>
            
            {/* Mobile menu button */}
            <button 
              onClick={toggleMenu}
              className="md:hidden text-gray-600 hover:text-blue-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile search - visible when menu is open */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search news, topics, sources..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-blue-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>
            
            {/* Mobile navigation links */}
            <nav className="flex flex-col space-y-2">
              {navigationLinks.map((link, index) => (
                <Link 
                  key={index}
                  to={link.path}
                  className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;