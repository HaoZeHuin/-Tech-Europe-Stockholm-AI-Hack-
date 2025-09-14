# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **SSL Certificate Errors** 

**Problem**: `ssl.SSLCertVerificationError: certificate verify failed`

**Cause**: Python 3.13 on macOS doesn't automatically trust system certificates.

**Solutions**:
```bash
# Solution 1: Install certificates (Recommended)
/Applications/Python\ 3.13/Install\ Certificates.command

# Solution 2: Environment variables
export SSL_CERT_FILE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem
export REQUESTS_CA_BUNDLE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem

# Solution 3: Add to .env file
echo "SSL_CERT_FILE=/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem" >> backend/python-services/gateway/.env
```

### **Dependency Conflicts**

**Problem**: `ERROR: Cannot install openai-agents==0.3.0 and openai>=1.100.0 because these package versions have conflicting dependencies`

**Cause**: Using multiple requirements.txt files with conflicting version ranges.

**Solution**:
```bash
# Clean install with master requirements
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt  # ONLY use project root requirements.txt

# Verify versions
pip list | grep -E "(openai|websockets|openai-agents)"
```

**Expected Output**:
```
openai                1.107.2
openai-agents         0.3.0  
websockets            14.2
```

### **Audio Not Playing**

**Problem**: Backend logs show audio chunks but no sound in frontend.

**Causes & Solutions**:

1. **Sample Rate Mismatch**:
```javascript
// Ensure 24kHz throughout pipeline
const audioContext = new AudioContext({ sampleRate: 24000 });
const audioPlaybackContext = new AudioContext({ sampleRate: 24000 });
```

2. **AudioContext Suspended**:
```javascript
// Resume AudioContext
if (audioPlaybackContext.state === 'suspended') {
  await audioPlaybackContext.resume();
}
```

3. **Jitter Buffer Issues**:
```javascript
// Reset playback timeline
nextScheduledTimeRef.current = null;
```

### **WebSocket Connection Errors**

**Problem**: WebSocket connection fails or drops frequently.

**Debugging Steps**:
```bash
# Check backend is running
curl http://localhost:8000/health

# Test WebSocket connection
wscat -c ws://localhost:8000/api/realtime/test_session

# Check for port conflicts
lsof -i :8000
lsof -i :5173
```

**Common Fixes**:
```javascript
// Add reconnection logic
const reconnect = () => {
  setTimeout(() => {
    if (wsRef.current?.readyState === WebSocket.CLOSED) {
      initializeConnection();
    }
  }, 1000);
};
```

### **Microphone Not Working**

**Problem**: No audio being captured from microphone.

**Solutions**:

1. **Check Browser Permissions**:
   - Chrome: Settings → Privacy and security → Site Settings → Microphone
   - Firefox: Address bar → Shield icon → Permissions
   - Safari: Safari → Settings → Websites → Microphone

2. **Test Microphone Access**:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone access granted'))
  .catch(error => console.error('Microphone access denied:', error));
