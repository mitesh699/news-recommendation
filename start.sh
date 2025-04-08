#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo "${YELLOW}News Recommendation System Startup${NC}"

# Navigate to project directory
cd "$(dirname "$0")"

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "${YELLOW}Creating virtual environment...${NC}"
  python3 -m venv venv
fi

# Ensure proper activation of virtual environment
SOURCE_CMD="source venv/bin/activate"
if [ -f "venv/bin/activate" ]; then
  echo "${YELLOW}Activating virtual environment...${NC}"
  source venv/bin/activate
  
  # Verify activation worked
  if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "${RED}Failed to activate virtual environment.${NC}"
    exit 1
  fi

  echo "${YELLOW}Installing/updating dependencies...${NC}"
  pip install --upgrade pip
  pip install -r api/requirements.txt
else
  echo "${RED}Virtual environment activation script not found.${NC}"
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "${RED}Error: .env file not found${NC}"
  echo "Please create a .env file with your Supabase and Upstash credentials"
  exit 1
fi

# Copy .env file to api directory for better accessibility
cp .env api/.env

# Navigate to API directory
cd api

# Initialize the database through Python
echo "${YELLOW}Initializing database...${NC}"
python -c "import asyncio; from db.init_db import init_db; asyncio.run(init_db())"

# Start the FastAPI application
echo "${GREEN}Starting FastAPI server...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
