import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util
import os
import json
import logging
import random
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple, Union
import aiohttp
import requests
from sqlalchemy.orm import Session
from sqlalchemy import text

# Import database modules
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import modules directly - this works when running from api directory
from db.database import get_db, supabase
from db.models import Article, ArticleEmbedding, UserInteraction
from db.cache import get_cache, set_cache

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Available recommendation algorithms
RECOMMENDATION_ALGORITHMS = {
    'content_based': 'Content-based filtering using semantic similarity',
    'collaborative': 'Collaborative filtering based on user interests',
    'hybrid': 'Hybrid approach combining content and collaborative filtering',
    'trending': 'Popularity-based recommendations',
    'diverse': 'Diverse recommendations to avoid filter bubbles'
}

# Initialize models - we'll support multiple embedding models for different purposes
models = {
    'default': None,  # Main embedding model
    'fast': None,     # Lighter model for quick recommendations
}

# Model instances
models = {
    'default': None,  # Main embedding model
    'fast': None,     # Lighter model for quick recommendations
}

def initialize_models(use_local: bool = True, model_name: str = 'all-MiniLM-L6-v2'):
    """Initialize embedding models for recommendations
    
    Args:
        use_local: If True, load models locally. If False, use Hugging Face API
        model_name: Name of the model to use from Sentence Transformers
    """
    global models
    
    # Check if we need to initialize
    if models['default'] is not None:
        return
        
    try:
        if use_local:
            # Main model - more accurate but slower
            models['default'] = SentenceTransformer(model_name)
            
            # Faster model for quick recommendations (smaller but still effective)
            models['fast'] = SentenceTransformer('paraphrase-MiniLM-L3-v2')
            
            logger.info(f"Loaded recommendation models locally: {model_name} and paraphrase-MiniLM-L3-v2")
        else:
            # Use API-based inference (requires HF_API_KEY)
            from huggingface_hub.inference_api import InferenceApi
            hf_token = os.environ.get('HUGGINGFACE_API_KEY')
            
            if not hf_token:
                # Fall back to local models if no API key
                logger.warning("No Hugging Face API key found, falling back to local models")
                initialize_models(use_local=True, model_name=model_name)
                return
                
            # Use the Inference API instead (less resource intensive for the server)
            # This is a placeholder - in a real app, you'd implement the API call
            logger.info(f"Using Hugging Face API for model inference: {model_name}")
    except Exception as e:
        logger.error(f"Error initializing recommendation models: {e}")
        # Create fallback simple embeddings if models fail to load
        logger.warning("Using fallback simple embedding method")

async def load_articles(db: Session = None):
    """Load articles from database
    
    Args:
        db: Database session (if None, a new session will be created)
    
    Returns:
        Dictionary of articles by ID
    """
    # Use cache first if available
    cached_articles = await get_cache('all_articles')
    if cached_articles:
        logger.info("Retrieved articles from cache")
        return cached_articles
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
    
    try:
        # Query articles from database
        query = text("SELECT * FROM articles ORDER BY published_at DESC LIMIT 1000")
        result = db.execute(query)
        
        # Convert to dictionary by ID
        articles_dict = {}
        for row in result:
            # Convert SQLAlchemy Row to dict
            article = {column: getattr(row, column) for column in row._fields}
            
            # Convert datetime objects to strings
            if 'published_at' in article and article['published_at']:
                article['published_at'] = article['published_at'].isoformat()
            if 'created_at' in article and article['created_at']:
                article['created_at'] = article['created_at'].isoformat()
                
            articles_dict[article['id']] = article
        
        # Cache the result (expires in 30 minutes)
        await set_cache('all_articles', articles_dict, expire=1800)
        
        logger.info(f"Loaded {len(articles_dict)} articles from database")
        return articles_dict
    except Exception as e:
        logger.error(f"Error loading articles: {e}")
        return {}
    finally:
        if close_session and db:
            db.close()

