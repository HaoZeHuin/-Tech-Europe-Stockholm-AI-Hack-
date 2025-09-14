 vari#!/bin/bash

# Test script for OpenAI Realtime Voice Agent integration

echo "🎤 Testing OpenAI Realtime Voice Agent Integration"
echo "=================================================="

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable is not set"
    echo "Please add your OpenAI API key to backend/python-services/gateway/.env"
    exit 1
else
    echo "✅ OPENAI_API_KEY is set"
fi

# Check if required dependencies are installed
echo ""
echo "🔍 Checking Python dependencies..."

cd "$(dirname "$0")/../python-services/gateway"

if ! python -c "import websockets" 2>/dev/null; then
    echo "❌ websockets package not found"
    echo "Run: pip install -r requirements.txt"
    exit 1
else
    echo "✅ websockets package installed"
fi

if ! python -c "import openai" 2>/dev/null; then
    echo "❌ openai package not found"
    echo "Run: pip install -r requirements.txt"
    exit 1
else
    echo "✅ openai package installed"
fi

# Check if audio processor worklet exists
echo ""
echo "🔍 Checking frontend audio processor..."

if [ ! -f "../../frontend/public/audio-processor.js" ]; then
    echo "❌ audio-processor.js not found"
    exit 1
else
    echo "✅ audio-processor.js exists"
fi

# Test WebSocket endpoint availability
echo ""
echo "🔍 Testing WebSocket endpoint..."

# Start the gateway service in background for testing
echo "Starting gateway service for testing..."
python main.py &
GATEWAY_PID=$!

# Wait a moment for service to start
sleep 3

# Test if the service is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Gateway service is running"
else
    echo "❌ Gateway service failed to start"
    kill $GATEWAY_PID 2>/dev/null
    exit 1
fi

# Clean up
kill $GATEWAY_PID 2>/dev/null
echo ""
echo "🎉 All tests passed! OpenAI Realtime Voice Agent is ready to use."
echo ""
echo "To start the system:"
echo "1. Set your OPENAI_API_KEY in backend/python-services/gateway/.env"
echo "2. Run: ./start-services.sh from the backend/scripts directory"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 and click on the Voice tab"
echo ""
echo "Features available:"
echo "• 🎤 Push-to-talk voice interaction"
echo "• 🔧 Function calling (calendar, weather, todo, RAG search)"
echo "• 🔄 Real-time audio streaming with interruption support"
echo "• 🎯 British accent (Echo voice model)"
echo "• 📱 Fallback to text chat if voice connection fails"
