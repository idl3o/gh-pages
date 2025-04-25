#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RESET='\033[0m'

# Print banner
echo -e "${BLUE}"
echo "┌─────────────────────────────────────────────┐"
echo "│  Web3 Crypto Streaming - Local Test Script  │"
echo "└─────────────────────────────────────────────┘"
echo -e "${RESET}"

# Check if dependencies are installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js and npm are required but not installed.${RESET}"
    echo "Please visit https://nodejs.org to install Node.js."
    exit 1
fi

# Check for Python for running HTTP server
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${YELLOW}Warning: Python not found. Will use Node's http-server instead.${RESET}"
    PYTHON_AVAILABLE=false
else
    PYTHON_AVAILABLE=true
fi

# Install dependencies if needed
if [ ! -d "node_modules/cheerio" ] || [ ! -d "node_modules/node-fetch" ]; then
    echo -e "${BLUE}Installing required dependencies...${RESET}"
    npm install cheerio node-fetch@2
fi

# Function to run URL checker
run_url_checker() {
    echo -e "\n${BLUE}Checking URLs in the website...${RESET}"
    node scripts/url-checker.js

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✓ All URLs are valid!${RESET}"
    else
        echo -e "\n${RED}✗ Some URLs are broken. Please fix them before continuing.${RESET}"
        read -p "Continue with local server anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Exiting."
            exit 1
        fi
    fi
}

# Function to start the server
start_server() {
    echo -e "\n${BLUE}Starting local server...${RESET}"

    if [ "$PYTHON_AVAILABLE" = true ]; then
        # Use Python's built-in HTTP server
        if command -v python3 &> /dev/null; then
            echo -e "${GREEN}Server started at http://localhost:8000${RESET}"
            echo -e "${YELLOW}Press Ctrl+C to stop the server${RESET}\n"
            python3 -m http.server
        else
            echo -e "${GREEN}Server started at http://localhost:8000${RESET}"
            echo -e "${YELLOW}Press Ctrl+C to stop the server${RESET}\n"
            python -m SimpleHTTPServer
        fi
    else
        # Use Node's http-server
        if [ ! -d "node_modules/http-server" ]; then
            echo "Installing http-server..."
            npm install http-server --no-save
        fi
        echo -e "${GREEN}Server started at http://localhost:8080${RESET}"
        echo -e "${YELLOW}Press Ctrl+C to stop the server${RESET}\n"
        npx http-server
    fi
}

# Handle command line arguments
if [ "$1" = "--check-only" ]; then
    run_url_checker
elif [ "$1" = "--server-only" ]; then
    start_server
else
    # Run both checks and server
    run_url_checker
    start_server
fi