async def compute_article_embedding(article_id: str, use_fast_model: bool = False, db: Session = None) -> Optional[torch.Tensor]:
    """Compute embedding for a specific article and store it in the database
    
    Args:
        article_id: ID of the article to embed
        use_fast_model: Whether to use the faster, lighter model
        db: Database session (if None, a new session will be created)
        
    Returns:
        Tensor embedding of the article or None if article not found
    """
    # Try to get embedding from cache first
    cache_key = f"embedding:{article_id}"
    cached_embedding = await get_cache(cache_key)
    if cached_embedding:
        return torch.tensor(cached_embedding)
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
    
    try:
        # Check if we already have the embedding in the database
        query = text("SELECT embedding FROM article_embeddings WHERE article_id = :id")
        result = db.execute(query, {"id": article_id}).fetchone()
        
        if result and result[0]:
            # Convert from database format (list) to tensor
            embedding_list = result[0]
            embedding = torch.tensor(embedding_list)
            
            # Cache the embedding
            await set_cache(cache_key, embedding_list, expire=3600)
            
            return embedding
        
        # We need to compute a new embedding
        # Initialize models if not already done
        initialize_models()
        
        # Get the article from the database
        article_query = text("SELECT title, summary FROM articles WHERE id = :id")
        article = db.execute(article_query, {"id": article_id}).fetchone()
        
        if not article:
            logger.warning(f"Article {article_id} not found in database")
            return None
        
        # Prepare text for embedding
        text = f"{article.title} {article.summary or ''}"
        
        # Use the selected model
        model_key = 'fast' if use_fast_model else 'default'
        if models[model_key] is None:
            logger.warning(f"Model {model_key} not available, falling back to simple embedding")
            return None
            
        # Compute embedding
        embedding = models[model_key].encode(text, convert_to_tensor=True)
        
        # Convert to list for storage
        embedding_list = embedding.tolist()
        
        # Store in database
        store_query = text("""
            INSERT INTO article_embeddings (article_id, embedding) 
            VALUES (:id, :embedding)
            ON CONFLICT (article_id) DO UPDATE 
            SET embedding = :embedding, updated_at = CURRENT_TIMESTAMP
        """)
        
        db.execute(store_query, {"id": article_id, "embedding": embedding_list})
        db.commit()
        
        # Cache the embedding
        await set_cache(cache_key, embedding_list, expire=3600)
        
        return embedding
    except Exception as e:
        logger.error(f"Error computing or retrieving embedding: {e}")
        if 'db' in locals() and db is not None:
            db.rollback()
        return None
    finally:
        if close_session and db:
            db.close()

async def record_user_interaction(user_id: str, article_id: str, interaction_type: str = 'read', time_spent: float = None, scroll_percentage: float = None, source_page: str = None, db: Session = None):
    """Record user interaction with an article in the database
    
    Args:
        user_id: ID of the user
        article_id: ID of the article
        interaction_type: Type of interaction (read, like, share, etc.)
        time_spent: Time spent on the article in seconds (optional)
        scroll_percentage: How far the user scrolled through the article (optional)
        source_page: Page or source where this interaction originated (optional)
        db: Database session (if None, a new session will be created)
    """
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
    
    try:
        # Generate a unique interaction ID
        import uuid
        interaction_id = str(uuid.uuid4())
        
        # Insert the user interaction into the database
        query = text("""
            INSERT INTO user_interactions 
                (id, user_id, article_id, interaction_type, time_spent_seconds, scroll_percentage, source_page)
            VALUES 
                (:id, :user_id, :article_id, :interaction_type, :time_spent, :scroll_percentage, :source_page)
        """)
        
        db.execute(query, {
            "id": interaction_id,
            "user_id": user_id,
            "article_id": article_id,
            "interaction_type": interaction_type,
            "time_spent": time_spent,
            "scroll_percentage": scroll_percentage,
            "source_page": source_page
        })
        
        db.commit()
        logger.info(f"Recorded user interaction: {user_id} - {article_id} - {interaction_type}")
        
        # Invalidate any cached recommendations for this user
        await get_cache(f"recommendations:user:{user_id}")
        
        return True
    except Exception as e:
        logger.error(f"Error recording user interaction: {e}")
        db.rollback()
        return False
    finally:
        if close_session and db:
            db.close()

