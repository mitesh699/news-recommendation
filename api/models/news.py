from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime

class NewsArticle(BaseModel):
    """Model for a news article"""
    id: str
    title: str
    url: str
    source: str
    publishedAt: str
    imageUrl: Optional[str] = None
    summary: Optional[str] = None
    topic: str
    readTime: str

class NewsResponse(BaseModel):
    """Response model for news article listings"""
    articles: List[NewsArticle]
    totalResults: int
    page: int
    pageSize: int

class UserPreferences(BaseModel):
    """Model for user preferences"""
    topics: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    readingHistory: List[str] = Field(default_factory=list)  # List of article IDs
    bookmarks: List[str] = Field(default_factory=list)  # List of article IDs
