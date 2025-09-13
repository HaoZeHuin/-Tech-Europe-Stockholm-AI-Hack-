#!/bin/bash

# Jarvis Backend Services Startup Script
echo " Starting Jarvis Backend Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}Port $1 is available${NC}"
        return 0
    fi
}

# Check required ports
echo -e "${BLUE}Checking ports...${NC}"
check_port 3001 || exit 1  # Express Gateway
check_port 8001 || exit 1  # n8n Service
check_port 8002 || exit 1  # RAG Service

# Start infrastructure services (if not already running)
echo -e "${BLUE}Starting infrastructure services...${NC}"
if ! docker ps | grep -q "jarvis-weaviate"; then
    echo -e "${YELLOW}Starting Docker infrastructure...${NC}"
    docker-compose -f ../shared/infra/docker-compose.yml up -d
    echo -e "${GREEN}Waiting for services to be ready...${NC}"
    sleep 10
else
    echo -e "${GREEN}Infrastructure services already running${NC}"
fi

# Start Python services in background
echo -e "${BLUE}Starting Python services...${NC}"

# Start n8n service (placeholder - Iggy will implement n8n integration)
echo -e "${YELLOW}Starting n8n service on port 8001...${NC}"
cd python-services/n8n-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
N8N_PID=$!
cd ../..

# Start RAG service
echo -e "${YELLOW}Starting RAG service on port 8002...${NC}"
cd python-services/rag-service
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload &
RAG_PID=$!
cd ../..

# Wait a moment for Python services to start
sleep 5

# Start Express Gateway
echo -e "${YELLOW}Starting Express Gateway on port 3001...${NC}"
cd express-gateway
npm run dev &
EXPRESS_PID=$!
cd ..

# Store PIDs for cleanup
echo $N8N_PID > .n8n-service.pid
echo $RAG_PID > .rag-service.pid  
echo $EXPRESS_PID > .express-gateway.pid

echo -e "${GREEN} All services started!${NC}"
echo -e "${BLUE}Services running on:${NC}"
echo -e "   Express Gateway: http://localhost:3001"
echo -e "   n8n Service: http://localhost:8001"
echo -e "   RAG Service: http://localhost:8002"
echo -e "   n8n UI: http://localhost:5678"
echo -e "    Weaviate: http://localhost:8080"
echo ""
echo -e "${YELLOW}Health checks:${NC}"
echo -e "  curl http://localhost:3001/api/health"
echo -e "  curl http://localhost:8001/health"
echo -e "  curl http://localhost:8002/health"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC} ./stop-services.sh"

# Keep script running
wait
