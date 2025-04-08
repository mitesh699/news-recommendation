# AI-Integrated News Recommendation System

## Overview

This project is an AI-integrated news recommendation website that functions similar to the web search capabilities in modern LLM chatbots like ChatGPT and Perplexity. It provides:

- Article search with relevant results
- AI-generated article summaries
- Personalized article recommendations based on user interests and reading behavior
- Trending news across different categories

The system uses open-source technologies and models for AI integration, making it highly customizable and private.

## Key Features

- **Search Engine**: Search for news articles across various sources
- **Article Summarization**: AI-generated summaries of news articles (like Perplexity)
- **Recommendation System**: ML-based personalized article recommendations
- **Trending News Aggregation**: Real-time tracking of trending topics
- **Category Filtering**: Browse news by categories
- **Responsive UI**: Modern, responsive interface

## Tech Stack

### Frontend
- React.js
- React Router
- TailwindCSS
- Lucide React Icons

### Backend
- FastAPI
- Hugging Face Transformers (for summarization)
- Sentence Transformers (for embeddings and recommendations)
- Integrated news sources:
  - NewsAPI (trending headlines and article search)
  - GNews API (trending headlines and keyword search)
  - New York Times API (article search and top stories)
  - DuckDuckGo News (as fallback source)
- Supabase for database (with REST API integration)

### AI Models
- BART for article summarization (facebook/bart-large-cnn)
- Sentence embeddings for article similarity (all-MiniLM-L6-v2)

### DevOps
- Docker and Docker Compose for containerization
- Vercel for deployment
- Redis for caching
- PostgreSQL for data storage

## News API Integration

This application integrates with multiple news sources to provide reliable, redundant access to news content:

### NewsAPI
- **Endpoints Used**:
  - `/v2/everything` - For article search and discovery across 150,000+ sources
  - `/v2/top-headlines` - For trending news and breaking headlines
- **Features**:
  - Category filtering (business, entertainment, health, science, sports, technology)
  - Language filtering
  - Sort by relevancy, popularity, or publish date
  - Pagination support

### GNews API
- **Endpoints Used**:
  - `/api/v4/search` - For keyword-based article searches
  - `/api/v4/top-headlines` - For trending news by category
- **Features**:
  - Multi-language support
  - Country filtering
  - Advanced search operators
  - Category-based filtering

### New York Times API
- **Endpoints Used**:
  - `/svc/search/v2/articlesearch.json` - For article searching with advanced filters
  - `/svc/topstories/v2/{section}.json` - For top stories by section
- **Features**:
  - Section-based news (arts, business, politics, technology, etc.)
  - Advanced filtering using Elasticsearch query syntax
  - Sort by newest articles
  - Support for the April 8, 2025 API update

### API Fallback System
- The application implements an intelligent fallback system:
  1. First attempts to use NewsAPI (most comprehensive)
  2. Falls back to GNews if NewsAPI fails or has insufficient results
  3. Falls back to NYT if needed
  4. Can use DuckDuckGo News as a final fallback (no API key required)
  5. Generates demo content as last resort

### API Key Configuration
- Set the following environment variables:
  ```
  NEWS_API_KEY=your_newsapi_key
  GNEWS_API_KEY=your_gnews_key
  NYT_API_KEY=your_nytimes_key
  ```

## Database Integration

The application uses Supabase for database operations:

- **Connection Method**: Uses Supabase client API rather than direct PostgreSQL connections
- **SQL Execution**: Uses an `exec_sql` stored procedure for executing SQL through the REST API
- **Connection Pooling**: Implements `?pgbouncer=true` parameter for reliable connections
- **Benefits**: More reliable for cloud-hosted databases compared to direct PostgreSQL connections

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- Docker and Docker Compose (optional, for containerization)
- NewsAPI API key (or other news data source)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd news-recommendation
   ```

2. Set up environment variables:
   - Create a `.env` file in the project root
   - Add the following variables:
     ```
     NEWS_API_KEY=your_api_key_here
     REACT_APP_API_URL=http://localhost:8000/api
     ```

### Running Locally

#### Without Docker (Development)

1. Start the backend server:
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

#### With Docker

1. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the application at [http://localhost:3000](http://localhost:3000)

### Deployment

#### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel:
   - `NEWS_API_KEY`
   - Any other environment variables needed for your deployment

3. Deploy with the following settings:
   - Framework preset: Custom (not required to be changed)
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/build`
   - Install command: `npm install`

## Project Structure

```
/
├── api/                  # Backend API
│   ├── db/              # Database and caching
│   ├── models/          # Data models
│   ├── services/        # Business logic & services
│   └── main.py          # FastAPI application entry point
├── data/                # Data storage
├── deployment/          # Deployment configurations
│   ├── docker/          # Docker files
│   └── nginx/           # Nginx configuration
├── feature_extraction/  # ML feature extraction
├── frontend/           # React frontend
│   ├── public/          # Static files
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── context/     # Context providers
│       ├── pages/       # Page components
│       └── services/    # API services
├── models/             # ML model definitions
├── tests/              # Test files
└── docker-compose.yml  # Docker Compose configuration
```

## API Reference

- **GET /api/news/search**: Search for news articles
  - Query params: `query`, `page`, `page_size`

- **GET /api/news/trending**: Get trending news
  - Query params: `category`, `page`, `page_size`

- **GET /api/news/summary**: Generate article summary
  - Query params: `url`

- **GET /api/news/recommendations**: Get article recommendations
  - Query params: `article_id`, `user_interests[]`, `max_results`

## Extending the Project

### Adding New Data Sources

To add a new news source, modify the `news_fetcher.py` service to include additional API integrations.

### Customizing the Recommendation Algorithm

The recommendation system uses sentence embeddings by default. To customize:

1. Modify the `recommendation.py` service
2. Replace or enhance the embedding model
3. Add additional features for better recommendations

### Training Custom Models

For a fully custom solution, you can train your own models:

1. Use the `feature_extraction` directory to prepare your data
2. Train models using your preferred ML framework
3. Save models to the `models` directory
4. Update services to use your custom models

## License

MIT License - see LICENSE file for details.

## Acknowledgements

- [NewsAPI](https://newsapi.org/) for news data
- [Hugging Face](https://huggingface.co/) for open-source models
- [Sentence Transformers](https://www.sbert.net/) for embeddings
- [React](https://reactjs.org/) and [FastAPI](https://fastapi.tiangolo.com/) for the application framework
