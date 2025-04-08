import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Clock, Calendar, Bookmark, Share2, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import NewsCard from '../components/news/NewsCard';
import { isArticleSaved, saveArticle, removeSavedArticle, addToReadingHistory } from '../services/userDataService';

const ArticleView = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(isArticleSaved(id));
  const [readingMode, setReadingMode] = useState('normal'); // 'normal' or 'reader'

  // Fetch article data
  useEffect(() => {
    console.log('ArticleView mounted, fetching article with ID:', id);
    const fetchArticleData = async () => {
      try {
        setIsLoading(true);
        
        // Make an actual API call to fetch the article
        const response = await fetch(`http://localhost:8001/api/news/articles/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }
        
        const articleData = await response.json();
        setArticle(articleData);
        
        // Fetch related articles/recommendations based on this article
        const recResponse = await fetch(`http://localhost:8001/api/news/recommendations?article_id=${id}&max_results=3`);
        if (recResponse.ok) {
          const recommendations = await recResponse.json();
          setRelatedArticles(recommendations);
        }
        
        // Always fetch the summary if we have article URL
        if (articleData.url) {
          try {
            console.log('Fetching summary for URL:', articleData.url);
            const summaryResponse = await fetch(`http://localhost:8001/api/news/summary?url=${encodeURIComponent(articleData.url)}`);
            if (summaryResponse.ok) {
              const summaryText = await summaryResponse.json();
              console.log('Received summary:', summaryText);
              // Update article with summary
              setArticle(prev => ({...prev, summary: summaryText}));
            } else {
              console.error('Error fetching summary:', summaryResponse.statusText);
              // Use the existing summary or extract one from content if available
              if (!articleData.summary && articleData.content) {
                // Extract first paragraph as fallback summary
                const regex = new RegExp('<p>(.*?)</p>', 'i');
                const firstParagraph = articleData.content.match(regex);
                if (firstParagraph && firstParagraph[1]) {
                  setArticle(prev => ({
                    ...prev, 
                    summary: firstParagraph[1].replace(/<[^>]*>/g, '').substring(0, 250) + '...'
                  }));
                }
              }
            }
          } catch (error) {
            console.error('Error fetching summary:', error);
          }
        }
        setIsLoading(false);
        
        // Add this article to reading history if we successfully fetched it
        if (articleData && articleData.id) {
          addToReadingHistory(articleData);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        // For demo, fall back to mock if API fails
        const mockArticle = {
        id,
        title: 'Breakthrough in Renewable Energy Storage Could Accelerate Transition to Clean Power',
        summary: 'Scientists develop new battery technology that promises to solve key limitations in renewable energy storage.',
        content: `
          <p class="lead">A team of researchers from MIT and Stanford University have announced a significant breakthrough in renewable energy storage technology that could help accelerate the global transition to clean energy sources.</p>
          
          <p>The new battery technology, which uses abundant and low-cost materials, can reportedly store renewable energy for longer periods at a fraction of the cost of current solutions. This advancement addresses one of the primary challenges of renewable energy: its intermittent nature.</p>
          
          <p>"The ability to store energy efficiently and release it when needed has been a major bottleneck in renewable energy adoption," said Dr. Sarah Chen, lead researcher on the project. "Our technology could change that equation dramatically."</p>
          
          <h2>How It Works</h2>
          
          <p>The battery uses a novel electrode material derived from organic compounds and modified silicates that can be sourced from common clay. Unlike lithium-ion batteries, which dominate today's storage market, the new technology doesn't rely on rare earth metals or other constrained resources.</p>
          
          <p>According to the research team, the batteries can achieve:</p>
          
          <ul>
            <li>Energy density comparable to state-of-the-art lithium-ion batteries</li>
            <li>Longer cycle life (estimated at over 10,000 charge/discharge cycles)</li>
            <li>Lower production costs (potentially 60-70% less expensive)</li>
            <li>Significantly reduced environmental impact</li>
          </ul>
          
          <p>The technology can be scaled from residential storage applications to grid-scale deployment, making it suitable for a wide range of renewable energy applications.</p>
          
          <h2>Market Impact</h2>
          
          <p>Energy analysts suggest this breakthrough could have far-reaching implications for renewable energy markets worldwide. The cost of energy storage has been a significant factor in slowing the transition away from fossil fuels.</p>
          
          <p>"If this technology can be commercially scaled as projected, it could reduce the levelized cost of renewable energy by 25-30%," said energy economist Dr. Michael Patel, who was not involved in the research. "That would make wind and solar not just competitive with fossil fuels in most markets, but actually cheaper."</p>
          
          <p>The research team is already working with several manufacturing partners to scale up production and expects commercial versions of the technology to be available within 2-3 years.</p>
          
          <h2>Environmental Considerations</h2>
          
          <p>Beyond cost and performance advantages, the new battery technology also promises environmental benefits. The materials used are non-toxic and can be recycled using relatively simple processes.</p>
          
          <p>"We designed this technology with its full lifecycle in mind," explains Dr. Chen. "From sourcing raw materials to manufacturing to end-of-life recycling, we've worked to minimize environmental impact at every stage."</p>
          
          <p>The recycling process can recover up to 90% of the battery materials for reuse, creating the potential for a nearly closed-loop system.</p>
          
          <h2>Next Steps</h2>
          
          <p>While the laboratory results are promising, the researchers acknowledge that moving from lab to commercial production presents challenges. However, they've designed the manufacturing process to use existing production infrastructure, which should accelerate deployment.</p>
          
          <p>The research has received funding from the Department of Energy and several climate-focused venture capital firms. A pilot manufacturing facility is already under construction and expected to begin producing test units by early next year.</p>
          
          <p>If successful at commercial scale, this technology could represent a tipping point for renewable energy adoption and accelerate the transition to a carbon-neutral energy system.</p>
        `,
        imageUrl: '/api/placeholder/1200/600',
        source: 'Science Today',
        sourceUrl: 'https://example.com/science-today',
        publishedAt: '2025-03-26T10:30:00Z',
        author: 'John Anderson',
        topic: 'Technology',
        readTime: '8 min read',
        tags: ['renewable energy', 'battery technology', 'clean energy', 'innovation']
      };

      // Mock related articles
      const mockRelatedArticles = [
        {
          id: 'related1',
          title: 'Global Investment in Clean Energy Reaches Record High',
          summary: 'New report shows unprecedented investment levels in renewable energy technology worldwide.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Financial Review',
          publishedAt: '2025-03-25T14:20:00Z',
          url: '/article/related1',
          topic: 'Business',
          readTime: '5 min read'
        },
        {
          id: 'related2',
          title: 'The Future of Grid-Scale Energy Storage Systems',
          summary: 'Analysis of emerging technologies that could revolutionize how we store and distribute renewable energy.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Tech Insights',
          publishedAt: '2025-03-24T09:15:00Z',
          url: '/article/related2',
          topic: 'Technology',
          readTime: '7 min read'
        },
        {
          id: 'related3',
          title: 'Policy Changes Needed to Accelerate Clean Energy Transition',
          summary: 'Experts outline key regulatory reforms that could speed up adoption of renewable technologies.',
          imageUrl: '/api/placeholder/400/300',
          source: 'Policy Journal',
          publishedAt: '2025-03-23T11:45:00Z',
          url: '/article/related3',
          topic: 'Politics',
          readTime: '6 min read'
        }
      ];

      setArticle(mockArticle);
      setRelatedArticles(mockRelatedArticles);
      setIsLoading(false);
    }
    };
    
    fetchArticleData();
  }, [id]);

  const toggleBookmark = () => {
    if (isBookmarked) {
      // Remove from saved articles
      const result = removeSavedArticle(id);
      if (result.success) {
        setIsBookmarked(false);
      } else {
        console.error('Failed to remove bookmark:', result.message);
      }
    } else {
      // Save the article
      const result = saveArticle(article);
      if (result.success) {
        setIsBookmarked(true);
      } else {
        console.error('Failed to save bookmark:', result.message);
      }
    }
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    console.log('Share article:', id);
  };

  const toggleReadingMode = () => {
    setReadingMode(readingMode === 'normal' ? 'reader' : 'normal');
  };

  // Format the published date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <PageLayout showSidebar={false}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : article ? (
        <div className={`max-w-4xl mx-auto ${readingMode === 'reader' ? 'bg-gray-50 p-8 rounded-lg' : ''}`}>
          {/* Source and actions bar */}
          <div className="flex flex-wrap justify-between items-center mb-6 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="font-medium">{article.source}</span>
              <a 
                href={article.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink size={14} className="ml-1" />
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleReadingMode}
                className="flex items-center px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200"
              >
                {readingMode === 'reader' ? 'Normal Mode' : 'Reader Mode'}
              </button>
              
              <button 
                onClick={toggleBookmark}
                className={`flex items-center ${isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark article"}
              >
                <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
              
              <button 
                onClick={handleShare}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Share article"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
          
          {/* Title and metadata */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center text-gray-500 mb-6 text-sm">
            <div className="flex items-center mr-6 mb-2 md:mb-0">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            
            <div className="flex items-center mr-6 mb-2 md:mb-0">
              <Clock size={16} className="mr-2" />
              <span>{article.readTime}</span>
            </div>
            
            <div className="mr-6 mb-2 md:mb-0">
              <span>By {article.author}</span>
            </div>
            
            <div>
              <Link to={`/topic/${article.topic.toLowerCase()}`} className="text-blue-600 hover:underline">
                {article.topic}
              </Link>
            </div>
          </div>
          
          {/* Featured image */}
          <div className="mb-8">
            <img 
              src={article.imageUrl || `https://picsum.photos/1200/600?random=${article.id}`} 
              alt={article.title}
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                console.log('Image failed to load in article view, using fallback');
                e.target.onerror = null; 
                e.target.src = `https://picsum.photos/1200/600?random=${Math.floor(Math.random() * 1000)}`; 
              }}
            />
          </div>
          
          {/* TLDR Summary Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-blue-900">TLDR Summary</h2>
              {article.url && !article.url.includes('example.com') ? (
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-700 hover:text-blue-900 font-medium"
                >
                  <span className="mr-2">Read Full Article</span>
                  <ExternalLink size={18} />
                </a>
              ) : (
                <button 
                  className="flex items-center text-gray-400 cursor-not-allowed font-medium"
                  onClick={() => alert('Full article not available')}
                  disabled
                >
                  <span className="mr-2">Read Full Article</span>
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
            <p className="text-lg text-gray-800">{article.summary}</p>
            <div className="mt-4 text-sm text-gray-600">
              Source: {article.source}
            </div>
          </div>
          
          {/* Article content */}
          <div 
            className={`prose max-w-none ${readingMode === 'reader' ? 'prose-lg' : ''}`}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {article.tags.map((tag, index) => (
                <Link 
                  key={index}
                  to={`/tag/${tag.replace(' ', '-')}`}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Reader feedback */}
          <div className="flex items-center justify-center border-t border-b border-gray-200 my-8 py-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">Was this article helpful?</p>
              <div className="flex items-center justify-center space-x-6">
                <button className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                  <ThumbsUp size={24} className="mb-1" />
                  <span className="text-sm">Yes</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-red-600">
                  <ThumbsDown size={24} className="mb-1" />
                  <span className="text-sm">No</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Related articles */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <NewsCard 
                  key={relatedArticle.id}
                  article={relatedArticle}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Article not found</h2>
          <p className="text-gray-600 mb-6">
            The article you're looking for might have been removed or doesn't exist.
          </p>
          <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      )}
    </PageLayout>
  );
};

export default ArticleView;