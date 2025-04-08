import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewsSearch } from '../services/newsService';
import SearchBar from '../components/news/SearchBar';
import NewsCard from '../components/news/NewsCard';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  
  // Use our custom hook to handle news search
  const { 
    articles, 
    loading, 
    error, 
    totalResults, 
    setQuery, 
    setPage 
  } = useNewsSearch(initialQuery, initialPage, 10);
  
  // Current query and page state
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Update URL when page or query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentQuery) params.set('q', currentQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    navigate(`/search?${params.toString()}`, { replace: true });
    
    // Update the search state in our hook
    setQuery(currentQuery);
    setPage(currentPage);
  }, [currentQuery, currentPage, navigate, setQuery, setPage]);
  
  // Handle search submission
  const handleSearch = (query) => {
    setCurrentQuery(query);
    setCurrentPage(1);
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(totalResults / 10);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar 
          onSearch={handleSearch} 
          initialQuery={currentQuery} 
          className="max-w-3xl mx-auto"
        />
      </div>
      
      {currentQuery && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Search results for "{currentQuery}"
          </h1>
          <p className="text-gray-500">
            {loading ? 'Searching...' : `${totalResults} results found`}
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-lg">
          Error: {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : currentQuery ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No results found for "{currentQuery}"
          </p>
          <p className="text-gray-400 mt-2">
            Try different keywords or check your spelling
          </p>
        </div>
      ) : null}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center p-2 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Page numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="flex items-center px-2">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-10 h-10 flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`flex items-center p-2 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
