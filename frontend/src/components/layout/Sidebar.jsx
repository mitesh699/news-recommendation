import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, TrendingUp, Bookmark, History, Filter } from 'lucide-react';

const Sidebar = ({ className }) => {
  const [showFilters, setShowFilters] = useState(false);

  // Categories for quick navigation
  const categories = [
    { name: 'Global News', icon: <Globe size={18} />, path: '/' },
    { name: 'Trending', icon: <TrendingUp size={18} />, path: '/trending' },
    { name: 'Saved Articles', icon: <Bookmark size={18} />, path: '/profile?tab=saved' },
    { name: 'Reading History', icon: <History size={18} />, path: '/profile?tab=history' }
  ];

  // Filter options
  const filters = {
    sources: [
      { id: 'nyt', name: 'New York Times' },
      { id: 'wapo', name: 'Washington Post' },
      { id: 'reuters', name: 'Reuters' },
      { id: 'ap', name: 'Associated Press' },
      { id: 'bbc', name: 'BBC News' }
    ],
    timeRange: [
      { id: 'today', name: 'Today' },
      { id: 'week', name: 'This Week' },
      { id: 'month', name: 'This Month' },
      { id: 'year', name: 'This Year' }
    ]
  };

  return (
    <aside className={className}>
      <nav className="space-y-6">
        {/* Quick navigation section */}
        <div>
          <h3 className="font-medium text-gray-500 uppercase tracking-wider text-xs mb-3">
            Quick Navigation
          </h3>
          <ul className="space-y-2">
            {categories.map((category, index) => (
              <li key={index}>
                <Link 
                  to={category.path}
                  className="flex items-center px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                >
                  <span className="mr-3 text-gray-500">{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Trending topics section */}
        <div>
          <h3 className="font-medium text-gray-500 uppercase tracking-wider text-xs mb-3">
            Trending Topics
          </h3>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/topic/ai"
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              >
                Artificial Intelligence
              </Link>
            </li>
            <li>
              <Link 
                to="/topic/climate"
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              >
                Climate Change
              </Link>
            </li>
            <li>
              <Link 
                to="/topic/space"
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              >
                Space Exploration
              </Link>
            </li>
            <li>
              <Link 
                to="/topic/health"
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              >
                Global Health
              </Link>
            </li>
            <li>
              <Link 
                to="/topic/sports"
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
              >
                Sports
              </Link>
            </li>
          </ul>
        </div>

        {/* Filters section */}
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          >
            <div className="flex items-center">
              <Filter size={18} className="mr-3 text-gray-500" />
              <span>Advanced Filters</span>
            </div>
            <span className="text-xs">{showFilters ? '−' : '+'}</span>
          </button>
          
          {showFilters && (
            <div className="mt-2 space-y-4 px-3">
              {/* Sources filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sources</h4>
                {filters.sources.map((source) => (
                  <div key={source.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`source-${source.id}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`source-${source.id}`} className="ml-2 text-sm text-gray-700">
                      {source.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Time range filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Time Range</h4>
                {filters.timeRange.map((range) => (
                  <div key={range.id} className="flex items-center mb-1">
                    <input
                      type="radio"
                      id={`time-${range.id}`}
                      name="timeRange"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={`time-${range.id}`} className="ml-2 text-sm text-gray-700">
                      {range.name}
                    </label>
                  </div>
                ))}
              </div>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm">
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;