async def content_based_filtering(article_id: str, max_results: int = 5, db: Session = None) -> List[Dict[str, Any]]:
    """Content-based filtering using semantic similarity via vector database
    
    Args:
        article_id: ID of the article to find similar content for
        max_results: Maximum number of recommendations to return
        db: Database session (if None, a new session will be created)
        
    Returns:
        List of recommended article objects
    """
    # Check cache first
    cache_key = f"content_recommendations:{article_id}:{max_results}"
    cached_results = await get_cache(cache_key)
    if cached_results:
        logger.info(f"Retrieved content recommendations from cache for article {article_id}")
        return cached_results
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
        
    try:
        # First ensure the article exists and has an embedding
        target_embedding = await compute_article_embedding(article_id, db=db)
        
        if target_embedding is None:
            logger.warning(f"No embedding found for article {article_id}")
            return []
        
        # Convert tensor to list for database query
        if hasattr(target_embedding, 'tolist'):
            target_embedding_list = target_embedding.tolist()
        else:
            target_embedding_list = target_embedding
        
        # Use pgvector to find similar articles directly in the database
        # This leverages the vector similarity search capabilities of Supabase
        query = text("""
            SELECT a.*, 1 - (e.embedding <=> :target_embedding) as similarity_score
            FROM articles a
            JOIN article_embeddings e ON a.id = e.article_id
            WHERE a.id != :article_id
            ORDER BY e.embedding <=> :target_embedding
            LIMIT :limit
        """)
        
        result = db.execute(
            query, 
            {
                "target_embedding": target_embedding_list, 
                "article_id": article_id,
                "limit": max_results
            }
        )
        
        # Convert to list of dictionaries
        recommendations = []
        for row in result:
            # Convert SQLAlchemy Row to dict
            article = {}
            for column in row._fields:
                value = getattr(row, column)
                # Convert datetime objects to strings if needed
                if isinstance(value, datetime):
                    value = value.isoformat()
                article[column] = value
            recommendations.append(article)
        
        # Cache the results (expire in 1 hour)
        await set_cache(cache_key, recommendations, expire=3600)
        
        logger.info(f"Generated {len(recommendations)} content-based recommendations for article {article_id}")
        return recommendations
    except Exception as e:
        logger.error(f"Error in content-based filtering: {e}")
        return []
    finally:
        if close_session and db:
            db.close()

