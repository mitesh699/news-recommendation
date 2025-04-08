import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import NewsCard from '../components/news/NewsCard';
import FilterPanel from '../components/news/FilterPanel';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    sources: [],
    topics: [],
    timeRange: 'anytime',
    sortBy: 'relevance'
  });
  
  // Simulate search API call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      // Mock search results
      const mockResults = [
        {
          id: 's1',
          title: `${searchQuery} Related News: Global Climate Initiative Launches`,
          summary: 'New international partnership aims to accelerate climate action and sustainable development.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Environmental Journal',
          publishedAt: '2025-03-27T08:30:00Z',
          url: '/article/s1',
          topic: 'Environment',
          readTime: '4 min read'
        },
        {
          id: 's2',
          title: `Technology Advancements in ${searchQuery} Field Growing Rapidly`,
          summary: 'Latest research shows significant progress in developing new solutions.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Tech Review',
          publishedAt: '2025-03-26T14:15:00Z',
          url: '/article/s2',
          topic: 'Technology',
          readTime: '5 min read'
        },
        {
          id: 's3',
          title: `Economic Impact of ${searchQuery} Examined in New Study`,
          summary: 'Researchers analyze potential long-term effects on global markets and industries.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Economics Today',
          publishedAt: '2025-03-26T11:45:00Z',
          url: '/article/s3',
          topic: 'Business',
          readTime: '6 min read'
        },
        {
          id: 's4',
          title: `Health Experts Weigh In On ${searchQuery} Developments`,
          summary: 'Medical professionals share insights on recent advancements and implications.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Health Network',
          publishedAt: '2025-03-25T09:20:00Z',
          url: '/article/s4',
          topic: 'Health',
          readTime: '3 min read'
        },
        {
          id: 's5',
          title: `Political Debates Around ${searchQuery} Intensify`,
          summary: 'Lawmakers discuss potential legislation and regulatory frameworks.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Political Times',
          publishedAt: '2025-03-24T16:30:00Z',
          url: '/article/s5',
          topic: 'Politics',
          readTime: '7 min read'
        },
        {
          id: 's6',
          title: `International Perspectives on ${searchQuery}: A Global Analysis`,
          summary: 'How different regions and countries are approaching key challenges.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Global Affairs',
          publishedAt: '2025-03-23T13:10:00Z',
          url: '/article/s6',
          topic: 'World',
          readTime: '8 min read'
        }
      ];
      
      // Apply filters (in a real app, this would be done on the backend)
      let filteredResults = [...mockResults];
      
      if (activeFilters.sources.length > 0) {
        filteredResults = filteredResults.filter(result => 
          activeFilters.sources.includes(result.source)
        );
      }
      
      if (activeFilters.topics.length > 0) {
        filteredResults = filteredResults.filter(result => 
          activeFilters.topics.includes(result.topic)
        );
      }
      
      // Apply time range filter (simplified)
      if (activeFilters.timeRange !== 'anytime') {
        const now = new Date();
        let cutoffDate = new Date();
        
        switch(activeFilters.timeRange) {
          case 'day':
            cutoffDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
        
        filteredResults = filteredResults.filter(result => 
          new Date(result.publishedAt) >= cutoffDate
        );
      }
      
      // Apply sorting
      if (activeFilters.sortBy === 'newest') {
        filteredResults.sort((a, b) => 
          new Date(b.publishedAt) - new Date(a.publishedAt)
        );
      }
      
      setResults(filteredResults);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      queryParams.set('q', searchQuery);
      navigate({ search: queryParams.toString() });
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    navigate({ search: '' });
  };
  
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <PageLayout showSidebar={false}>
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex items-center mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, topics, sources..."
              className="w-full px-5 py-3 pr-12 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
          >
            <Search size={20} className="mr-2" />
            <span>Search</span>
          </button>
        </form>
        
        {searchQuery && (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
            </h1>
            <button
              onClick={toggleFilters}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} className="mr-2" />
              <span>Filters</span>
              {Object.values(activeFilters).some(filter => 
                Array.isArray(filter) ? filter.length > 0 : filter !== 'anytime' && filter !== 'relevance'
              ) && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters panel - shown by default on larger screens */}
        {(showFilters || window.innerWidth >= 768) && searchQuery && (
          <div className="w-full md:w-64 flex-shrink-0">
            <FilterPanel 
              activeFilters={activeFilters} 
              onFilterChange={handleFilterChange} 
            />
          </div>
        )}
        
        {/* Search results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {results.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <NewsCard 
                      key={result.id}
                      article={result}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <h2 className="text-xl font-bold mb-2">No results found</h2>
                      <p className="text-gray-600">
                        Try adjusting your search terms or filters to find what you're looking for.
                      </p>
                    </>
                  ) : (
                    <h2 className="text-xl font-bold">Enter a search term to find news</h2>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SearchResults;