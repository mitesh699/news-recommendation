import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, initialQuery = '', className = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    inputRef.current.focus();
  };

  // Update local state if props change
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative flex items-center ${className}`}
    >
      <div className={`relative flex-grow transition-all duration-300 ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for news..."
          className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={16} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      <button
        type="submit"
        className="ml-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