async def collaborative_filtering(user_id: str, max_results: int = 5, db: Session = None) -> List[Dict[str, Any]]:
    """Collaborative filtering based on user interactions from database
    
    Args:
        user_id: ID of the user to recommend articles for
        max_results: Maximum number of recommendations to return
        db: Database session (if None, a new session will be created)
        
    Returns:
        List of recommended article objects
    """
    # Check cache first
    cache_key = f"collaborative_recommendations:{user_id}:{max_results}"
    cached_results = await get_cache(cache_key)
    if cached_results:
        logger.info(f"Retrieved collaborative recommendations from cache for user {user_id}")
        return cached_results
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
    
    try:
        # First check if user has any interactions
        user_check_query = text("SELECT COUNT(*) FROM user_interactions WHERE user_id = :user_id")
        user_interaction_count = db.execute(user_check_query, {"user_id": user_id}).scalar()
        
        if not user_interaction_count:
            logger.warning(f"No interactions found for user {user_id}")
            return []
        
        # Get articles the user has interacted with
        user_articles_query = text("SELECT article_id FROM user_interactions WHERE user_id = :user_id")
        user_articles_result = db.execute(user_articles_query, {"user_id": user_id})
        current_user_articles = {row[0] for row in user_articles_result}
        
        # Find similar users using Jaccard similarity
        # This query gets all users with at least one article in common with the current user
        similar_users_query = text("""
            WITH current_user_articles AS (
                SELECT article_id FROM user_interactions WHERE user_id = :user_id
            )
            SELECT 
                ui.user_id,
                COUNT(DISTINCT ui.article_id) AS common_articles_count,
                (SELECT COUNT(DISTINCT article_id) FROM user_interactions WHERE user_id = ui.user_id) AS total_articles_count
            FROM 
                user_interactions ui
            JOIN 
                current_user_articles cua ON ui.article_id = cua.article_id
            WHERE 
                ui.user_id != :user_id
            GROUP BY 
                ui.user_id
            ORDER BY 
                common_articles_count DESC
            LIMIT 10
        """)
        
        similar_users_result = db.execute(similar_users_query, {"user_id": user_id})
        
        # Calculate similarity scores
        user_similarity = {}
        total_current_user_articles = len(current_user_articles)
        
        for row in similar_users_result:
            other_user_id = row[0]
            common_count = row[1]
            other_total = row[2]
            
            # Jaccard similarity: intersection over union
            union_size = total_current_user_articles + other_total - common_count
            if union_size > 0:
                user_similarity[other_user_id] = common_count / union_size
            else:
                user_similarity[other_user_id] = 0
    
            # Get articles from similar users that current user hasn't interacted with
            article_scores = {}
        
            # Get articles liked by similar users that the current user hasn't seen
            recommendations_query = text("""
                WITH current_user_articles AS (
                    SELECT article_id FROM user_interactions WHERE user_id = :user_id
                )
                SELECT DISTINCT ui.article_id, a.*
                FROM user_interactions ui
                JOIN articles a ON ui.article_id = a.id
                LEFT JOIN current_user_articles cua ON ui.article_id = cua.article_id
                WHERE ui.user_id IN :similar_users
                AND cua.article_id IS NULL
                ORDER BY a.published_at DESC
                LIMIT :limit
            """)
            
            # Transform similar users into a format suitable for IN clause
            similar_user_ids = tuple(user_similarity.keys())
            if not similar_user_ids:
                return []
                
            # Execute query to get recommendations
            recommendations_result = db.execute(
                recommendations_query, 
                {
                    "user_id": user_id, 
                    "similar_users": similar_user_ids,
                    "limit": max_results * 2  # Get extra to allow for scoring
                }
            )
            
            # Process results
            recommendations = []
            for row in recommendations_result:
                article_id = row[0]
                
                # Convert SQLAlchemy Row to dict (starting from index 1 to skip article_id)
                article = {}
                for column in row._mapping.keys()[1:]:  # Skip the first column (article_id)
                    value = getattr(row, column)
                    # Convert datetime objects to strings if needed
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    article[column] = value
                
                # Calculate a score based on similar users who interacted with this article
                score = 0
                for uid, similarity in user_similarity.items():
                    # Check if this similar user interacted with this article
                    article_check_query = text("SELECT COUNT(*) FROM user_interactions WHERE user_id = :user_id AND article_id = :article_id")
                    if db.execute(article_check_query, {"user_id": uid, "article_id": article_id}).scalar() > 0:
                        score += similarity
                
                article['score'] = score
                recommendations.append(article)
            
            # Sort by score
            recommendations.sort(key=lambda x: x.get('score', 0), reverse=True)
            recommendations = recommendations[:max_results]
            
            # Cache the results (expire in 1 hour)
            await set_cache(cache_key, recommendations, expire=3600)
            
            logger.info(f"Generated {len(recommendations)} collaborative recommendations for user {user_id}")
            return recommendations
    except Exception as e:
        logger.error(f"Error in collaborative filtering: {e}")
        return []
    finally:
        if close_session and db:
            db.close()
    # This code is unreachable - the function has already returned above

