import os
import logging
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from supabase import create_client, Client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database connection info from environment variables
DB_HOST = os.environ.get('DB_HOST')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

# Supabase connection info
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# Build PostgreSQL connection strings
# For async operations, we need an async database URL
# Use connection pooling URL if regular connection fails
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?pgbouncer=true"
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?pgbouncer=true"

# Metadata object for table definitions
metadata = MetaData()

# Create SQLAlchemy engines and session
try:
    # Standard sync engine (for compatibility)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    
    # Async engine for FastAPI operations
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        pool_pre_ping=True,
        echo=True  # Set to True for debugging SQL queries
    )
    
    # Session factories
    SessionLocal = sessionmaker(bind=engine)
    
    # Use async_sessionmaker for async sessions - better compatibility with async contexts
    from sqlalchemy.ext.asyncio import async_sessionmaker
    AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
    
    # Base class for models
    Base = declarative_base(metadata=metadata)
    
    logger.info("Database connection established successfully")
except Exception as e:
    logger.error(f"Database connection error: {e}")
    logger.warning("Continuing without database connection - application functionality will be limited")
    # Create placeholders for the engine and session factory
    engine = None
    async_engine = None
    SessionLocal = None
    AsyncSessionLocal = None
    Base = declarative_base(metadata=metadata)

# Create Supabase client
supabase: Client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Supabase client initialization error: {e}")
            raise
    else:
        logger.warning("Missing Supabase credentials")

# Initialize Supabase client
init_supabase()

# Database session dependencies
def get_db():
    """Get synchronous database session dependency for FastAPI"""
    if SessionLocal is None:
        logger.warning("Database connection is not available")
        yield None
        return
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    """Get asynchronous database session dependency for FastAPI"""
    if AsyncSessionLocal is None:
        logger.warning("Async database connection is not available")
        yield None
        return
    
    async with AsyncSessionLocal() as session:
        yield session

async def get_article_by_id(article_id: str):
    """Get a news article by its ID using Supabase"""
    try:
        if supabase is None:
            logger.error("Supabase client is not initialized")
            return None
            
        # Use Supabase's data API to fetch the article
        response = supabase.table('articles').select('*').eq('id', article_id).execute()
        
        # Check if we got any results
        if response.data and len(response.data) > 0:
            article = response.data[0]
            
            # Convert to NewsArticle model format (expected by the API)
            from api.models.news import NewsArticle
            
            # Format tags if they exist
            tags = []
            if 'tags' in article and article['tags']:
                # Handle both string and array formats
                if isinstance(article['tags'], str):
                    # Try to parse if it's a JSON string
                    try:
                        import json
                        tags = json.loads(article['tags'])
                    except:
                        # If parsing fails, split by comma
                        tags = [tag.strip() for tag in article['tags'].split(',')]
                elif isinstance(article['tags'], list):
                    tags = article['tags']
            
            # Convert to the expected model format
            return NewsArticle(
                id=article.get('id'),
                title=article.get('title', ''),
                summary=article.get('summary', ''),
                content=article.get('content', ''),
                imageUrl=article.get('image_url'),  # Map from snake_case to camelCase
                source=article.get('source', ''),
                sourceUrl=article.get('source_url'),
                publishedAt=article.get('published_at'),
                url=article.get('url', ''),
                author=article.get('author', ''),
                topic=article.get('topic', ''),
                tags=tags
            )
        
        return None
    except Exception as e:
        logger.error(f"Error fetching article by ID: {e}")
        raise