```

3. **Check Audio Constraints**:
```javascript
const constraints = {
  audio: {
    sampleRate: 24000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
};
```

### **Frontend Build Issues**

**Problem**: Build fails or development server won't start.

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+

# Clear Vite cache
rm -rf .vite

# Check for TypeScript errors
npm run type-check
```

### **Backend Service Issues**

**Problem**: Backend service fails to start or crashes.

**Debugging Steps**:
```bash
# Check Python version
python --version  # Should be 3.8+

# Activate virtual environment
source venv/bin/activate

# Check installed packages
pip list

# Run with verbose logging
cd backend/python-services/gateway
python -v main.py

# Check environment variables
cat .env
```

## 🔍 Debugging Tools

### **Frontend Debugging**

```javascript
// Enable detailed logging
const DEBUG = true;

// WebSocket message logging
wsRef.current.addEventListener('message', (event) => {
  if (DEBUG) {
    console.log('WebSocket message:', JSON.parse(event.data));
  }
});

// Audio pipeline debugging
console.log('Audio format:', {
  sampleRate: audioContext.sampleRate,
  state: audioContext.state,
  bufferSize: processorNode.bufferSize
});
```

### **Backend Debugging**

```python
# Enable debug logging in main.py
import logging
logging.basicConfig(level=logging.DEBUG)

# WebSocket message logging
logger.info(f"Received message: {message}")
logger.info(f"Audio chunk: {len(audio_bytes)} bytes")

# OpenAI API debugging
logger.debug(f"OpenAI response: {response}")
```

### **Network Debugging**

```bash
# Monitor WebSocket traffic
# Chrome DevTools → Network → WS → Select connection → Messages

# Check network connectivity
ping api.openai.com
nslookup api.openai.com

# Monitor ports
netstat -an | grep -E "(8000|5173)"
```

## 📊 Performance Issues

### **High CPU Usage**

**Causes & Solutions**:

1. **Audio Processing**:
```javascript
// Optimize buffer size
const bufferSize = 512; // ~21ms at 24kHz (good balance)

// Use efficient conversion
const int16Buffer = new Int16Array(audioData.length);
for (let i = 0; i < audioData.length; i++) {
  int16Buffer[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
}
```

2. **React Re-renders**:
```javascript
// Memoize expensive operations
const memoizedAudioProcessor = useMemo(() => {
  return new AudioWorkletNode(audioContext, 'audio-processor');
}, [audioContext]);

// Use callbacks to prevent re-renders
const handleAudioData = useCallback((data) => {
  // Process audio
}, []);
```

### **Memory Leaks**

**Prevention**:
```javascript
// Clean up resources
useEffect(() => {
  return () => {
    // Close WebSocket
    wsRef.current?.close();
    
    // Close AudioContext
    audioContextRef.current?.close();
    
    // Clear buffers
    audioBufferRef.current = [];
    nextScheduledTimeRef.current = null;
  };
}, []);
```

### **Audio Latency**

**Optimization**:
```javascript
// Minimize jitter buffer
const JITTER_BUFFER_MS = 80; // Balance between smoothness and latency

// Optimize AudioWorklet buffer
const bufferSize = 512; // Smaller = lower latency, higher CPU

// Use timeline scheduling
const startTime = Math.max(
  audioContext.currentTime + 0.02, // Minimal delay
  nextScheduledTime
);
```

## 🛠️ Development Environment

### **IDE Setup**

**VS Code Extensions**:
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Python Extension Pack
- REST Client (for API testing)

**Settings**:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "python.defaultInterpreterPath": "./venv/bin/python"
}
```

### **Git Issues**

**Large File Problems**:
```bash
# Remove large files from tracking
echo "venv/" >> .gitignore
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore

# Clean git cache
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```

## 🔧 Production Issues

### **Deployment Problems**

**Environment Variables**:
```bash
# Production .env
OPENAI_API_KEY=sk-prod-key
NODE_ENV=production
PYTHONPATH=/app
```

**CORS Issues**:
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Scaling Issues**

**WebSocket Connection Limits**:
```python
# Increase connection limits
import uvicorn

uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    ws_max_size=16777216,  # 16MB
    ws_ping_interval=20,
    ws_ping_timeout=10
)
```

## 📞 Getting Help

### **Debug Information to Collect**

When reporting issues, include:

1. **System Info**:
```bash
python --version
node --version
pip list | grep -E "(openai|websockets|fastapi)"
npm list react vite typescript
```

2. **Error Logs**:
   - Browser console errors
   - Backend service logs
   - Network tab in DevTools

3. **Environment**:
   - Operating system
   - Browser version
   - Python virtual environment status

### **Common Log Patterns**

**Successful Connection**:
```
INFO: WebSocket /api/realtime/session_123 [accepted]
INFO: connection open
INFO: Connected to OpenAI Realtime API
```

**Audio Processing**:
```
INFO: Received audio via input_audio_buffer.append: 1024 bytes
INFO: Audio chunk sent: 512 samples
INFO: Scheduled audio chunk: 1024 samples (42.7ms) at time 1.234
```

**Errors to Watch For**:
```
ERROR: SSL certificate verification failed
ERROR: Cannot install openai-agents==0.3.0
ERROR: WebSocket connection failed
ERROR: AudioContext suspended
```

---

**Most issues can be resolved with the solutions above. For persistent problems, check the logs and system requirements!** 🔧✨