async def trending_recommendations(category: Optional[str] = None, time_window_hours: int = 24, max_results: int = 5, db: Session = None) -> List[Dict[str, Any]]:
    """Get trending articles based on popularity from the database
    
    Args:
        category: Optional category to filter by
        time_window_hours: Time window to consider for trending (hours)
        max_results: Maximum number of recommendations to return
        db: Database session (if None, a new session will be created)
        
    Returns:
        List of trending article objects
    """
    # Check cache first
    cache_key = f"trending_recommendations:{category}:{time_window_hours}:{max_results}"
    cached_results = await get_cache(cache_key)
    if cached_results:
        logger.info("Retrieved trending recommendations from cache")
        return cached_results
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
    
    try:
        # Calculate the cutoff time for trending articles
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        # Build query - trending articles are determined by:
        # 1. Recency (published within time window)
        # 2. Popularity (based on user interactions)
        base_query = """
            WITH article_interactions AS (
                SELECT 
                    article_id, 
                    COUNT(*) as interaction_count,
                    MAX(timestamp) as last_interaction
                FROM 
                    user_interactions
                WHERE 
                    timestamp > :cutoff_time
                GROUP BY 
                    article_id
            )
            SELECT 
                a.*,
                COALESCE(ai.interaction_count, 0) as interaction_count,
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.published_at))/3600 as hours_since_published
            FROM 
                articles a
            LEFT JOIN 
                article_interactions ai ON a.id = ai.article_id
            WHERE 
                a.published_at > :cutoff_time
        """
        
        # Add category filter if specified
        if category:
            base_query += " AND a.topic = :category"
        
        # Add order by and limit
        base_query += """
            ORDER BY 
                -- Formula: interaction count divided by hours since published (weighted)
                -- Recent articles with high interaction count rank higher
                (COALESCE(ai.interaction_count, 0) + 1) / (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.published_at))/3600 + 1) DESC
            LIMIT 
                :limit
        """
        
        # Execute query
        query = text(base_query)
        params = {
            "cutoff_time": cutoff_time,
            "limit": max_results
        }
        
        if category:
            params["category"] = category
            
        result = db.execute(query, params)
        
        # Convert to list of dictionaries
        trending_articles = []
        for row in result:
            # Convert SQLAlchemy Row to dict
            article = {}
            for column in row._fields:
                value = getattr(row, column)
                # Convert datetime objects to strings if needed
                if isinstance(value, datetime):
                    value = value.isoformat()
                article[column] = value
            trending_articles.append(article)
        
        # Cache the results (expire in 30 minutes - trending should update more frequently)
        await set_cache(cache_key, trending_articles, expire=1800)
        
        logger.info(f"Generated {len(trending_articles)} trending recommendations")
        return trending_articles
        
    except Exception as e:
        logger.error(f"Error getting trending recommendations: {e}")
        return []
    finally:
        if close_session and db:
            db.close()

