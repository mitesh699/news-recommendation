import os
import json
from typing import List, Optional, Dict, Any
import requests
from datetime import datetime, timedelta
import random
import logging
import aiohttp
import asyncio
from newsapi import NewsApiClient

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Keys from environment variables
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', '')
GNEWS_API_KEY = os.environ.get('GNEWS_API_KEY', '')
NEWYORK_TIMES_API_KEY = os.environ.get('NYT_API_KEY', '')

# Initialize clients
newsapi = NewsApiClient(api_key=NEWS_API_KEY) if NEWS_API_KEY else None

# Topics/categories for filtering
NEWS_CATEGORIES = [
    'business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'
]

# Track API usage and limits
api_usage = {
    'newsapi': {'calls': 0, 'limit': 100},  # Free tier: 100 requests/day
    'gnews': {'calls': 0, 'limit': 100},     # Free tier varies
    'nytimes': {'calls': 0, 'limit': 500},   # Free tier: 500 requests/day
    'duckduckgo': {'calls': 0, 'limit': 100}  # Estimated reasonable limit
}

# Generate read time based on content length
def get_read_time(content_length):
    # Average reading speed: 200-250 words per minute
    # Assuming an average word length of 5 characters (plus a space)
    words = content_length / 6
    minutes = round(words / 225)  # Using 225 words per minute as average
    
    # Ensure at least 1 minute
    minutes = max(1, minutes)
    
    return f"{minutes} min read"

