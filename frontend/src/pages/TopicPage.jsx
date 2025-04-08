import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import NewsCard from '../components/news/NewsCard';
import FilterPanel from '../components/news/FilterPanel';
import { SlidersHorizontal, TrendingUp, Share2, Rss } from 'lucide-react';

const TopicPage = () => {
  const { topicId } = useParams();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    sources: [],
    topics: [],
    timeRange: 'anytime',
    sortBy: 'newest'
  });

  // Topic metadata
  const topicInfo = {
    technology: {
      name: 'Technology',
      description: 'Latest news on technological innovations, gadgets, software, AI, and digital trends.',
      icon: '💻',
      color: 'bg-blue-100 text-blue-800'
    },
    business: {
      name: 'Business',
      description: 'Business news, market trends, economic developments, and corporate updates.',
      icon: '📊',
      color: 'bg-green-100 text-green-800'
    },
    politics: {
      name: 'Politics',
      description: 'Political news, policy developments, elections, and government affairs.',
      icon: '🏛️',
      color: 'bg-red-100 text-red-800'
    },
    science: {
      name: 'Science',
      description: 'Scientific discoveries, research breakthroughs, and advancements across disciplines.',
      icon: '🔬',
      color: 'bg-purple-100 text-purple-800'
    },
    health: {
      name: 'Health',
      description: 'Health news, medical research, wellness tips, and healthcare developments.',
      icon: '🏥',
      color: 'bg-green-100 text-green-800'
    },
    climate: {
      name: 'Climate',
      description: 'Climate change news, environmental developments, and sustainability initiatives.',
      icon: '🌍',
      color: 'bg-green-100 text-green-800'
    },
    sports: {
      name: 'Sports',
      description: 'Sports news, game results, athlete updates, and tournament coverage.',
      icon: '⚽',
      color: 'bg-orange-100 text-orange-800'
    },
    entertainment: {
      name: 'Entertainment',
      description: 'Entertainment news, celebrity updates, movie reviews, and cultural trends.',
      icon: '🎬',
      color: 'bg-pink-100 text-pink-800'
    }
  };

  // Get current topic info or fallback
  const currentTopic = topicInfo[topicId] || {
    name: topicId.charAt(0).toUpperCase() + topicId.slice(1),
    description: `News related to ${topicId}.`,
    icon: '📰',
    color: 'bg-gray-100 text-gray-800'
  };

  // Fetch topic articles
  useEffect(() => {
    const fetchTopicArticles = async () => {
      try {
        setIsLoading(true);
        
        // Make an actual API call to the backend to get articles by topic
        const response = await fetch(`http://localhost:8000/api/news/topics/${topicId}?page=1&page_size=10`);
        
        if (!response.ok) {
          throw new Error(`Error fetching articles for topic: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the received articles to ensure they have all needed properties
        const processedArticles = data.articles?.map(article => ({
          ...article,
          // Add placeholder image if no image is provided
          imageUrl: article.imageUrl || `https://source.unsplash.com/random/800x500/?${encodeURIComponent(topicId)}`,
          // Ensure we have a readTime property
          readTime: article.readTime || `${Math.max(1, Math.floor(Math.random() * 8))} min read`
        })) || [];
        
        setArticles(processedArticles);
      } catch (error) {
        console.error('Error fetching topic articles:', error);
        
        // Fallback to mock data for demonstration purposes
        const mockArticles = [
        {
          id: `${topicId}1`,
          title: `Latest Developments in ${currentTopic.name} Show Promising Trends`,
          summary: `Recent advancements in ${currentTopic.name.toLowerCase()} indicate significant progress and potential for future growth.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Industry Journal',
          publishedAt: '2025-03-27T09:15:00Z',
          url: `/article/${topicId}1`,
          topic: currentTopic.name,
          readTime: '5 min read'
        },
        {
          id: `${topicId}2`,
          title: `Experts Analyze Key ${currentTopic.name} Trends for 2025`,
          summary: `Leading specialists share insights on the most important ${currentTopic.name.toLowerCase()} developments to watch this year.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Tech Review',
          publishedAt: '2025-03-26T14:30:00Z',
          url: `/article/${topicId}2`,
          topic: currentTopic.name,
          readTime: '7 min read'
        },
        {
          id: `${topicId}3`,
          title: `Global Impact of Recent ${currentTopic.name} Innovations`,
          summary: `How recent breakthroughs in ${currentTopic.name.toLowerCase()} are reshaping industries and affecting everyday life.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Global News',
          publishedAt: '2025-03-26T11:45:00Z',
          url: `/article/${topicId}3`,
          topic: currentTopic.name,
          readTime: '6 min read'
        },
        {
          id: `${topicId}4`,
          title: `${currentTopic.name} Leaders Gather for Annual Summit`,
          summary: `Key figures in the ${currentTopic.name.toLowerCase()} sector meet to discuss challenges and opportunities in the coming year.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Event Coverage',
          publishedAt: '2025-03-25T16:20:00Z',
          url: `/article/${topicId}4`,
          topic: currentTopic.name,
          readTime: '4 min read'
        },
        {
          id: `${topicId}5`,
          title: `The Future of ${currentTopic.name}: An In-Depth Analysis`,
          summary: `Comprehensive examination of where ${currentTopic.name.toLowerCase()} is heading and what to expect in the next decade.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Future Insights',
          publishedAt: '2025-03-24T13:10:00Z',
          url: `/article/${topicId}5`,
          topic: currentTopic.name,
          readTime: '9 min read'
        },
        {
          id: `${topicId}6`,
          title: `How ${currentTopic.name} is Transforming Modern Society`,
          summary: `Exploring the widespread impact of ${currentTopic.name.toLowerCase()} on various aspects of contemporary life.`,
          imageUrl: '/api/placeholder/800/500',
          source: 'Social Analysis',
          publishedAt: '2025-03-23T10:45:00Z',
          url: `/article/${topicId}6`,
          topic: currentTopic.name,
          readTime: '8 min read'
        }
      ];
      
        setArticles(mockArticles);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopicArticles();
  }, [topicId, currentTopic.name]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    // In a real app, this would trigger a new API call with the filters
  };

  // Related topics based on current topic
  const getRelatedTopics = () => {
    const allTopics = Object.keys(topicInfo);
    const filteredTopics = allTopics.filter(topic => topic !== topicId);
    // Return random selection of 3-5 topics
    return filteredTopics
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 3);
  };

  const relatedTopics = getRelatedTopics();

  return (
    <PageLayout>
      <div className="mb-8">
        {/* Topic header */}
        <div className={`px-6 py-8 rounded-lg mb-6 ${currentTopic.color.split(' ')[0].replace('100', '50')}`}>
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">{currentTopic.icon}</span>
            <h1 className="text-3xl font-bold">{currentTopic.name}</h1>
          </div>
          <p className="text-gray-700 max-w-3xl mb-4">{currentTopic.description}</p>
          
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center px-4 py-2 bg-white rounded-md text-gray-700 hover:bg-gray-100 shadow-sm">
              <TrendingUp size={16} className="mr-2" />
              <span>Trending</span>
            </button>
            
            <button 
              onClick={toggleFilters}
              className={`flex items-center px-4 py-2 rounded-md shadow-sm ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal size={16} className="mr-2" />
              <span>Filters</span>
            </button>
            
            <button className="flex items-center px-4 py-2 bg-white rounded-md text-gray-700 hover:bg-gray-100 shadow-sm">
              <Share2 size={16} className="mr-2" />
              <span>Share</span>
            </button>
            
            <button className="flex items-center px-4 py-2 bg-white rounded-md text-gray-700 hover:bg-gray-100 shadow-sm">
              <Rss size={16} className="mr-2" />
              <span>Subscribe</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar - conditionally shown */}
        {showFilters && (
          <div className="w-full md:w-64 flex-shrink-0">
            <FilterPanel 
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Latest in {currentTopic.name}</h2>
              
              {/* Featured article */}
              <div className="mb-8">
                <NewsCard 
                  article={articles[0]}
                  featured={true}
                />
              </div>
              
              {/* Article grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {articles.slice(1).map(article => (
                  <NewsCard 
                    key={article.id}
                    article={article}
                    featured={false}
                  />
                ))}
              </div>
              
              {/* Related topics */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
                <div className="flex flex-wrap gap-3">
                  {relatedTopics.map(topic => (
                    <Link 
                      key={topic}
                      to={`/topic/${topic}`}
                      className={`flex items-center px-4 py-2 rounded-full ${topicInfo[topic].color}`}
                    >
                      <span className="mr-2">{topicInfo[topic].icon}</span>
                      <span>{topicInfo[topic].name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Load more button */}
              <div className="flex justify-center">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md">
                  Load More Articles
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TopicPage;