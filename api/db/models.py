from sqlalchemy import Column, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Article(Base):
    """Article model for storing news articles"""
    __tablename__ = "articles"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    source = Column(String)
    published_at = Column(DateTime)
    content = Column(Text)
    summary = Column(Text)
    topic = Column(String)
    image_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship with embeddings
    embedding = relationship("ArticleEmbedding", back_populates="article", uselist=False)

class ArticleEmbedding(Base):
    """Model for storing article embeddings for similarity search"""
    __tablename__ = "article_embeddings"
    
    article_id = Column(String, ForeignKey("articles.id"), primary_key=True)
    # Note: The actual embedding vector is stored in Supabase directly using pgvector
    # We don't define it in SQLAlchemy since it's a custom type
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationship with article
    article = relationship("Article", back_populates="embedding")

class UserInteraction(Base):
    """Model for storing user interactions with articles"""
    __tablename__ = "user_interactions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    article_id = Column(String, ForeignKey("articles.id"), index=True)
    interaction_type = Column(String)  # view, like, share, bookmark, etc.
    timestamp = Column(DateTime, server_default=func.now())
    
    # Additional metadata
    time_spent_seconds = Column(Float, nullable=True)  # For view interactions
    scroll_percentage = Column(Float, nullable=True)   # How far they scrolled
    source_page = Column(String, nullable=True)        # Where this interaction came from
