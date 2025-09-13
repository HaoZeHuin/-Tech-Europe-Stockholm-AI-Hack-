#!/bin/bash

# Jarvis Backend Dependencies Installation Script
echo "Installing Jarvis Backend Dependencies..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}[ERROR] Python3 not found. Please install Python 3.8+${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] Python3 found: $(python3 --version)${NC}"
fi

if ! command_exists pip; then
    echo -e "${RED}[ERROR] pip not found. Please install pip${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] pip found: $(pip --version)${NC}"
fi

# Install Gateway Service dependencies
echo -e "${BLUE}Installing Gateway Service (Python) dependencies...${NC}"
cd python-services/gateway
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] Gateway Service dependencies installed${NC}"
    else
        echo -e "${RED}[ERROR] Failed to install Gateway Service dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}[ERROR] python-services/gateway/requirements.txt not found${NC}"
    exit 1
fi
cd ../..

# Install Python services dependencies
echo -e "${BLUE}Installing Python services dependencies...${NC}"

# n8n service
echo -e "${YELLOW}Installing n8n-service dependencies...${NC}"
cd python-services/n8n-service
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] n8n-service dependencies installed${NC}"
    else
        echo -e "${RED}[ERROR] Failed to install n8n-service dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}[ERROR] n8n-service/requirements.txt not found${NC}"
    exit 1
fi
cd ../..

# RAG service
echo -e "${YELLOW}Installing rag-service dependencies...${NC}"
cd python-services/rag-service
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] rag-service dependencies installed${NC}"
    else
        echo -e "${RED}[ERROR] Failed to install rag-service dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}[ERROR] rag-service/requirements.txt not found${NC}"
    exit 1
fi
cd ../..

echo -e "${GREEN}[SUCCESS] All dependencies installed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Copy environment files:"
echo -e "   ${YELLOW}cp python-services/gateway/env.example python-services/gateway/.env${NC}"
echo -e "   ${YELLOW}cp python-services/n8n-service/env.example python-services/n8n-service/.env${NC}"
echo -e "   ${YELLOW}cp python-services/rag-service/env.example python-services/rag-service/.env${NC}"
echo ""
echo -e "2. Add your OpenAI API key to all .env files"
echo ""
echo -e "3. Start services:"
echo -e "   ${YELLOW}./scripts/start-services.sh${NC}"
