#!/bin/bash

# Jarvis Backend Services Stop Script
echo " Stopping Jarvis Backend Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process by PID file
kill_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}Force killing $service_name...${NC}"
                kill -9 $pid
            fi
            echo -e "${GREEN}$service_name stopped${NC}"
        else
            echo -e "${YELLOW}$service_name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file found for $service_name${NC}"
    fi
}

# Stop services
kill_service "Express Gateway" ".express-gateway.pid"
kill_service "n8n Service" ".n8n-service.pid"
kill_service "RAG Service" ".rag-service.pid"

# Kill any remaining processes on our ports
echo -e "${YELLOW}Cleaning up any remaining processes...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:8002 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN} All services stopped!${NC}"
echo -e "${YELLOW}Infrastructure services (Docker) are still running.${NC}"
echo -e "${YELLOW}To stop them, run:${NC} docker-compose -f ../infra/docker-compose.yml down"
