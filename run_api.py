#!/usr/bin/env python3
"""
FastAPI News Recommendation System Runner

This script handles database initialization and starts the FastAPI server.
Prerequisite: Make sure to install dependencies with `pip install -r api/requirements.txt`
"""

import os
import sys
import uvicorn
import asyncio
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
logger.info(f"Loading environment from: {env_path}")

# Verify critical environment variables
required_env_vars = [
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'SUPABASE_URL', 'SUPABASE_KEY',
    'REDIS_REST_URL', 'REDIS_REST_TOKEN'
]

missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.error("Please check your .env file")
    sys.exit(1)

# Initialize database
async def init_database():
    try:
        # Import the database initialization module
        sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))
        from db.init_db import init_db
        
        logger.info("Initializing database schema...")
        success = await init_db()
        if success:
            logger.info("Database initialization completed successfully")
        else:
            logger.warning("Database initialization completed with errors - some features may not work")
        return success  # Return the success status
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        logger.warning("Continuing without database initialization - some features may not work")
        return False  # Return failure status

def start_server():
    logger.info("Starting FastAPI server...")
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    # Run database initialization
    db_success = asyncio.run(init_database())
    
    if not db_success:
        logger.warning("Starting FastAPI server with limited database functionality")
        logger.warning("Please check your Supabase credentials in the .env file")
    
    # Start the FastAPI server
    start_server()