async def diverse_recommendations(user_id: Optional[str] = None, seed_article_id: Optional[str] = None, max_results: int = 5, db: Session = None) -> List[Dict[str, Any]]:
    """Generate diverse recommendations to avoid filter bubbles using database
    
    Args:
        user_id: Optional user ID to diversify from their interests
        seed_article_id: Optional article ID to diversify from
        max_results: Maximum number of recommendations to return
        db: Database session (if None, a new session will be created)
        
    Returns:
        List of diverse article objects
    """
    # Check cache first
    cache_key = f"diverse_recommendations:{user_id}:{seed_article_id}:{max_results}"
    cached_results = await get_cache(cache_key)
    if cached_results:
        logger.info("Retrieved diverse recommendations from cache")
        return cached_results
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
        
    try:
        # First, get regular recommendations as a base
        base_recommendations = []
        
        if seed_article_id:
            # If we have a seed article, get content-based recommendations
            base_recommendations = await content_based_filtering(seed_article_id, max_results=max_results*2, db=db)
        elif user_id:
            # Check if user has interactions
            user_check_query = text("SELECT COUNT(*) FROM user_interactions WHERE user_id = :user_id")
            user_interaction_count = db.execute(user_check_query, {"user_id": user_id}).scalar()
            
            if user_interaction_count > 0:
                # If user has interactions, get collaborative recommendations
                base_recommendations = await collaborative_filtering(user_id, max_results=max_results*2, db=db)
            
        # If we couldn't get base recommendations, return diverse articles from different categories
        if not base_recommendations:
            # Get all available topics from the database
            topics_query = text("SELECT DISTINCT topic FROM articles WHERE topic IS NOT NULL")
            topics_result = db.execute(topics_query)
            topics = [row[0] for row in topics_result if row[0]]  # Filter out None values
            
            if not topics:
                # If no topics found, just get recent articles
                recent_query = text("SELECT * FROM articles ORDER BY published_at DESC LIMIT :limit")
                recent_result = db.execute(recent_query, {"limit": max_results})
                
                diverse_articles = []
                for row in recent_result:
                    article = {}
                    for column in row._fields:
                        value = getattr(row, column)
                        if isinstance(value, datetime):
                            value = value.isoformat()
                        article[column] = value
                    diverse_articles.append(article)
                    
                # Cache the results (expire in 1 hour)
                await set_cache(cache_key, diverse_articles, expire=3600)
                return diverse_articles
            
            # Get one article from each topic
            diverse_articles = []
            for topic in topics:
                if len(diverse_articles) >= max_results:
                    break
                    
                topic_query = text("SELECT * FROM articles WHERE topic = :topic ORDER BY published_at DESC LIMIT 1")
                topic_result = db.execute(topic_query, {"topic": topic}).fetchone()
                
                if topic_result:
                    article = {}
                    for column in topic_result._fields:
                        value = getattr(topic_result, column)
                        if isinstance(value, datetime):
                            value = value.isoformat()
                        article[column] = value
                    diverse_articles.append(article)
            
            # Cache the results (expire in 1 hour)
            await set_cache(cache_key, diverse_articles[:max_results], expire=3600)
            return diverse_articles[:max_results]
    
            # If we have base recommendations, ensure diversity by topic
            topics_seen = set()
            diverse_results = []
            
            # First pass - get one article from each topic
            for article in base_recommendations:
                topic = article.get('topic')
                if topic and topic not in topics_seen:
                    diverse_results.append(article)
                    topics_seen.add(topic)
                    
                if len(diverse_results) >= max_results:
                    break
                    
            # Second pass - if we need more articles, add more regardless of topic
            if len(diverse_results) < max_results:
                for article in base_recommendations:
                    if article not in diverse_results:
                        diverse_results.append(article)
                        
                    if len(diverse_results) >= max_results:
                        break
            
            # Cache the results (expire in 1 hour)
            await set_cache(cache_key, diverse_results[:max_results], expire=3600)
            return diverse_results[:max_results]
    except Exception as e:
        logger.error(f"Error in diverse recommendations: {e}")
        return []
    finally:
        if close_session and db:
            db.close()
    
    # This code is unreachable - the function has already returned in the try/except/finally block above

