import os
import asyncio
import logging
import aiohttp
from sqlalchemy import text
from .database import engine, async_engine, SessionLocal, supabase

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQL commands to initialize the database
INIT_COMMANDS = [
    # Enable the pgvector extension if not already enabled
    "CREATE EXTENSION IF NOT EXISTS vector;",
    
    # Create the articles table if it doesn't exist
    """
    CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        source TEXT,
        published_at TIMESTAMP,
        content TEXT,
        summary TEXT,
        topic VARCHAR(50),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    
    # Create the article_embeddings table if it doesn't exist
    """
    CREATE TABLE IF NOT EXISTS article_embeddings (
        article_id VARCHAR REFERENCES articles(id) PRIMARY KEY,
        embedding vector(384),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    
    # Create the user_interactions table if it doesn't exist
    """
    CREATE TABLE IF NOT EXISTS user_interactions (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        article_id VARCHAR REFERENCES articles(id),
        interaction_type VARCHAR NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        time_spent_seconds FLOAT,
        scroll_percentage FLOAT,
        source_page VARCHAR
    );
    """,
    
    # Create indexes for faster queries
    "CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);",
    "CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic);",
    "CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);",
    "CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_interactions_article_id ON user_interactions(article_id);",
    
    # Create index for vector similarity search
    "CREATE INDEX IF NOT EXISTS idx_article_embeddings_embedding ON article_embeddings USING ivfflat (embedding vector_cosine_ops);"
]

async def init_db():
    """Initialize database schema using Supabase client API"""
    if supabase is None:
        logger.error("Cannot initialize database: No Supabase client available")
        return False
    
    try:
        logger.info("Using Supabase client API for database initialization")
        
        # Create necessary functions in Supabase (if they don't exist)
        # First, check if we need to create exec_sql function
        try:
            # Try to create a stored procedure that can execute arbitrary SQL
            # This only needs to be done once for your Supabase project
            create_function_sql = """
            CREATE OR REPLACE FUNCTION exec_sql(query text)
            RETURNS void AS $$
            BEGIN
                EXECUTE query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            """
            
            # Try to execute the function creation via REST API
            response = supabase.rpc('exec_sql', {'query': create_function_sql})
            logger.info("Created or updated exec_sql function")
        except Exception as e:
            logger.warning(f"Could not create exec_sql function: {e}. This is normal if it already exists.")
        
        # Now use the Supabase REST API to execute each initialization command
        success_count = 0
        for command in INIT_COMMANDS:
            try:
                # We're using Supabase's Storage API as a proxy to execute SQL
                # This avoids direct PostgreSQL connections
                # Use POST to Supabase's REST API endpoint
                response = supabase.rpc('exec_sql', {'query': command})
                success_count += 1
                logger.info(f"Successfully executed SQL command via Supabase API: {command[:50]}...")
            except Exception as e:
                logger.error(f"Error executing SQL command via Supabase API: {e}")
                logger.error(f"Command that failed: {command}")
                
        logger.info(f"Database initialization completed with {success_count}/{len(INIT_COMMANDS)} successful commands")
        return success_count > 0  # Return True if at least one command succeeded
    except Exception as e:
        logger.error(f"Database initialization error with Supabase client: {e}")
        # Continue with starting the application even if initialization fails
        return False

# Function to run when this module is executed directly
def main():
    """Main function to initialize the database"""
    asyncio.run(init_db())

if __name__ == "__main__":
    main()
