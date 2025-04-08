import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FilterPanel = ({ activeFilters, onFilterChange }) => {
  const [filters, setFilters] = useState(activeFilters);
  const [expandedSections, setExpandedSections] = useState({
    sources: true,
    topics: true,
    timeRange: true,
    sortBy: true
  });
  
  // Synchronize with parent component
  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);
  
  // Available filter options
  const filterOptions = {
    sources: [
      { id: 'BBC News', name: 'BBC News' },
      { id: 'CNN', name: 'CNN' },
      { id: 'Reuters', name: 'Reuters' },
      { id: 'Associated Press', name: 'Associated Press' },
      { id: 'New York Times', name: 'New York Times' },
      { id: 'The Guardian', name: 'The Guardian' },
      { id: 'Al Jazeera', name: 'Al Jazeera' },
      { id: 'Financial Times', name: 'Financial Times' },
      { id: 'Bloomberg', name: 'Bloomberg' },
      { id: 'Tech Review', name: 'Tech Review' },
      { id: 'Environmental Journal', name: 'Environmental Journal' },
      { id: 'Health Network', name: 'Health Network' }
    ],
    topics: [
      { id: 'Technology', name: 'Technology' },
      { id: 'Business', name: 'Business' },
      { id: 'Politics', name: 'Politics' },
      { id: 'Health', name: 'Health' },
      { id: 'Science', name: 'Science' },
      { id: 'Environment', name: 'Environment' },
      { id: 'Sports', name: 'Sports' },
      { id: 'Entertainment', name: 'Entertainment' },
      { id: 'World', name: 'World' },
      { id: 'Education', name: 'Education' }
    ],
    timeRange: [
      { id: 'anytime', name: 'Any time' },
      { id: 'day', name: 'Past 24 hours' },
      { id: 'week', name: 'Past week' },
      { id: 'month', name: 'Past month' },
      { id: 'year', name: 'Past year' }
    ],
    sortBy: [
      { id: 'relevance', name: 'Relevance' },
      { id: 'newest', name: 'Newest first' }
    ]
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleSourceToggle = (sourceId) => {
    setFilters(prev => {
      const updatedSources = prev.sources.includes(sourceId)
        ? prev.sources.filter(id => id !== sourceId)
        : [...prev.sources, sourceId];
        
      return {
        ...prev,
        sources: updatedSources
      };
    });
  };
  
  const handleTopicToggle = (topicId) => {
    setFilters(prev => {
      const updatedTopics = prev.topics.includes(topicId)
        ? prev.topics.filter(id => id !== topicId)
        : [...prev.topics, topicId];
        
      return {
        ...prev,
        topics: updatedTopics
      };
    });
  };
  
  const handleTimeRangeChange = (timeRangeId) => {
    setFilters(prev => ({
      ...prev,
      timeRange: timeRangeId
    }));
  };
  
  const handleSortByChange = (sortById) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortById
    }));
  };
  
  const clearAllFilters = () => {
    const resetFilters = {
      sources: [],
      topics: [],
      timeRange: 'anytime',
      sortBy: 'relevance'
    };
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  const hasActiveFilters = () => {
    return (
      filters.sources.length > 0 ||
      filters.topics.length > 0 ||
      filters.timeRange !== 'anytime' ||
      filters.sortBy !== 'relevance'
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Sources filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sources')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-medium">Sources</span>
          {expandedSections.sources ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.sources && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {filterOptions.sources.map((source) => (
              <div key={source.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`source-${source.id}`}
                  checked={filters.sources.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`source-${source.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {source.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Topics filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('topics')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-medium">Topics</span>
          {expandedSections.topics ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.topics && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {filterOptions.topics.map((topic) => (
              <div key={topic.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`topic-${topic.id}`}
                  checked={filters.topics.includes(topic.id)}
                  onChange={() => handleTopicToggle(topic.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`topic-${topic.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {topic.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Time Range filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('timeRange')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-medium">Time Range</span>
          {expandedSections.timeRange ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.timeRange && (
          <div className="space-y-2">
            {filterOptions.timeRange.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={`time-${option.id}`}
                  name="timeRange"
                  checked={filters.timeRange === option.id}
                  onChange={() => handleTimeRangeChange(option.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor={`time-${option.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {option.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sort By filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sortBy')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-medium">Sort By</span>
          {expandedSections.sortBy ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.sortBy && (
          <div className="space-y-2">
            {filterOptions.sortBy.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={`sort-${option.id}`}
                  name="sortBy"
                  checked={filters.sortBy === option.id}
                  onChange={() => handleSortByChange(option.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor={`sort-${option.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {option.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Apply filters button */}
      <button
        onClick={applyFilters}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterPanel;