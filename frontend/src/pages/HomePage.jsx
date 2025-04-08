import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import NewsCard from '../components/news/NewsCard';
import TrendingNews from '../components/news/TrendingNews';
import TopicSelector from '../components/news/TopicSelector';
import { getTrendingNews, getRecommendations } from '../services/newsService';

const HomePage = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        // Fetch featured articles from trending news
        const trendingResponse = await getTrendingNews(null, 1, 3);
        setFeaturedArticles(trendingResponse.articles || []);
        
        // Fetch personalized recommendations with more comprehensive user interests
        console.log('Fetching recommendations...');
        try {
          const recommendationsResponse = await getRecommendations(
            null, // No specific article ID
            ['technology', 'business', 'health', 'science', 'sports'], // Expanded user interests
            4 // Get 4 recommendations
          );
          
          console.log('Recommendations received:', recommendationsResponse);
          
          if (Array.isArray(recommendationsResponse) && recommendationsResponse.length > 0) {
            // Successfully got recommendations from the API
            setRecommendedArticles(recommendationsResponse);
          } else {
            // Empty array or invalid response, use trending as fallback
            console.log('Empty recommendations, using fallback');
            const fallbackResponse = await getTrendingNews('business', 1, 4);
            setRecommendedArticles(fallbackResponse.articles || []);
          }
        } catch (recError) {
          console.error('Error fetching recommendations:', recError);
          // If recommendations fail, fallback to trending
          const fallbackResponse = await getTrendingNews('business', 1, 4);
          setRecommendedArticles(fallbackResponse.articles || []);
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
        setError('Failed to load content. Please try again later.');
        
        // Set fallback mock data if all API calls fail
        setFeaturedArticles([
          {
            id: '1-fallback',
            title: 'Global Climate Summit Reaches Landmark Agreement',
            summary: 'World leaders agree on ambitious targets to reduce carbon emissions by 2030.',
            imageUrl: 'https://source.unsplash.com/random/800x500/?climate',
            source: 'Reuters',
            publishedAt: '2025-03-26T10:30:00Z',
            url: '/article/1',
            topic: 'Climate',
            readTime: '4 min read'
          },
          {
            id: '2-fallback',
            title: 'New AI Model Shows Promise in Medical Diagnostics',
            summary: 'Researchers develop AI system capable of detecting early signs of disease with unprecedented accuracy.',
            imageUrl: 'https://source.unsplash.com/random/800x500/?technology',
            source: 'MIT Technology Review',
            publishedAt: '2025-03-27T08:15:00Z',
            url: '/article/2',
            topic: 'Technology',
            readTime: '6 min read'
          },
          {
            id: '3-fallback',
            title: 'Space Tourism Company Announces First Commercial Flight',
            summary: 'Civilian passengers set to orbit Earth next month in historic mission.',
            imageUrl: 'https://source.unsplash.com/random/800x500/?space',
            source: 'Space.com',
            publishedAt: '2025-03-26T14:45:00Z',
            url: '/article/3',
            topic: 'Space',
            readTime: '5 min read'
          }
        ]);
        
        setRecommendedArticles([
          {
            id: '4-fallback',
            title: 'Global Markets React to Central Bank Announcements',
            summary: 'Stock indices show volatility as investors digest latest monetary policy changes.',
            imageUrl: 'https://source.unsplash.com/random/400x300/?finance',
            source: 'Financial Times',
            publishedAt: '2025-03-27T09:20:00Z',
            url: '/article/4',
            topic: 'Finance',
            readTime: '3 min read'
          },
          {
            id: '5-fallback',
            title: 'Breakthrough in Quantum Computing Achieves New Milestone',
            summary: 'Scientists demonstrate quantum advantage in solving complex problems.',
            imageUrl: 'https://source.unsplash.com/random/400x300/?quantum',
            source: 'Nature',
            publishedAt: '2025-03-26T11:05:00Z',
            url: '/article/5',
            topic: 'Technology',
            readTime: '7 min read'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []); 

  // Topics for the topic selector
  const topics = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'business', name: 'Business', icon: '📊' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'politics', name: 'Politics', icon: '🏛️' },
    { id: 'climate', name: 'Climate', icon: '🌍' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' }
  ];

  // Handle topic selection
  const handleTopicSelect = (topicId) => {
    console.log(`Selected topic: ${topicId}`);
    // Navigate to the topic page
    window.location.href = `/topics/${topicId}`;
  };

  return (
    <PageLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Hero section with featured articles */}
          <section className="mb-12">
            <h1 className="text-3xl font-bold mb-6">Today's Top Stories</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <NewsCard 
                  key={article.id}
                  article={article}
                  featured={true}
                />
              ))}
            </div>
          </section>

          {/* Topic selector section */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Explore Topics</h2>
              <a href="/topics" className="text-blue-600 hover:underline text-sm">
                View All Topics
              </a>
            </div>
            <TopicSelector topics={topics} onSelectTopic={handleTopicSelect} />
          </section>

          {/* Trending news section */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Trending Now</h2>
              <a href="/trending" className="text-blue-600 hover:underline text-sm">
                See More
              </a>
            </div>
            <TrendingNews />
          </section>

          {/* Personalized recommendations */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recommended For You</h2>
              <button className="text-gray-500 hover:text-blue-600 text-sm">
                Customize
              </button>
            </div>
            {error && (
              <p className="text-red-500 mb-4">{error}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedArticles.map((article) => (
                <NewsCard 
                  key={article.id}
                  article={article}
                  featured={false}
                />
              ))}
            </div>
          </section>
          
          {/* Newsletter subscription */}
          <section className="bg-blue-50 rounded-lg p-8 mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-3">Stay Informed</h2>
              <p className="text-gray-600 mb-6">
                Get the top news stories and personalized recommendations delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
          </section>
        </>
      )}
    </PageLayout>
  );
};

export default HomePage;