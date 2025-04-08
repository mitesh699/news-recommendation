import requests
from bs4 import BeautifulSoup
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flag to track if we've attempted to import transformers
transformers_available = False
summarizer = None

# We'll try to import transformers and APIs, but have a fallback if they're not available
try:
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
    import requests
    transformers_available = True
    # Set up summarization model
    model_name = "facebook/bart-large-cnn"  # Primary model
    alternative_model = "sshleifer/distilbart-cnn-6-6"  # Fallback model
    logger.info("Successfully imported transformers library")
except ImportError as e:
    logger.warning(f"Failed to import transformers: {e}. Will use fallback summarization.")

def initialize_summarizer():
    global summarizer
    if summarizer is None and transformers_available:
        try:
            # Initialize only if not already loaded and transformers is available
            logger.info("Initializing transformers summarization pipeline...")
            
            # First try to use the better model
            try:
                model_name = "facebook/bart-large-cnn"
                logger.info(f"Attempting to load {model_name}...")
                # Load tokenizer and model explicitly for better control
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
                summarizer = pipeline("summarization", model=model, tokenizer=tokenizer, device=-1)  # Force CPU
            except Exception as model_error:
                # If the larger model fails, fall back to a smaller one
                logger.warning(f"Failed to load primary model: {model_error}. Falling back to smaller model.")
                model_name = "sshleifer/distilbart-cnn-6-6"  # Significantly smaller model
                summarizer = pipeline("summarization", model=model_name, device=-1)
                
            logger.info(f"Successfully initialized the summarization model: {model_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize summarizer: {e}")
            return False
    return summarizer is not None

async def extract_article_content(url):
    """Extract main content from a news article URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, and nav elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
            element.decompose()
        
        # Find article content - this varies by site, so we'll use some common patterns
        article_content = ""
        
        # Try to find main content by common article selectors
        selectors = [
            "article", ".article-content", ".article-body", ".story-body", 
            "[itemprop='articleBody']", ".entry-content", ".post-content",
            ".main-content", "#main-content"
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                article_content = " ".join([elem.get_text(strip=True, separator=" ") for elem in elements])
                break
        
        # If we couldn't find content with selectors, fallback to p tags
        if not article_content:
            paragraphs = soup.find_all('p')
            article_content = " ".join([p.get_text(strip=True) for p in paragraphs])
        
        # Clean up the content (remove extra whitespace)
        article_content = " ".join(article_content.split())
        
        return article_content
    except Exception as e:
        raise Exception(f"Error extracting article content: {str(e)}")

async def generate_simple_summary(text, max_length=250):
    """Generate a simple summary using basic text techniques when transformers aren't available"""
    # Simple extractive summarization - take the first few sentences
    import re
    
    # Split text into sentences
    sentences = re.split(r'(?<=[.!?]) +', text)
    
    if not sentences:
        return "No content available for summarization."
        
    # Calculate how many sentences we need based on average sentence length
    avg_length = sum(len(s) for s in sentences) / len(sentences)
    approx_sentences_needed = max(1, min(5, int(max_length / avg_length)))
    
    # Take first sentence, then prioritize longer/important sentences from the beginning
    selected = [sentences[0]]  # Always include the first sentence
    
    # Get some sentences from the beginning of the article
    beginning_sentences = sentences[1:min(len(sentences), 4)]
    candidates = [(i, s) for i, s in enumerate(beginning_sentences) if len(s) > 50]
    candidates.sort(key=lambda x: len(x[1]), reverse=True)  # Sort by length
    
    for _, sentence in candidates[:approx_sentences_needed-1]:
        if len(" ".join(selected + [sentence])) <= max_length:
            selected.append(sentence)
    
    return " ".join(selected)

async def get_article_summary(url, max_length=250):
    """Generate a summary for an article URL using Hugging Face models"""
    try:
        # Extract the article content first
        logger.info(f"Extracting content from URL: {url}")
        content = await extract_article_content(url)
        
        # If content is too short, return it as is
        if not content or len(content) < 100:
            logger.warning(f"Content too short for URL: {url}")
            return "Article content could not be retrieved or is too short to summarize."
            
        if len(content) <= max_length:
            return content[:max_length]
        
        # First try using Hugging Face API if credentials are available
        hf_api_key = os.environ.get('HUGGINGFACE_API_KEY')
        if hf_api_key:
            try:
                logger.info("Attempting to use Hugging Face Inference API for summarization")
                API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
                headers = {"Authorization": f"Bearer {hf_api_key}"}
                
                # Truncate content if it's too long for the API
                truncated_content = content[:4000]  # Most APIs have token limits
                
                payload = {
                    "inputs": truncated_content,
                    "parameters": {
                        "max_length": max_length,
                        "min_length": min(max_length//2, 30),
                        "do_sample": False
                    }
                }
                
                response = requests.post(API_URL, headers=headers, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0 and 'summary_text' in result[0]:
                        return result[0]['summary_text']
            except Exception as api_error:
                logger.warning(f"Hugging Face API summarization failed: {api_error}, falling back to local model")
        
        # Try transformers-based summarization if available
        if initialize_summarizer():
            try:
                logger.info(f"Using transformers to summarize content from {url}")
                # Split content into chunks if it's too long (models have context limits)
                # BART models typically have a 1024 token limit
                chunks = [content[i:i+1024] for i in range(0, min(len(content), 8192), 1024)]
                chunks = [c for c in chunks if len(c) >= 50]  # Skip very small chunks
                
                if not chunks:
                    return "Content too short or fragmented to summarize effectively."
                    
                # Adjust max_length per chunk
                per_chunk_length = max(50, max_length // len(chunks))
                    
                summaries = []
                for chunk in chunks:
                    # Generate summary for this chunk
                    summary = summarizer(chunk, max_length=per_chunk_length, min_length=min(30, per_chunk_length-10), do_sample=False)
                    summaries.append(summary[0]['summary_text'])
                
                # Combine chunk summaries
                full_summary = " ".join(summaries)
                
                # If the combined summary is still too long, summarize it again
                if len(full_summary) > max_length:
                    full_summary = summarizer(full_summary, max_length=max_length, min_length=min(max_length//2, 30), do_sample=False)[0]['summary_text']
                
                return full_summary
            except Exception as e:
                logger.error(f"Transformers summarization failed: {e}, falling back to simple summarization")
                # Fall back to simple summarization
                
        # Use simple summarization as fallback
        logger.info(f"Using simple summarization for {url}")
        summary = await generate_simple_summary(content, max_length)
        logger.info(f"Successfully generated simple summary for {url}")
        return summary
        
    except Exception as e:
        logger.error(f"Error in article summarization: {e}")
        return f"Failed to generate summary: {str(e)}"
