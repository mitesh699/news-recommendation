#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo "${YELLOW}News Recommendation System Setup${NC}"

# Navigate to project directory
cd "$(dirname "$0")"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "${RED}Python 3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
fi

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if activation worked
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "${RED}Failed to activate virtual environment.${NC}"
    exit 1
fi

# Upgrade pip
echo "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo "${YELLOW}Installing dependencies...${NC}"
pip install -r api/requirements.txt

# This is important for ensuring sentence-transformers work properly
echo "${YELLOW}Installing additional dependencies for sentence-transformers...${NC}"
pip install transformers

# Copy .env file to api directory for better accessibility
echo "${YELLOW}Copying .env file to api directory...${NC}"
cp .env api/.env

echo "${GREEN}Setup completed successfully!${NC}"
echo "\nTo run the application, use:\n${YELLOW}python run_api.py${NC}\n"
