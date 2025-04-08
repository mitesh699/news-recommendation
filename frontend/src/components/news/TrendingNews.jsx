import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrendingNews } from '../../services/newsService';

const TrendingNews = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Use our custom hook to fetch trending news data
  const {
    articles: trendingArticles,
    loading: isLoading,
    error,
    setCategory
  } = useTrendingNews(selectedCategory, 1, 5); // page 1, 5 results

  // Available categories for filtering
  const categories = [
    { id: null, name: 'All' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' },
    { id: 'sports', name: 'Sports' },
    { id: 'entertainment', name: 'Entertainment' }
  ];

  // When category selection changes, update our data
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCategory(categoryId);
  };
  
  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffMs = now - publishedDate;
    
    // Convert to hours, minutes, etc.
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };
  
  // Generate fake search statistics based on title length (just for demo)
  const getSearchStats = (title) => {
    const length = title.length;
    const searches = Math.round((length * 3.7) * (Math.random() * 0.5 + 0.75)); // some randomization
    return `${searches}K+ searches`;
  };

  // The previously defined handleCategoryChange function replaces this

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id || 'all'}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error loading trending news: {error}
        </div>
      ) : trendingArticles && trendingArticles.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {trendingArticles.map((article, index) => (
            <li key={article.id} className="py-4">
              <Link to={`/article/${article.id}`} className="group">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 mr-4">
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600">
                      {article.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-500">
                      <div className="flex items-center mr-4">
                        <TrendingUp size={14} className="mr-1 text-red-500" />
                        <span>{getSearchStats(article.title)}</span>
                      </div>
                      <span className="mr-4">{getTimeAgo(article.publishedAt)}</span>
                      <div className="flex items-center">
                        <span>Source: {article.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No trending news available at the moment</p>
        </div>
      )}
    </div>
  );
};

export default TrendingNews;