async def fetch_from_duckduckgo(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Fetch news using DuckDuckGo search (no API key required)"""
    # Update API usage tracking
    api_usage['duckduckgo']['calls'] += 1
    
    try:
        url = "https://duckduckgo.com/"
        params = {
            'q': f"{query} news",
            'format': 'json',
            'no_html': '1',
            'skip_disambig': '1',
        }
        
        # First request to get token
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"DuckDuckGo search failed: {response.status}")
                    return []
            
            # Now fetch news results
            news_url = "https://duckduckgo.com/news.js"
            news_params = {
                'q': query,
                'o': 'json',
            }
            
            async with session.get(news_url, params=news_params) as news_response:
                if news_response.status != 200:
                    logger.warning(f"DuckDuckGo news search failed: {news_response.status}")
                    return []
                
                data = await news_response.json()
                articles = []
                
                for item in data.get('results', [])[:max_results]:
                    # Generate a unique ID
                    article_id = str(hash(item.get('url', '')))[:10]
                    
                    # Create article object
                    article = {
                        'id': article_id,
                        'title': item.get('title', 'No Title'),
                        'url': item.get('url', ''),
                        'source': item.get('source', 'DuckDuckGo'),
                        'publishedAt': item.get('date', datetime.now().isoformat()),
                        'imageUrl': item.get('image', 'https://via.placeholder.com/720x480?text=No+Image'),
                        'summary': item.get('excerpt', ''),
                        'topic': random.choice(NEWS_CATEGORIES),  # Would need NLP classification
                        'readTime': get_read_time(len(item.get('excerpt', '')))
                    }
                    articles.append(article)
                    
                return articles
    except Exception as e:
        logger.error(f"Error fetching news from DuckDuckGo: {e}")
        return []

async def fetch_from_gnews(query: str = None, category: str = None, max_results: int = 10, is_headline: bool = False) -> List[Dict[str, Any]]:
    """Fetch news from GNews API
    
    Args:
        query: Search keywords (for search endpoint)
        category: Category filter (for top-headlines endpoint)
        max_results: Maximum number of results
        is_headline: Whether to use top-headlines endpoint instead of search
    """
    if not GNEWS_API_KEY:
        return []
        
    # Update API usage tracking
    api_usage['gnews']['calls'] += 1
    
    try:
        # Select the appropriate endpoint based on the is_headline flag
        if is_headline:
            url = "https://gnews.io/api/v4/top-headlines"
            params = {
                'apikey': GNEWS_API_KEY,
                'lang': 'en',
                'max': max_results
            }
            
            # Add category if provided (GNews uses different category names, map them)
            if category:
                # Map our categories to GNews categories if needed
                gnews_category = category
                if category == 'general':
                    gnews_category = 'general'
                elif category == 'business':
                    gnews_category = 'business'
                elif category == 'entertainment':
                    gnews_category = 'entertainment'
                elif category == 'health':
                    gnews_category = 'health'
                elif category == 'science':
                    gnews_category = 'science'
                elif category == 'sports':
                    gnews_category = 'sports'
                elif category == 'technology':
                    gnews_category = 'technology'
                    
                params['category'] = gnews_category
        else:
            url = "https://gnews.io/api/v4/search"
            params = {
                'q': query or 'news',  # Default to general news
                'apikey': GNEWS_API_KEY,
                'lang': 'en',
                'max': max_results
            }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"GNews API request failed: {response.status}")
                    return []
                    
                data = await response.json()
                articles = []
                
                for item in data.get('articles', [])[:max_results]:
                    # Generate a unique ID
                    article_id = str(hash(item.get('url', '')))[:10]
                    
                    # Create article object
                    article = {
                        'id': article_id,
                        'title': item.get('title', 'No Title'),
                        'url': item.get('url', ''),
                        'source': item.get('source', {}).get('name', 'GNews'),
                        'publishedAt': item.get('publishedAt', datetime.now().isoformat()),
                        'imageUrl': item.get('image', 'https://via.placeholder.com/720x480?text=No+Image'),
                        'summary': item.get('description', ''),
                        'topic': random.choice(NEWS_CATEGORIES),  # Would need NLP classification
                        'readTime': get_read_time(len(item.get('content', '')))
                    }
                    articles.append(article)
                    
                return articles
    except Exception as e:
        logger.error(f"Error fetching news from GNews: {e}")
        return []

async def fetch_from_nytimes(query: str = None, section: str = None, filter_query: str = None, max_results: int = 10, is_top_stories: bool = False) -> List[Dict[str, Any]]:
    """Fetch news from New York Times API
    
    Args:
        query: Search keywords for article search
        section: Section for top stories (arts, business, world, etc.)
        filter_query: Additional filter query (fq parameter)
        max_results: Maximum number of results to return
        is_top_stories: Whether to use top-stories endpoint instead of article search
    """
    if not NEWYORK_TIMES_API_KEY:
        return []
        
    # Update API usage tracking
    api_usage['nytimes']['calls'] += 1
    
    try:
        if is_top_stories:
            # Use Top Stories API - for current trending content by section
            section = section or 'home'  # Default to home section if none specified
            valid_sections = ['arts', 'automobiles', 'books', 'business', 'fashion', 'food', 
                            'health', 'home', 'insider', 'magazine', 'movies', 'nyregion', 
                            'obituaries', 'opinion', 'politics', 'realestate', 'science', 
                            'sports', 'sundayreview', 'technology', 'theater', 't-magazine', 
                            'travel', 'upshot', 'us', 'world']
            
            # Fall back to 'home' if specified section isn't valid
            if section.lower() not in valid_sections:
                logger.warning(f"Invalid NYT section: {section}, falling back to 'home'")
                section = 'home'
                
            url = f"https://api.nytimes.com/svc/topstories/v2/{section.lower()}.json"
            params = {
                'api-key': NEWYORK_TIMES_API_KEY
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"NYTimes Top Stories API request failed: {response.status}")
                        return []
                        
                    data = await response.json()
                    articles = []
                    
                    for item in data.get('results', [])[:max_results]:
                        # Generate a unique ID
                        article_id = str(hash(item.get('url', '')))[:10]
                        
                        # Get image URL if available
                        image_url = 'https://via.placeholder.com/720x480?text=NYTimes'
                        if item.get('multimedia') and len(item.get('multimedia')) > 0:
                            # The API now provides 'default' and 'thumbnail' crops
                            for media in item.get('multimedia'):
                                if media.get('format') == 'default':
                                    image_url = media.get('url')
                                    break
                        
                        # Create article object
                        article = {
                            'id': article_id,
                            'title': item.get('title', 'No Title'),
                            'url': item.get('url', ''),
                            'source': 'The New York Times',
                            'publishedAt': item.get('published_date', datetime.now().isoformat()),
                            'imageUrl': image_url,
                            'summary': item.get('abstract', ''),
                            'topic': item.get('section', '').lower() if item.get('section') else item.get('subsection', '').lower() or section.lower(),
                            'readTime': get_read_time(len(item.get('abstract', '') or '') * 3)  # Estimate based on abstract length
                        }
                        articles.append(article)
                        
                    return articles
        else:
            # Use Article Search API - for specific keyword searches
            url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
            params = {
                'api-key': NEWYORK_TIMES_API_KEY,
                'sort': 'newest'
            }
            
            # Add query if provided
            if query:
                params['q'] = query
                
            # Add filter query if provided
            if filter_query:
                params['fq'] = filter_query
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"NYTimes Article Search API request failed: {response.status}")
                        return []
                        
                    data = await response.json()
                    articles = []
                    
                    for item in data.get('response', {}).get('docs', [])[:max_results]:
                        # Generate a unique ID
                        article_id = str(hash(item.get('uri', '')))[:10]
                        
                        # Get image URL if available - API changed on April 8, 2025
                        image_url = 'https://via.placeholder.com/720x480?text=NYTimes'
                        if item.get('multimedia') and len(item.get('multimedia')) > 0:
                            for media in item.get('multimedia'):
                                if media.get('type') == 'image':
                                    # The multimedia array is now simplified with only 'default' and 'thumbnail' crops
                                    image_url = f"https://static01.nyt.com/{media.get('url')}"
                                    break
                        
                        # Get headline based on available fields
                        headline = item.get('headline', {})
                        title = headline.get('main', headline.get('default', headline.get('seo', 'No Title')))
                        
                        # Create article object
                        article = {
                            'id': article_id,
                            'title': title,
                            'url': item.get('web_url', ''),
                            'source': item.get('source', {}).get('vernacular', 'The New York Times'),
                            'publishedAt': item.get('firstPublished', item.get('pub_date', datetime.now().isoformat())),
                            'imageUrl': image_url,
                            'summary': item.get('abstract', item.get('summary', '')),
                            'topic': item.get('section', {}).get('displayName', '').lower() if item.get('section') else 
                                     random.choice(NEWS_CATEGORIES),
                            'readTime': get_read_time(item.get('Article', {}).get('wordCount', 500))
                        }
                        articles.append(article)
                        
                    return articles
    except Exception as e:
        logger.error(f"Error fetching news from NYTimes: {e}")
        return []

async def fetch_from_newsapi(query: str = None, category: str = None, page: int = 1, page_size: int = 10, is_headline: bool = False) -> Dict[str, Any]:
    """Fetch news from NewsAPI
    
    Args:
        query: Search keywords (for everything endpoint)
        category: Category filter (for top-headlines endpoint)
        page: Page number
        page_size: Number of results per page
        is_headline: Whether to use top-headlines endpoint instead of everything
    """
    if not newsapi:
        return {'articles': [], 'totalResults': 0}
    
    # Update API usage tracking
    api_usage['newsapi']['calls'] += 1
    
    try:
        # Choose endpoint based on parameter
        if is_headline:
            # Use top-headlines endpoint - good for breaking news
            params = {
                'language': 'en',
                'page': page,
                'pageSize': page_size
            }
            
            # Add category if provided
            if category and category in NEWS_CATEGORIES:
                params['category'] = category
                
            # Add query if provided
            if query:
                params['q'] = query
                
            response = newsapi.get_top_headlines(**params)
        else:
            # Use everything endpoint - good for search
            # Calculate dates for the query (last 7 days)
            to_date = datetime.now().strftime('%Y-%m-%d')
            from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            
            # Make request to NewsAPI
            response = newsapi.get_everything(
                q=query or 'news',  # Default to general news if no query
                from_param=from_date,
                to=to_date,
                language='en',
                sort_by='relevancy',
                page=page,
                page_size=page_size
            )
        
        # Transform the response to our model format
        articles = []
        for item in response.get('articles', []):
            # Generate a unique ID
            article_id = str(hash(item.get('url', '')))[:10]
            
            # Create article object
            article = {
                'id': article_id,
                'title': item.get('title', 'No Title'),
                'url': item.get('url', ''),
                'source': item.get('source', {}).get('name', 'NewsAPI'),
                'publishedAt': item.get('publishedAt', datetime.now().isoformat()),
                'imageUrl': item.get('urlToImage') or 'https://via.placeholder.com/720x480?text=No+Image',
                'summary': item.get('description', ''),
                'topic': random.choice(NEWS_CATEGORIES),  # Would need NLP classification
                'readTime': get_read_time(len(item.get('content', '') or ''))
            }
            articles.append(article)
        
        return {
            'articles': articles,
            'totalResults': response.get('totalResults', 0)
        }
    except Exception as e:
        logger.error(f"Error fetching news from NewsAPI: {e}")
        return {'articles': [], 'totalResults': 0}

async def fetch_news_by_query(query: str, page: int = 1, page_size: int = 10):
    """Fetch news articles based on a search query with intelligent fallback"""
    # Try services in order of preference with fallback
    results = []
    total_results = 0
    
    # Check if we've hit API limits, if so, skip that API
    use_newsapi = api_usage['newsapi']['calls'] < api_usage['newsapi']['limit']
    use_gnews = api_usage['gnews']['calls'] < api_usage['gnews']['limit']
    use_nytimes = api_usage['nytimes']['calls'] < api_usage['nytimes']['limit']
    use_duckduckgo = api_usage['duckduckgo']['calls'] < api_usage['duckduckgo']['limit']
    
    # Start with NewsAPI (usually most comprehensive)
    if use_newsapi and newsapi:
        news_data = await fetch_from_newsapi(query, page, page_size)
        results.extend(news_data.get('articles', []))
        total_results = news_data.get('totalResults', 0)
    
    # If we don't have enough results, try GNews
    if len(results) < page_size and use_gnews and GNEWS_API_KEY:
        gnews_articles = await fetch_from_gnews(query, page_size - len(results))
        results.extend(gnews_articles)
        total_results += len(gnews_articles)
    
    # If still not enough, try NYTimes
    if len(results) < page_size and use_nytimes and NEWYORK_TIMES_API_KEY:
        nyt_articles = await fetch_from_nytimes(query, page_size - len(results))
        results.extend(nyt_articles)
        total_results += len(nyt_articles)
    
    # If still not enough, try DuckDuckGo (no API key required)
    if len(results) < page_size and use_duckduckgo:
        ddg_articles = await fetch_from_duckduckgo(query, page_size - len(results))
        results.extend(ddg_articles)
        total_results += len(ddg_articles)
    
    # If we have no results at all, use demo news as final fallback
    if not results:
        logger.warning(f"All news sources failed or reached limits, using demo data")
        demo_data = await get_demo_news(query=query, page=page, page_size=page_size)
        return demo_data
    
    # Apply pagination (we already asked each source for the right amount, but combining may exceed)
    start_idx = 0  # We're handling pagination at the source level
    end_idx = min(page_size, len(results))
    paginated_results = results[start_idx:end_idx]
    
    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for article in paginated_results:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_results.append(article)
    
    return {
        'articles': unique_results,
        'totalResults': total_results,
        'page': page,
        'pageSize': page_size
    }

async def fetch_trending_from_newsapi(category: Optional[str] = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """Fetch trending news from NewsAPI"""
    if not newsapi:
        return {'articles': [], 'totalResults': 0}
    
    # Update API usage tracking
    api_usage['newsapi']['calls'] += 1
    
    try:
        # Make request to NewsAPI
        if category and category.lower() in NEWS_CATEGORIES:
            response = newsapi.get_top_headlines(
                category=category.lower(),
                language='en',
                page=page,
                page_size=page_size
            )
        else:
            response = newsapi.get_top_headlines(
                language='en',
                page=page,
                page_size=page_size
            )
        
        # Transform the response to our model format
        articles = []
        for item in response.get('articles', []):
            # Generate a unique ID
            article_id = str(hash(item.get('url', '')))[:10]
            
            # Create article object
            article = {
                'id': article_id,
                'title': item.get('title', 'No Title'),
                'url': item.get('url', ''),
                'source': item.get('source', {}).get('name', 'NewsAPI'),
                'publishedAt': item.get('publishedAt', datetime.now().isoformat()),
                'imageUrl': item.get('urlToImage') or 'https://via.placeholder.com/720x480?text=No+Image',
                'summary': item.get('description', ''),
                'topic': category.lower() if category else random.choice(NEWS_CATEGORIES),
                'readTime': get_read_time(len(item.get('content', '') or ''))
            }
            articles.append(article)
        
        return {
            'articles': articles,
            'totalResults': response.get('totalResults', 0)
        }
    except Exception as e:
        logger.error(f"Error fetching trending news from NewsAPI: {e}")
        return {'articles': [], 'totalResults': 0}

async def fetch_trending_from_gnews(category: Optional[str] = None, max_results: int = 10) -> List[Dict[str, Any]]:
    """Fetch trending news from GNews API"""
    if not GNEWS_API_KEY:
        return []
    
    # Update API usage tracking
    api_usage['gnews']['calls'] += 1
    
    try:
        url = "https://gnews.io/api/v4/top-headlines"
        params = {
            'token': GNEWS_API_KEY,
            'lang': 'en',
            'max': max_results
        }
        
        # Add category if provided
        if category and category.lower() in NEWS_CATEGORIES:
            params['topic'] = category.lower()
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"GNews API request failed: {response.status}")
                    return []
                    
                data = await response.json()
                articles = []
                
                for item in data.get('articles', [])[:max_results]:
                    # Generate a unique ID
                    article_id = str(hash(item.get('url', '')))[:10]
                    
                    # Create article object
                    article = {
                        'id': article_id,
                        'title': item.get('title', 'No Title'),
                        'url': item.get('url', ''),
                        'source': item.get('source', {}).get('name', 'GNews'),
                        'publishedAt': item.get('publishedAt', datetime.now().isoformat()),
                        'imageUrl': item.get('image', 'https://via.placeholder.com/720x480?text=No+Image'),
                        'summary': item.get('description', ''),
                        'topic': category.lower() if category else random.choice(NEWS_CATEGORIES),
                        'readTime': get_read_time(len(item.get('content', '')))
                    }
                    articles.append(article)
                    
                return articles
    except Exception as e:
        logger.error(f"Error fetching trending news from GNews: {e}")
        return []

async def fetch_trending_from_nytimes(category: Optional[str] = None, max_results: int = 10) -> List[Dict[str, Any]]:
    """Fetch trending news from New York Times API"""
    if not NEWYORK_TIMES_API_KEY:
        return []
    
    # Update API usage tracking
    api_usage['nytimes']['calls'] += 1
    
    try:
        # NYT uses sections rather than categories
        section = None
        if category:
            # Map our categories to NYT sections
            category_to_section = {
                'business': 'business',
                'entertainment': 'arts',
                'general': 'home',
                'health': 'health',
                'science': 'science',
                'sports': 'sports',
                'technology': 'technology'
            }
            section = category_to_section.get(category.lower(), 'home')
        else:
            section = 'home'  # Default to home section
        
        url = f"https://api.nytimes.com/svc/topstories/v2/{section}.json"
        params = {
            'api-key': NEWYORK_TIMES_API_KEY
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"NYTimes API request failed: {response.status}")
                    return []
                    
                data = await response.json()
                articles = []
                
                for item in data.get('results', [])[:max_results]:
                    # Generate a unique ID
                    article_id = str(hash(item.get('url', '')))[:10]
                    
                    # Get image URL if available
                    image_url = 'https://via.placeholder.com/720x480?text=NYTimes'
                    if item.get('multimedia') and len(item.get('multimedia')) > 0:
                        for media in item.get('multimedia'):
                            if media.get('format') == 'mediumThreeByTwo440':
                                image_url = media.get('url', '')
                                break
                    
                    # Create article object
                    article = {
                        'id': article_id,
                        'title': item.get('title', 'No Title'),
                        'url': item.get('url', ''),
                        'source': 'The New York Times',
                        'publishedAt': item.get('published_date', datetime.now().isoformat()),
                        'imageUrl': image_url,
                        'summary': item.get('abstract', ''),
                        'topic': category.lower() if category else section,
                        'readTime': get_read_time(len(item.get('abstract', '') or ''))
                    }
                    articles.append(article)
                    
                return articles
    except Exception as e:
        logger.error(f"Error fetching trending news from NYTimes: {e}")
        return []

async def fetch_trending_news(category: Optional[str] = None, page: int = 1, page_size: int = 10):
    """Fetch trending news articles with intelligent fallback between multiple sources"""
    # Try services in order of preference with fallback
    results = []
    total_results = 0
    
    # Check if we've hit API limits, if so, skip that API
    use_newsapi = api_usage['newsapi']['calls'] < api_usage['newsapi']['limit']
    use_gnews = api_usage['gnews']['calls'] < api_usage['gnews']['limit']
    use_nytimes = api_usage['nytimes']['calls'] < api_usage['nytimes']['limit']
    
    # Start with NewsAPI (usually most comprehensive for trends)
    if use_newsapi and newsapi:
        news_data = await fetch_trending_from_newsapi(category, page, page_size)
        results.extend(news_data.get('articles', []))
        total_results = news_data.get('totalResults', 0)
    
    # If we don't have enough results, try GNews
    if len(results) < page_size and use_gnews and GNEWS_API_KEY:
        gnews_articles = await fetch_trending_from_gnews(category, page_size - len(results))
        results.extend(gnews_articles)
        total_results += len(gnews_articles)
    
    # If still not enough, try NYTimes Top Stories API
    if len(results) < page_size and use_nytimes and NEWYORK_TIMES_API_KEY:
        # Map our category to a NYT section if possible
        nyt_section = 'home'  # Default to home
        if category:
            # Basic mapping from our categories to NYT sections
            if category == 'business':
                nyt_section = 'business'
            elif category == 'technology':
                nyt_section = 'technology'
            elif category == 'entertainment':
                nyt_section = 'arts'
            elif category == 'sports':
                nyt_section = 'sports'
            elif category == 'science':
                nyt_section = 'science'
            elif category == 'health':
                nyt_section = 'health'
                
        logger.info(f"Fetching trending news from NYT Top Stories API with section={nyt_section}")
        nyt_articles = await fetch_from_nytimes(
            section=nyt_section,
            max_results=page_size - len(results),
            is_top_stories=True  # Use the Top Stories API
        )
        results.extend(nyt_articles)
        total_results += len(nyt_articles)
    
    # If we have no results at all, use demo news as final fallback
    if not results:
        logger.warning(f"All trending news sources failed or reached limits, using demo data")
        demo_data = await get_demo_news(category=category, page=page, page_size=page_size)
        return demo_data
    
    # Apply pagination (we already asked each source for the right amount, but combining may exceed)
    start_idx = 0  # We're handling pagination at the source level
    end_idx = min(page_size, len(results))
    paginated_results = results[start_idx:end_idx]
    
    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for article in paginated_results:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_results.append(article)
    
    # Return formatted response
    return {
        'articles': unique_results,
        'totalResults': total_results,
        'page': page,
        'pageSize': page_size
    }

async def get_demo_news(query: Optional[str] = None, category: Optional[str] = None, page: int = 1, page_size: int = 10):
    """Generate demo news data for development when API key is not available"""
    # Create demo articles
    demo_articles = [
        {
            'id': '1001',
            'title': 'AI Breakthrough: New Model Achieves Human-Level Understanding',
            'url': 'https://example.com/ai-breakthrough',
            'source': 'Tech Daily',
            'publishedAt': datetime.now().isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=AI+Breakthrough',
            'summary': 'Researchers have developed a new AI model that achieves unprecedented levels of language understanding and reasoning, potentially revolutionizing how machines learn from data.',
            'topic': 'technology',
            'readTime': '4 min read'
        },
        {
            'id': '1002',
            'title': 'Global Climate Summit Reaches Historic Agreement',
            'url': 'https://example.com/climate-summit',
            'source': 'World News',
            'publishedAt': (datetime.now() - timedelta(hours=5)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Climate+Summit',
            'summary': 'Leaders from 195 countries have agreed to accelerate carbon emission reduction targets, pledging to cut emissions by 50% by 2030 compared to 2005 levels.',
            'topic': 'science',
            'readTime': '6 min read'
        },
        {
            'id': '1003',
            'title': 'New Study Reveals Benefits of Mediterranean Diet',
            'url': 'https://example.com/med-diet-study',
            'source': 'Health Reports',
            'publishedAt': (datetime.now() - timedelta(days=1)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Mediterranean+Diet',
            'summary': 'A comprehensive 10-year study confirms that adhering to a Mediterranean diet can significantly reduce the risk of heart disease and improve longevity.',
            'topic': 'health',
            'readTime': '3 min read'
        },
        {
            'id': '1004',
            'title': 'Space Tourism Company Announces First Civilian Mission to Mars',
            'url': 'https://example.com/mars-tourism',
            'source': 'Space Frontier',
            'publishedAt': (datetime.now() - timedelta(days=2)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Mars+Mission',
            'summary': 'A leading space tourism company has unveiled plans for the first civilian mission to Mars, scheduled for 2028, with tickets priced at $50 million per person.',
            'topic': 'science',
            'readTime': '5 min read'
        },
        {
            'id': '1005',
            'title': 'Major Cybersecurity Breach Affects Millions',
            'url': 'https://example.com/cyber-breach',
            'source': 'Tech Security',
            'publishedAt': (datetime.now() - timedelta(hours=12)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Cybersecurity',
            'summary': 'A sophisticated cyber attack has compromised personal data of over 10 million users across multiple platforms, raising concerns about digital security measures.',
            'topic': 'technology',
            'readTime': '4 min read'
        },
        {
            'id': '1006',
            'title': 'Renewable Energy Surpasses Fossil Fuels for First Time',
            'url': 'https://example.com/renewable-milestone',
            'source': 'Energy Today',
            'publishedAt': (datetime.now() - timedelta(days=3)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Renewable+Energy',
            'summary': 'In a historic shift, renewable energy sources have generated more electricity than fossil fuels globally for the first time, marking a significant milestone in the transition to clean energy.',
            'topic': 'science',
            'readTime': '5 min read'
        },
        {
            'id': '1007',
            'title': 'Major Sports League Announces Expansion Teams',
            'url': 'https://example.com/sports-expansion',
            'source': 'Sports Network',
            'publishedAt': (datetime.now() - timedelta(days=1, hours=8)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Sports+League',
            'summary': 'A major professional sports league has announced three new expansion teams to begin play in the 2025 season, bringing the total number of franchises to 35.',
            'topic': 'sports',
            'readTime': '3 min read'
        },
        {
            'id': '1008',
            'title': 'New Breakthrough in Quantum Computing Announced',
            'url': 'https://example.com/quantum-breakthrough',
            'source': 'Science Daily',
            'publishedAt': (datetime.now() - timedelta(hours=18)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Quantum+Computing',
            'summary': 'Scientists have achieved a new milestone in quantum computing, demonstrating a 1000-qubit processor capable of solving complex problems that would take classical computers millennia.',
            'topic': 'technology',
            'readTime': '6 min read'
        },
        {
            'id': '1009',
            'title': 'Global Economic Forecast Shows Strong Recovery',
            'url': 'https://example.com/economic-forecast',
            'source': 'Financial Times',
            'publishedAt': (datetime.now() - timedelta(days=4)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Economic+Forecast',
            'summary': 'Leading economists predict a robust global economic recovery in the coming year, with growth rates expected to exceed pre-pandemic levels in most developed nations.',
            'topic': 'business',
            'readTime': '4 min read'
        },
        {
            'id': '1010',
            'title': 'Archaeologists Discover Ancient Lost City',
            'url': 'https://example.com/archaeological-discovery',
            'source': 'History Channel',
            'publishedAt': (datetime.now() - timedelta(days=5)).isoformat(),
            'imageUrl': 'https://via.placeholder.com/720x480?text=Archaeological+Discovery',
            'summary': 'An international team of archaeologists has uncovered the ruins of a previously unknown ancient city dating back over 4,000 years, potentially rewriting our understanding of early civilization.',
            'topic': 'general',
            'readTime': '5 min read'
        }
    ]
    
    # Filter by query if provided
    filtered_articles = demo_articles
    if query:
        query = query.lower()
        filtered_articles = [article for article in demo_articles 
                           if query in article['title'].lower() or 
                           query in article['summary'].lower()]
    
    # Filter by category if provided
    if category:
        category = category.lower()
        filtered_articles = [article for article in filtered_articles 
                           if article['topic'].lower() == category]
    
    # Apply pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_articles = filtered_articles[start_idx:end_idx]
    
    # Return in the same format as the API
    return {
        'articles': paginated_articles,
        'totalResults': len(filtered_articles),
        'page': page,
        'pageSize': page_size
    }
