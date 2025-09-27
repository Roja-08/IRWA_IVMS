#!/bin/bash

echo "Starting Intelligent Volunteer Matching System Backend..."

# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
python main.py
