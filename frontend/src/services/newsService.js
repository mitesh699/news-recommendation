import { useState, useEffect } from 'react';

// API base URL - configurable for different environments
// FIXED: Added /api prefix directly in the base URL to ensure correct routing
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    console.warn(`API response not OK: ${response.status} ${response.statusText}`);
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
    } catch (jsonError) {
      // If the response isn't JSON
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
  }
  return response.json().catch(err => {
    console.error('Error parsing JSON:', err);
    throw new Error('Invalid response format');
  });
};

// Get news articles based on search query
export const searchNews = async (query, page = 1, pageSize = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/news/search?query=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Error searching news:', error);
    throw error;
  }
};

// Get trending news articles
export const getTrendingNews = async (category, page = 1, pageSize = 10) => {
  try {
    let url = `${API_BASE_URL}/news/trending?page=${page}&page_size=${pageSize}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    console.log('Fetching trending news from:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    console.log('Trending news response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching trending news:', error);
    // Return mock data if API call fails
    return {
      articles: getMockArticles(category),
      totalResults: 10,
      page: page,
      pageSize: pageSize
    };
  }
};

// Mock articles to use as fallback when API fails
const getMockArticles = (category = null) => {
  const allArticles = [
    {
      id: 'trending1',
      title: 'Tech Giant Announces Revolutionary AI Assistant',
      summary: 'The new AI system can understand and generate human-like text, code, and images.',
      imageUrl: 'https://picsum.photos/800/600?random=1',
      source: 'Tech News',
      publishedAt: new Date().toISOString(),
      url: '#',
      topic: 'technology',
      readTime: '5 min read',
      tags: ['AI', 'technology', 'innovation']
    },
    {
      id: 'trending2',
      title: 'Global Economy Shows Signs of Recovery',
      summary: 'Economic indicators suggest a stronger than expected rebound in multiple sectors worldwide.',
      imageUrl: 'https://picsum.photos/800/600?random=2',
      source: 'Business Weekly',
      publishedAt: new Date().toISOString(),
      url: '#',
      topic: 'business',
      readTime: '4 min read',
      tags: ['economy', 'business', 'global']
    },
    {
      id: 'trending3',
      title: 'New Study Reveals Benefits of Mediterranean Diet',
      summary: 'Research confirms significant health improvements for participants following the diet for 12 months.',
      imageUrl: 'https://picsum.photos/800/600?random=3',
      source: 'Health Journal',
      publishedAt: new Date().toISOString(),
      url: '#',
      topic: 'health',
      readTime: '6 min read',
      tags: ['health', 'diet', 'research']
    },
    {
      id: 'trending4',
      title: 'Major League Announces Expansion Teams',
      summary: 'Three new teams will join the league starting next season, bringing the total to 32 teams.',
      imageUrl: 'https://picsum.photos/800/600?random=4',
      source: 'Sports Update',
      publishedAt: new Date().toISOString(),
      url: '#',
      topic: 'sports',
      readTime: '3 min read',
      tags: ['sports', 'teams', 'league']
    },
    {
      id: 'trending5',
      title: 'Breakthrough in Renewable Energy Storage',
      summary: 'Scientists develop new battery technology that promises to solve key limitations.',
      imageUrl: 'https://picsum.photos/800/600?random=5',
      source: 'Science Today',
      publishedAt: new Date().toISOString(),
      url: '#',
      topic: 'science',
      readTime: '7 min read',
      tags: ['science', 'energy', 'technology']
    }
  ];
  
  if (category) {
    return allArticles.filter(article => article.topic.toLowerCase() === category.toLowerCase());
  }
  return allArticles;
};

// Get article summary
export const getArticleSummary = async (url) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/news/summary?url=${encodeURIComponent(url)}`
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Error getting article summary:', error);
    throw error;
  }
};

// Get summary from an external URL
export const getSummaryFromUrl = async (url) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/news/summary?url=${encodeURIComponent(url)}`
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching URL summary:', error);
    // Return a fallback message if the API fails
    return 'Unable to generate summary. Please check the original article.';
  }
};

// Get article recommendations
export const getRecommendations = async (articleId, userInterests, maxResults = 5) => {
  try {
    let url = `${API_BASE_URL}/news/recommendations?max_results=${maxResults}`;
    
    if (articleId) {
      url += `&article_id=${encodeURIComponent(articleId)}`;
    } 
    
    // Ensure we're always sending at least some interests if nothing else is specified
    if (userInterests && userInterests.length > 0) {
      const interestsParam = userInterests.map(i => `user_interests=${encodeURIComponent(i)}`).join('&');
      url += `&${interestsParam}`;
    } else if (!articleId) {
      // If no article_id and no interests, provide default interests
      const defaultInterests = ['technology', 'business', 'health', 'science'];
      const interestsParam = defaultInterests.map(i => `user_interests=${encodeURIComponent(i)}`).join('&');
      url += `&${interestsParam}`;
    }
    
    console.log('Fetching recommendations from:', url);
    const response = await fetch(url);
    const data = await handleResponse(response);
    console.log('Recommendations response:', data);
    return data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // Return mock data instead of throwing error
    console.log('Using mock article data as fallback for recommendations');
    return getMockArticles().slice(0, maxResults);
  }
};

// Custom hook for article search
export const useNewsSearch = (initialQuery = '', initialPage = 1, pageSize = 10) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await searchNews(query, page, pageSize);
        setArticles(data.articles);
        setTotalResults(data.totalResults);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [query, page, pageSize]);

  return { articles, loading, error, totalResults, setQuery, setPage };
};

// Custom hook for trending news
export const useTrendingNews = (initialCategory = null, initialPage = 1, pageSize = 10) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getTrendingNews(category, page, pageSize);
        setArticles(data.articles);
        setTotalResults(data.totalResults);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [category, page, pageSize]);

  return { articles, loading, error, totalResults, setCategory, setPage };
};

// Custom hook for article recommendations
export const useRecommendations = (articleId = null, userInterests = [], maxResults = 5) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Only fetch if we have either an article ID or user interests
      if (!articleId && (!userInterests || userInterests.length === 0)) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getRecommendations(articleId, userInterests, maxResults);
        setRecommendations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [articleId, userInterests, maxResults]);

  return { recommendations, loading, error };
};

// Custom hook for article summary
export const useArticleSummary = (articleUrl = null) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!articleUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getArticleSummary(articleUrl);
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [articleUrl]);

  return { summary, loading, error };
};
