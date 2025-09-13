#!/bin/bash

# Jarvis Backend Connection Test Script
echo "Testing Jarvis Backend Connections..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name ($url)... "
    
    if curl -s -f "$url" > /dev/null; then
        echo -e "${GREEN}[OK]${NC}"
        return 0
    else
        echo -e "${RED}[FAIL]${NC}"
        return 1
    fi
}

# Test all services
echo -e "${BLUE}Testing service health endpoints...${NC}"

# Test Express Gateway
test_endpoint "http://localhost:3001/api/health" "Express Gateway"
EXPRESS_OK=$?

# Test n8n Service  
test_endpoint "http://localhost:8001/health" "n8n Service"
N8N_OK=$?

# Test RAG Service
test_endpoint "http://localhost:8002/health" "RAG Service"
RAG_OK=$?

# Test infrastructure services (if running)
echo -e "${BLUE}Testing infrastructure services...${NC}"

test_endpoint "http://localhost:8080/v1/.well-known/ready" "Weaviate"
WEAVIATE_OK=$?

test_endpoint "http://localhost:5678/healthz" "n8n UI"
N8N_UI_OK=$?

# Summary
echo ""
echo -e "${BLUE}Connection Test Summary:${NC}"

if [ $EXPRESS_OK -eq 0 ]; then
    echo -e "Express Gateway: ${GREEN}[CONNECTED]${NC}"
else
    echo -e "Express Gateway: ${RED}[DISCONNECTED]${NC}"
fi

if [ $N8N_OK -eq 0 ]; then
    echo -e "n8n Service: ${GREEN}[CONNECTED]${NC}"
else
    echo -e "n8n Service: ${RED}[DISCONNECTED]${NC}"
fi

if [ $RAG_OK -eq 0 ]; then
    echo -e "RAG Service: ${GREEN}[CONNECTED]${NC}"
else
    echo -e "RAG Service: ${RED}[DISCONNECTED]${NC}"
fi

if [ $WEAVIATE_OK -eq 0 ]; then
    echo -e "Weaviate: ${GREEN}[CONNECTED]${NC}"
else
    echo -e "Weaviate: ${YELLOW}[DISCONNECTED - Kenneth will set up]${NC}"
fi

if [ $N8N_UI_OK -eq 0 ]; then
    echo -e "n8n UI: ${GREEN}[CONNECTED]${NC}"
else
    echo -e "n8n UI: ${YELLOW}[DISCONNECTED - Iggy will set up]${NC}"
fi

echo ""

# Test basic chat functionality (if Express Gateway is up)
if [ $EXPRESS_OK -eq 0 ]; then
    echo -e "${BLUE}Testing basic chat functionality...${NC}"
    
    CHAT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/chat \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello, test connection"}' 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$CHAT_RESPONSE" ]; then
        echo -e "Chat endpoint: ${GREEN}[OK]${NC}"
        echo "Sample response: $(echo $CHAT_RESPONSE | head -c 100)..."
    else
        echo -e "Chat endpoint: ${RED}[FAIL - Check OpenAI API key]${NC}"
    fi
else
    echo -e "${YELLOW}Skipping chat test - Express Gateway not running${NC}"
fi

echo ""
echo -e "${BLUE}What should work right now:${NC}"
echo "- Express Gateway health check"
echo "- Python services health checks"
echo "- Basic service communication"
echo "- Chat endpoint (with valid OpenAI API key)"
echo ""
echo -e "${YELLOW}What's waiting for team members:${NC}"
echo "- Weaviate integration (Kenneth)"
echo "- n8n workflows (Iggy)"
