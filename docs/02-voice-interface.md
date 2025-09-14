# Voice Interface

## 🎤 Overview

The voice interface provides **real-time speech-to-speech communication** using OpenAI's Realtime API, enabling natural conversation with Jarvis through a push-to-talk interface.

## 🏗️ Architecture

### **WebSocket Connection Flow**
```
Frontend                 Backend Gateway         OpenAI Realtime API
   │                           │                         │
   ├─ WebSocket Connect ───────┤                         │
   │                           ├─ Establish Session ─────┤
   │                           │                         │
   ├─ Audio Stream ────────────┤                         │
   │                           ├─ Forward Audio ─────────┤
   │                           │                         │
   │                           ├─ Receive Response ──────┤
   ├─ Audio Playback ──────────┤                         │
```

### **Component Structure**
```
RealtimeVoiceInterface.tsx
├── Connection Management
│   ├── WebSocket initialization
│   ├── AudioContext setup
│   └── Session management
├── Audio Processing
│   ├── AudioWorklet (microphone)
│   ├── PCM16 conversion
│   └── Jitter buffer (playback)
├── User Interface
│   ├── Push-to-talk button
│   ├── Connection status
│   └── Speaking indicators
└── Event Handling
    ├── WebSocket messages
    ├── Audio data processing
    └── Error management
```

## 🎯 User Interaction

### **Push-to-Talk Interface**
1. **Click** voice button to start listening
2. **Speak** while button is active
3. **Release** button to send audio to Jarvis
4. **Listen** to Jarvis response with visual feedback

### **Visual Feedback**
- **Connection Status**: Shows WebSocket connection state
- **Listening Indicator**: Active when capturing audio
- **Speaking Indicator**: Active when Jarvis is responding
- **Button States**: Visual feedback for interaction states

## 🔧 Technical Implementation

### **Audio Pipeline**

#### **Input Processing**
```javascript
// AudioWorklet captures microphone at 24kHz
navigator.mediaDevices.getUserMedia({ 
  audio: { 
    sampleRate: 24000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  } 
})

// Convert Float32 to Int16 PCM
const int16Data = new Int16Array(float32Data.length);
for (let i = 0; i < float32Data.length; i++) {
  int16Data[i] = Math.max(-32768, Math.min(32767, float32Data[i] * 32767));
}

// Encode to base64 for WebSocket transmission
const base64Audio = int16ToBase64(int16Data);
```

#### **Output Processing**
```javascript
// Jitter buffer for smooth playback
const JITTER_BUFFER_MS = 80;
const enqueuePlaybackChunk = async (audioData) => {
  const audioBuffer = audioContext.createBuffer(1, pcm16Data.length, 24000);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Schedule with timeline for smooth playback
  const startTime = Math.max(
    audioContext.currentTime + 0.02, 
    nextScheduledTime
  );
  source.start(startTime);
  nextScheduledTime = startTime + (audioBuffer.length / 24000);
};
```

### **WebSocket Protocol**

#### **Sending Audio**
```javascript
// Send audio to backend
websocket.send(JSON.stringify({
  type: 'input_audio_buffer.append',
  audio: base64AudioData
}));

// Commit audio buffer
websocket.send(JSON.stringify({
  type: 'input_audio_buffer.commit'
}));
```

#### **Receiving Audio**
```javascript
// Handle incoming audio response
case 'response.audio.delta':
  const audioData = base64ToArrayBuffer(data.delta);
  enqueuePlaybackChunk(audioData);
  break;

case 'response.audio.done':
  setIsSpeaking(false);
  break;
```

### **Audio Format Specifications**

| Property | Value | Description |
|----------|--------|-------------|
| **Format** | PCM16 | 16-bit linear PCM |
| **Sample Rate** | 24kHz | High quality audio |
| **Channels** | Mono | Single channel |
| **Encoding** | Base64 | For WebSocket transmission |
| **Buffer Size** | 512 samples | ~21ms at 24kHz |

## 🎛️ Configuration

### **Audio Context Setup**
```javascript
const audioContext = new (window.AudioContext || window.webkitAudioContext)({
  sampleRate: 24000  // Match OpenAI Realtime API
});

const audioPlaybackContext = new (window.AudioContext || window.webkitAudioContext)({
  sampleRate: 24000  // Ensure consistent playback rate
});
```

### **Jitter Buffer Configuration**
```javascript
const JITTER_BUFFER_MS = 80;  // 80ms buffer for smooth playback
let nextScheduledTime = null;  // Timeline scheduling reference
```

### **AudioWorklet Registration**
```javascript
await audioContext.audioWorklet.addModule('/audio-processor.js');
const processorNode = new AudioWorkletNode(audioContext, 'audio-processor', {
  processorOptions: { bufferSize: 512 }  // ~21ms buffer
});
```

## 🚨 Error Handling

### **Connection Errors**
```javascript
websocket.onerror = (error) => {
  console.error('WebSocket error:', error);
  setConnectionStatus('error');
  // Attempt reconnection logic
};

websocket.onclose = (event) => {
  if (event.code !== 1000) {  // Not a normal closure
    console.error('WebSocket closed unexpectedly:', event);
    // Handle reconnection
  }
};
```

### **Audio Errors**
```javascript
// AudioContext state handling
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}

// Microphone permission errors
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  console.error('Microphone access denied:', error);
  // Show permission request UI
}
```

### **SSL Certificate Issues**
Common on macOS Python 3.13:
```bash
# Install certificates
/Applications/Python\ 3.13/Install\ Certificates.command

# Or set environment variables
SSL_CERT_FILE=/path/to/certifi/cacert.pem
```

## 📊 Performance Monitoring

### **Latency Tracking**
```javascript
// Measure round-trip latency
const startTime = Date.now();
websocket.send(audioData);

// On response
const latency = Date.now() - startTime;
console.log(`Voice round-trip: ${latency}ms`);
```

### **Audio Quality Metrics**
- **Buffer underruns**: Monitor for choppy playback
- **Sample rate consistency**: Ensure 24kHz throughout pipeline
- **Jitter buffer efficiency**: Track scheduling accuracy

## 🔧 Development & Debugging

### **Console Logging**
```javascript
// Enable detailed audio logging
console.log(`Sent audio: ${audioData.length} bytes`);
console.log(`Received audio: ${audioChunk.length} samples`);
console.log(`Scheduled at: ${startTime.toFixed(3)}s`);
```

### **WebSocket Debugging**
```javascript
// Monitor WebSocket messages
websocket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('WebSocket message:', data.type, data);
});
```

### **Audio Pipeline Debugging**
```javascript
// Verify audio format
console.log('Audio format:', {
  sampleRate: audioContext.sampleRate,
  channels: audioBuffer.numberOfChannels,
  length: audioBuffer.length
});
```

## 🎯 Best Practices

### **User Experience**
- **Clear visual feedback** for all interaction states
- **Graceful error handling** with user-friendly messages
- **Responsive button states** for immediate feedback
- **Consistent audio quality** across different devices

### **Performance**
- **Efficient audio processing** with minimal CPU usage
- **Proper memory management** for audio buffers
- **Timeline-based scheduling** for smooth playback
- **Connection pooling** for WebSocket reliability

### **Accessibility**
- **Keyboard navigation** support
- **Screen reader compatibility**
- **Visual indicators** for audio states
- **Alternative input methods** for users who can't use voice

---

**The voice interface provides a seamless, real-time conversation experience with Jarvis!** 🎤✨