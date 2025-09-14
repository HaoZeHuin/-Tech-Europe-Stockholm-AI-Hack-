#!/bin/bash

# Hackathon Setup Script - Single Virtual Environment
echo " Setting up Jarvis Voice Agent for Hackathon..."

# Check if Python 3.9+ is available
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
required_version="3.9"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo " Python 3.9+ required. Found: $python_version"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

echo " Python version: $python_version"

# Create virtual environment
echo " Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo " Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆ Upgrading pip..."
pip install --upgrade pip

# Install all dependencies from MASTER requirements file
echo " Installing dependencies from master requirements.txt..."
pip install -r requirements.txt

# Install frontend dependencies
echo " Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo " Setup complete!"
echo ""
echo " To start the application:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Start backend: cd backend/python-services/gateway && python main.py"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo " Happy hacking!"
