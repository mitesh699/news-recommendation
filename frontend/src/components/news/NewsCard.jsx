import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bookmark, Share2 } from 'lucide-react';

const NewsCard = ({ article, featured = false }) => {
  const { 
    id, 
    title, 
    summary, 
    imageUrl, 
    source, 
    publishedAt, 
    // url is not used locally - using articleUrl instead
    topic,
    readTime
  } = article;
  
  // Ensure we have a valid image URL or use a placeholder
  const displayImageUrl = imageUrl || `https://picsum.photos/800/600?random=${id}`;
  
  // Ensure readTime is always available
  const displayReadTime = readTime || '3 min read';
  
  // Always use internal article links to prevent redirecting to external sites
  const articleUrl = `/article/${id}`;
  // Note: We're using internal links instead of the original URL to prevent external redirects
  
  // Format the publishedAt date if available
  const formattedDate = publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  // Format the published date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Return "Today" if the article was published today
    if (date.toDateString() === now.toDateString()) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `Today at ${formattedHours}:${formattedMinutes} ${period}`;
    }
    
    // Return "Yesterday" if the article was published yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Return the date in Month Day, Year format
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate random bookmark status for demo purposes
  const isBookmarked = React.useMemo(() => Math.random() > 0.7, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // In a real app, this would toggle the bookmark status
    console.log(`Bookmark toggled for article: ${id}`);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // In a real app, this would open a share dialog
    console.log(`Share dialog for article: ${id}`);
  };

  return (
    <article className={`bg-white rounded-lg shadow-md overflow-hidden group transition-all duration-300 hover:shadow-lg ${featured ? 'flex-1' : ''}`}>
      <Link to={articleUrl} className="block h-full">
        <div className="relative overflow-hidden aspect-video">
          <img 
            src={displayImageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              console.log('Image failed to load, using fallback:', id);
              e.target.onerror = null; 
              e.target.src = `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`; 
            }}
          />
          <div className="absolute top-0 left-0 m-3">
            <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded">
              {topic}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{source}</span>
            <span>{formattedDate || formatDate(publishedAt)}</span>
          </div>
          
          <h3 className={`font-bold text-gray-800 mb-2 line-clamp-2 ${featured ? 'text-xl' : 'text-lg'}`}>
            {title}
          </h3>
          
          {(featured || summary) && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {summary}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={14} className="mr-1" />
              <span>{displayReadTime}</span>
            </div>
            
            <div className="flex items-center space-x-2">
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
      </Link>
    </article>
  );
};

export default NewsCard;