import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark, Clock, RefreshCw } from 'lucide-react';
import { useArticleSummary, useRecommendations } from '../../services/newsService';

const ArticleDetailView = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  
  // Mock article data (in a real application, this would come from an API call using the articleId)
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for bookmark
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Get article summary
  const { summary, loading: summaryLoading, error: summaryError } = useArticleSummary(article?.url);
  
  // Get article recommendations based on current article
  const { recommendations, loading: recommendationsLoading } = 
    useRecommendations(articleId, article?.topic ? [article.topic] : []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Fetch article data from the API
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      
      try {
        // Get the API base URL from the environment or use the default
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
        const url = `${API_BASE_URL}/news/articles/${articleId}`;
        
        console.log('Fetching article from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Article data received:', data);
        
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
        
        // Fallback to mock data if the API call fails
        const mockArticle = {
          id: articleId,
          title: 'AI Integration Revolutionizes News Recommendations',
          url: 'https://example.com/ai-news-recommendation',
          source: 'Tech Insights',
          publishedAt: new Date().toISOString(),
          imageUrl: 'https://via.placeholder.com/1200x600?text=AI+News+Recommendation',
          summary: 'Artificial intelligence is transforming how we discover and consume news content, leading to more personalized experiences.',
          topic: 'technology',
          readTime: '5 min read',
          content: `Artificial intelligence is transforming how we discover and consume news content, leading to more personalized experiences. 
          
          In recent years, news aggregation platforms have increasingly turned to AI to solve the problem of information overload. By analyzing user behavior, content semantics, and contextual relevance, these systems can deliver news that matters most to individual readers.
          
          The technology works by creating embeddings or vector representations of articles, which capture their semantic meaning. When a user interacts with content, the system builds a profile of their interests based on these embeddings. Advanced recommendation algorithms then match user profiles with new content to suggest relevant articles.
          
          What makes modern AI news recommendations special is their ability to balance personalization with exploration. While showing content aligned with known interests, these systems also introduce diversity to prevent the formation of echo chambers.
          
          Looking ahead, the next frontier in AI news recommendations involves multimodal understanding - processing text, images, audio, and video to comprehend news holistically. This approach promises even more nuanced content delivery tailored to how individuals actually consume information across different formats.
          
          For publishers and platforms, the challenge remains striking the right balance between algorithmic curation and editorial judgment. The most successful implementations combine machine intelligence with human expertise to deliver news that's both personally relevant and broadly informative.`
        };
        
        setArticle(mockArticle);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId]);

  // Handle bookmark toggle
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, this would save to user's profile
  };

  // Handle share
  const handleShare = () => {
    // In a real app, this would open a share dialog
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Article not found</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
          >
            <ArrowLeft size={16} className="mr-1" /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to news
      </button>
      
      {/* Article header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded mr-2">
            {article.topic}
          </span>
          <span className="text-gray-500 text-sm">{article.source}</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-500 text-sm">
            {formatDate(article.publishedAt)}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-gray-500 text-sm mr-4">
              <Clock size={14} className="mr-1" />
              <span>{article.readTime}</span>
            </div>
            
            <button 
              onClick={handleBookmark}
              className={`p-1.5 rounded-full ${isBookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            
            <button 
              onClick={handleShare}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Share article"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Featured image */}
      <div className="mb-8 overflow-hidden rounded-xl">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-auto object-cover"
        />
      </div>
      
      {/* AI Summary Section */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-800">AI-Generated Summary</h2>
          {summaryLoading && (
            <RefreshCw size={16} className="animate-spin text-blue-500" />
          )}
        </div>
        
        {summaryError ? (
          <p className="text-red-500">Could not generate summary: {summaryError}</p>
        ) : (
          <p className="text-gray-700">
            {summaryLoading ? 'Generating summary...' : summary || article.summary}
          </p>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Summary generated using AI. May not capture all details from the original article.</p>
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose max-w-none mb-12">
        {article.content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4">{paragraph}</p>
        ))}
      </div>
      
      {/* Recommendations */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Recommended Articles</h2>
        
        {recommendationsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <Link to={`/article/${rec.id}`} className="block flex-grow">
                  <div className="relative overflow-hidden aspect-video">
                    <img 
                      src={rec.imageUrl} 
                      alt={rec.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span>{rec.source}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">
                      {rec.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {rec.summary}
                    </p>
                    
                    <div className="text-blue-600 text-sm font-medium">
                      Read more
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recommendations available</p>
        )}
      </div>
    </div>
  );
};

export default ArticleDetailView;
