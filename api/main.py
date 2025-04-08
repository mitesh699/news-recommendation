from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import requests
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
import pytz
from newsapi import NewsApiClient

# Local imports
try:
    # Try absolute imports first (when running as a package)
    from api.services.summarization import get_article_summary
    from api.services.recommendation import get_recommendations
    from api.services.news_fetcher import fetch_news_by_query, fetch_trending_news
    from api.models.news import NewsArticle, NewsResponse
    from api.db.cache import get_cache, set_cache
except ModuleNotFoundError:
    # Fall back to relative imports when running directly
    from services.summarization import get_article_summary
    from services.recommendation import get_recommendations
    from services.news_fetcher import fetch_news_by_query, fetch_trending_news
    from models.news import NewsArticle, NewsResponse
    from db.cache import get_cache, set_cache

app = FastAPI(
    title="News Recommendation API",
    description="API for serving AI-powered news recommendations and summaries",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/")
async def read_root():
    return {"message": "Welcome to the News Recommendation API"}

@app.get("/api/news/search", response_model=NewsResponse)
async def search_news(query: str, page: int = 1, page_size: int = 10):
    """Search for news articles based on a query"""
    # Try to get from cache first
    cache_key = f"search:{query}:{page}:{page_size}"
    cached_result = await get_cache(cache_key)
    if cached_result:
        return cached_result
    
    # Fetch from newsapi if not in cache
    try:
        result = await fetch_news_by_query(query, page, page_size)
        
        # Add to cache (expires in 15 minutes)
        await set_cache(cache_key, result, expire=900)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/trending", response_model=NewsResponse)
async def trending_news(category: Optional[str] = None, page: int = 1, page_size: int = 10):
    """Fetch trending news articles, optionally filtered by category"""
    # Try to get from cache first
    cache_key = f"trending:{category or 'all'}:{page}:{page_size}"
    cached_result = await get_cache(cache_key)
    if cached_result:
        return cached_result
    
    # Fetch from newsapi if not in cache
    try:
        result = await fetch_trending_news(category, page, page_size)
        
        # Add to cache (expires in 15 minutes)
        await set_cache(cache_key, result, expire=900)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/summary", response_model=str)
async def get_summary(url: str):
    """Generate a summary for a news article"""
    # Try to get from cache first
    cache_key = f"summary:{url}"
    cached_result = await get_cache(cache_key)
    if cached_result:
        return cached_result
    
    try:
        summary = await get_article_summary(url)
        
        # Add to cache (expires in 1 day)
        await set_cache(cache_key, summary, expire=86400)
        
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecommendationRequest(BaseModel):
    article_id: Optional[str] = None
    user_id: Optional[str] = None
    user_interests: Optional[List[str]] = None
    algorithm: str = 'hybrid'
    max_results: int = 5

@app.get("/api/news/recommendations", response_model=List[NewsArticle])
async def get_news_recommendations(
    article_id: Optional[str] = None,
    user_id: Optional[str] = None, 
    user_interests: Optional[List[str]] = Query(None),
    algorithm: str = 'hybrid',
    max_results: int = 5
):
    """Get news article recommendations based on article ID, user ID, or user interests"""
    if not article_id and not user_id and not user_interests:
        raise HTTPException(status_code=400, detail="Either article_id, user_id, or user_interests must be provided")
    
    try:
        # Use the updated recommendation service with Supabase and Upstash
        recommendations = await get_recommendations(
            article_id=article_id,
            user_id=user_id,
            user_interests=user_interests,
            algorithm=algorithm,
            max_results=max_results
        )
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/news/recommendations", response_model=List[NewsArticle])
async def post_news_recommendations(request: RecommendationRequest):
    """Get news article recommendations (POST method for more complex requests)"""
    if not request.article_id and not request.user_id and not request.user_interests:
        raise HTTPException(status_code=400, detail="Either article_id, user_id, or user_interests must be provided")
    
    try:
        # Use the updated recommendation service with Supabase and Upstash
        recommendations = await get_recommendations(
            article_id=request.article_id,
            user_id=request.user_id,
            user_interests=request.user_interests,
            algorithm=request.algorithm,
            max_results=request.max_results
        )
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User interaction model
class UserInteractionModel(BaseModel):
    user_id: str
    article_id: str
    interaction_type: str = 'read'  # read, like, share, click, etc.
    time_spent: Optional[float] = None  # seconds spent on article
    scroll_percentage: Optional[float] = None  # how far user scrolled (0-100)
    source_page: Optional[str] = None  # where the interaction came from

@app.post("/api/user/interaction")
async def record_interaction(interaction: UserInteractionModel):
    """Record a user's interaction with an article"""
    try:
        # Import here to avoid circular imports
        from api.services.recommendation import record_user_interaction
        
        success = await record_user_interaction(
            user_id=interaction.user_id,
            article_id=interaction.article_id,
            interaction_type=interaction.interaction_type,
            time_spent=interaction.time_spent,
            scroll_percentage=interaction.scroll_percentage,
            source_page=interaction.source_page
        )
        
        if success:
            return {"status": "success", "message": "User interaction recorded"}
        else:
            raise HTTPException(status_code=500, detail="Failed to record interaction")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/db/init")
async def initialize_database():
    """Initialize the database schema"""
    try:
        # Import here to avoid circular imports
        from api.db.init_db import init_db
        
        await init_db()
        return {"status": "success", "message": "Database initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/articles/{article_id}", response_model=NewsArticle)
async def get_article_by_id(article_id: str):
    """Get a specific news article by its ID"""
    try:
        # Try to get from cache first
        cache_key = f"article:{article_id}"
        cached_result = await get_cache(cache_key)
        if cached_result:
            return cached_result
        
        try:
            # Import here to avoid circular imports
            from api.db.database import get_article_by_id
            
            # Try to fetch from database
            article = await get_article_by_id(article_id)
            if article:
                # Add to cache (expires in 1 hour)
                await set_cache(cache_key, article, expire=3600)
                return article
        except Exception as db_error:
            logger.warning(f"Database error when fetching article: {db_error}")
            # Continue to fallback mock data
                
        # For demo purposes, try to find this article in trending results
        try:
            trending_result = await fetch_trending_news(None, 1, 30)  # Larger page size to increase chances
            for article in trending_result.articles:
                if article.id == article_id:
                    # Add more detailed content for the article view
                    article.content = f"<p class=\"lead\">This is a detailed view of '{article.title}'.</p>\n\n<p>{article.summary}</p>\n\n<h2>Background</h2>\n<p>This article from {article.source} provides important information on this topic. The full article can be read at the source website.</p>\n\n<h2>Related Information</h2>\n<p>This is a placeholder for more detailed content that would normally be provided by the full article text.</p>"
                    article.tags = [article.topic, "news", "trending"]
                    
                    # Add to cache (expires in 1 hour)
                    await set_cache(cache_key, article, expire=3600)
                    return article
        except Exception as trend_error:
            logger.warning(f"Error searching trending for article: {trend_error}")
        
        # If not found anywhere, generate mock data for demo purposes
        # In production, you would raise a 404 error
        mock_article = NewsArticle(
            id=article_id,
            title=f"Article {article_id[:4]}... (Demo Content)",
            summary="This is a sample article summary generated for demo purposes. In a production environment, this would be a real article fetched from the database.",
            content="<p class=\"lead\">This is a sample article content generated for demo purposes.</p>\n\n<p>Since the articles table is not available in the database, we're showing this placeholder content.</p>\n\n<h2>What would normally be here</h2>\n<p>In a fully implemented system, this would display the full article content with proper formatting, images, and related information.</p>\n\n<h2>Next Steps</h2>\n<p>To see real articles, you would need to populate the database with news content or connect to a news API service.</p>",
            imageUrl=f"https://source.unsplash.com/random/1200x600/?news&sig={article_id}",
            source="NewsAI Demo",
            sourceUrl="https://localhost:8000",
            publishedAt=datetime.now().isoformat(),
            url="#",  # Use empty URL to prevent redirects
            author="AI Demo System",
            topic="Technology",
            tags=["demo", "sample", "placeholder"],
            readTime="3 min read"
        )
        return mock_article
    except Exception as e:
        logger.error(f"Unexpected error in get_article_by_id: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/topics/{topic_id}", response_model=NewsResponse)
async def get_articles_by_topic(topic_id: str, page: int = 1, page_size: int = 10):
    """Get news articles by topic"""
    try:
        # Try to get from cache first
        cache_key = f"topic:{topic_id}:{page}:{page_size}"
        cached_result = await get_cache(cache_key)
        if cached_result:
            return cached_result
        
        # For demo purposes, we'll use the trending news endpoint with the topic as category
        # In a production app, this would query your database directly
        result = await fetch_trending_news(topic_id, page, page_size)
        
        # Add to cache (expires in 15 minutes)
        await set_cache(cache_key, result, expire=900)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Initialize the database on startup
    import asyncio
    
    # Try both import styles
    try:
        from api.db.init_db import init_db
    except ModuleNotFoundError:
        from db.init_db import init_db
    
    # Run the database initialization
    asyncio.run(init_db())
    
    # Start the FastAPI app
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