async def llm_analyze_user_preferences(user_id: str, db: Session = None):
    """Analyze user reading patterns using LLMs to extract deeper preferences
    
    Args:
        user_id: ID of the user to analyze
        db: Database session
        
    Returns:
        Dictionary with analyzed preferences and interests
    """
    close_session = db is None
    if close_session:
        db = next(get_db())
        
    try:
        # Get user's reading history (recent articles they've interacted with)
        user_history_query = text("""
            SELECT a.id, a.title, a.content, a.topic, a.source, a.published_at, ui.interaction_type, ui.time_spent
            FROM user_interactions ui
            JOIN articles a ON ui.article_id = a.id
            WHERE ui.user_id = :user_id
            ORDER BY ui.created_at DESC
            LIMIT 20
        """)
        
        user_history = db.execute(user_history_query, {"user_id": user_id}).fetchall()
        
        if not user_history:
            logger.info(f"No reading history found for user {user_id}")
            return {"interests": [], "topics": [], "sources": [], "preferences": {}}
            
        # Extract information from user history
        history_data = []
        for row in user_history:
            item = {
                "title": row.title,
                "topic": row.topic,
                "source": row.source,
                "interaction_type": row.interaction_type,
                "time_spent": row.time_spent if row.time_spent else "unknown"
            }
            history_data.append(item)
            
        # Use LLMs to analyze user preferences if API key is available
        hf_api_key = os.environ.get('HUGGINGFACE_API_KEY')
        if hf_api_key:
            try:
                logger.info(f"Using LLM to analyze preferences for user {user_id}")
                
                # Create prompt for the LLM
                prompt = f"""Based on this user's reading history, identify their interests, preferred topics, 
                preferred sources, and any other relevant patterns. Return the analysis as JSON.
                
                Reading history:
                {json.dumps(history_data, indent=2)}
                
                Provide analysis as JSON with these keys: interests (list of interests), topics (list of preferred topics), 
                sources (list of preferred sources), and preferences (object with additional patterns).
                """
                
                # Call Hugging Face API
                API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
                headers = {"Authorization": f"Bearer {hf_api_key}"}
                
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 500,
                        "temperature": 0.1,  # Lower temperature for more consistent results
                        "return_full_text": False
                    }
                }
                
                response = requests.post(API_URL, headers=headers, json=payload)
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            # Extract the JSON from the response text
                            import re
                            text_response = result[0].get('generated_text', '')
                            # Look for JSON pattern in the response
                            json_match = re.search(r'\{[\s\S]*\}', text_response)
                            if json_match:
                                analysis = json.loads(json_match.group(0))
                                logger.info(f"Successfully analyzed user preferences with LLM")
                                return analysis
                    except Exception as parse_error:
                        logger.error(f"Error parsing LLM response: {parse_error}")
            except Exception as api_error:
                logger.error(f"Error calling Hugging Face API: {api_error}")
        
        # Fallback to basic analysis if LLM fails or no API key
        logger.info(f"Using basic analysis for user {user_id} preferences")
        topics = {}
        sources = {}
        
        for item in history_data:
            topic = item.get('topic')
            source = item.get('source')
            
            if topic:
                topics[topic] = topics.get(topic, 0) + 1
            if source:
                sources[source] = sources.get(source, 0) + 1
        
        # Sort by frequency
        top_topics = sorted(topics.items(), key=lambda x: x[1], reverse=True)
        top_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)
        
        basic_analysis = {
            "interests": [t[0] for t in top_topics][:5],  # Top 5 interests
            "topics": [t[0] for t in top_topics][:3],     # Top 3 topics
            "sources": [s[0] for s in top_sources][:3],   # Top 3 sources
            "preferences": {
                "topTopics": dict(top_topics[:5]),
                "topSources": dict(top_sources[:3])
            }
        }
        
        return basic_analysis
    except Exception as e:
        logger.error(f"Error analyzing user preferences: {e}")
        return {"interests": [], "topics": [], "sources": [], "preferences": {}}
    finally:
        if close_session and db:
            db.close()

