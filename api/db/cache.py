import json
import os
import aiohttp
from typing import Any, Optional
import asyncio

# Get Upstash Redis connection info from environment variables
REDIS_REST_URL = os.environ.get('REDIS_REST_URL')
REDIS_REST_TOKEN = os.environ.get('REDIS_REST_TOKEN')

# Upstash Redis client instance
redis_client = None

class UpstashRedisClient:
    """Client for Upstash Redis REST API"""
    def __init__(self, url=None, token=None):
        self.base_url = url or REDIS_REST_URL
        self.token = token or REDIS_REST_TOKEN
        
        if not self.base_url or not self.token:
            print("Warning: Missing Upstash Redis credentials. Using fallback in-memory cache.")
            return None
            
        self.headers = {
            "Authorization": f"Bearer {self.token}"
        }
    
    async def ping(self):
        """Test connection to Upstash Redis"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/ping"
            async with session.get(url, headers=self.headers) as response:
                return response.status == 200

    async def get(self, key):
        """Get a value from Upstash Redis"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/get/{key}"
            async with session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    return None
                data = await response.json()
                return data["result"]
    
    async def set(self, key, value, ex=None):
        """Set a value in Upstash Redis"""
        async with aiohttp.ClientSession() as session:
            # For simplicity, we'll encode the value ourselves and pass as path parameter
            # In production, you might want to use POST with JSON body for larger values
            encoded_value = value.replace("/", "_SLASH_")
            url = f"{self.base_url}/set/{key}/{encoded_value}"
            if ex:
                url += f"/ex/{ex}"
            async with session.get(url, headers=self.headers) as response:
                return response.status == 200
    
    async def delete(self, key):
        """Delete a value from Upstash Redis"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/del/{key}"
            async with session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    return 0
                data = await response.json()
                return data["result"]

def get_redis_client():
    """Get or create Redis client instance"""
    global redis_client
    if redis_client is None:
        try:
            # Try to create Upstash client
            client = UpstashRedisClient()
            # If no credentials, fall back to in-memory cache
            if client is None:
                redis_client = InMemoryCache()
            else:
                redis_client = client
        except Exception as e:
            print(f"Redis connection error: {e}")
            redis_client = InMemoryCache()
    return redis_client

class InMemoryCache:
    """Fallback in-memory cache when Redis is not available"""
    def __init__(self):
        self.cache = {}
        self.expiry = {}
    
    async def ping(self):
        return True
    
    async def get(self, key):
        # Check if expired
        current_time = asyncio.get_event_loop().time()
        if key in self.expiry and self.expiry[key] < current_time:
            # Remove expired item
            del self.cache[key]
            del self.expiry[key]
            return None
        return self.cache.get(key)
    
    async def set(self, key, value, ex=None):
        self.cache[key] = value
        if ex:
            self.expiry[key] = asyncio.get_event_loop().time() + ex
        return True
    
    async def delete(self, key):
        if key in self.cache:
            del self.cache[key]
            if key in self.expiry:
                del self.expiry[key]
            return 1
        return 0

async def get_cache(key: str) -> Optional[Any]:
    """Get a value from the cache"""
    client = get_redis_client()
    
    try:
        # Get value from cache
        cached_data = await client.get(key)
        
        if cached_data:
            # Deserialize JSON data
            try:
                return json.loads(cached_data)
            except:
                # If not JSON, return as is
                return cached_data
        return None
    except Exception as e:
        print(f"Cache error: {e}")
        return None

async def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """Set a value in the cache with optional expiration time (in seconds)"""
    client = get_redis_client()
    
    try:
        # Serialize value to JSON if it's not a string
        if not isinstance(value, str):
            serialized_value = json.dumps(value)
        else:
            serialized_value = value
        
        # Set in cache with expiration
        return await client.set(key, serialized_value, ex=expire)
    except Exception as e:
        print(f"Cache error: {e}")
        return False

async def delete_cache(key: str) -> bool:
    """Delete a value from the cache"""
    client = get_redis_client()
    
    try:
        result = await client.delete(key)
        return result > 0
    except Exception as e:
        print(f"Cache error: {e}")
        return False