async def hybrid_recommendations(user_id: Optional[str] = None, article_id: Optional[str] = None, 
                              user_interests: Optional[List[str]] = None, max_results: int = 5, db: Session = None) -> List[Dict[str, Any]]:
    """Hybrid recommendation combining multiple approaches using Supabase database
    
    Args:
        user_id: Optional user ID for personalization
        article_id: Optional article ID for content-based recommendations
        user_interests: Optional list of user interests
        max_results: Maximum number of recommendations to return
        db: Database session (if None, a new session will be created)
        
    Returns:
        List of recommended article objects
    """
    # Check cache first
    cache_key = f"hybrid_recommendations:{user_id}:{article_id}:{','.join(user_interests) if user_interests else ''}:{max_results}"
    cached_results = await get_cache(cache_key)
    if cached_results:
        logger.info("Retrieved hybrid recommendations from cache")
        return cached_results
    
    # If db not provided, create a new session
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True
        
    try:
        all_recommendations = []
        weights = {
            'content': 0.4,
            'collaborative': 0.3,
            'trending': 0.2,
            'diverse': 0.1
        }
        
        # Collect recommendations from different algorithms
        results = {}
        
        # Content-based if article_id provided
        if article_id:
            results['content'] = await content_based_filtering(article_id, max_results=max_results*2, db=db)
        
        # Collaborative if user_id provided
        if user_id:
            results['collaborative'] = await collaborative_filtering(user_id, max_results=max_results*2, db=db)
        
        # Always include some trending
        results['trending'] = await trending_recommendations(max_results=max_results*2, db=db)
        
        # Always include some diversity
        results['diverse'] = await diverse_recommendations(user_id, article_id, max_results=max_results*2, db=db)
    
        # Score each article across all algorithms
        article_scores = {}
        
        for algo, recs in results.items():
            # Skip empty results
            if not recs:
                continue
                
            algo_weight = weights.get(algo, 0.1)
            
            # Score each article
            for i, article in enumerate(recs):
                article_id = article['id']
                
                if article_id not in article_scores:
                    article_scores[article_id] = 0
                    
                # Higher position = higher score within each algorithm
                position_score = 1.0 - (i / len(recs))  # Normalize to 0-1 range
                article_scores[article_id] += algo_weight * position_score
        
        # Sort by final score
        ranked_article_ids = sorted(article_scores, key=article_scores.get, reverse=True)[:max_results]
        
        # Collect the final recommendations
        recommendations = []
        articles_seen = set()
        
        # First collect from each source while avoiding duplicates
        for article_id in ranked_article_ids:
            if article_id in articles_seen:
                continue
                
            # Find the article in one of the result sets
            for recs in results.values():
                for article in recs:
                    if article.get('id') == article_id:
                        recommendations.append(article)
                        articles_seen.add(article_id)
                        break
                if article_id in articles_seen:
                    break
        
        # Cache the results (expire in 1 hour)
        await set_cache(cache_key, recommendations, expire=3600)
        
        logger.info(f"Generated {len(recommendations)} hybrid recommendations")
        return recommendations
    
    except Exception as e:
        logger.error(f"Error in hybrid recommendations: {e}")
        return []
    finally:
        if close_session and db:
            db.close()

async def get_recommendations(article_id: Optional[str] = None, 
                            user_id: Optional[str] = None,
                            user_interests: Optional[List[str]] = None,
                            algorithm: str = 'hybrid',
                            max_results: int = 5,
                            use_llm: bool = True) -> List[Dict[str, Any]]:
    """Get recommendations using specified algorithm with Supabase and Upstash
    
    Args:
        article_id: Optional ID of article to base recommendations on
        user_id: Optional ID of user for personalization
        user_interests: Optional list of user interests
        algorithm: Algorithm to use (content_based, collaborative, hybrid, trending, diverse)
        max_results: Maximum number of recommendations to return
        
    Returns:
        List of recommended article objects
    """
    # Check cache first (except for content-based which is article-specific)
    if algorithm != 'content_based':
        cache_key = f"recommendations:{algorithm}:{user_id}:{','.join(user_interests) if user_interests else ''}:{max_results}"
        cached_results = await get_cache(cache_key)
        if cached_results:
            logger.info(f"Retrieved {algorithm} recommendations from cache")
            return cached_results
    
    # Initialize models if not already done
    initialize_models()
    
    # Create database session
    db = next(get_db())
    
    try:
        # Verify articles exist in database
        article_count = db.execute(text("SELECT COUNT(*) FROM articles")).scalar()
        if article_count == 0:
            logger.warning("No articles found in database")
            return []
        
        # Log recommendation request
        logger.info(f"Recommendation request: algo={algorithm}, article_id={article_id}, user_id={user_id}")
        
        # Call appropriate algorithm with database session
        if algorithm == 'content_based' and article_id:
            return await content_based_filtering(article_id, max_results, db=db)
        elif algorithm == 'collaborative' and user_id:
            return await collaborative_filtering(user_id, max_results, db=db)
        elif algorithm == 'trending':
            return await trending_recommendations(max_results=max_results, db=db)
        elif algorithm == 'diverse':
            return await diverse_recommendations(user_id, article_id, max_results, db=db)
        elif algorithm == 'hybrid' or algorithm not in RECOMMENDATION_ALGORITHMS:
            # Default to hybrid
            return await hybrid_recommendations(user_id, article_id, user_interests, max_results, db=db)
        else:
            # Should never happen with the checks above, but just in case
            return []
            
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return []
    finally:
        if db:
            db.close()

