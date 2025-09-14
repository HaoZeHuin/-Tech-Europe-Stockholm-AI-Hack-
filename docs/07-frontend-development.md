# Frontend Development

## 🎯 Overview

The frontend is built with **React + Vite + TypeScript** and provides a modern voice-first interface for interacting with Jarvis. The main focus is on real-time voice communication with beautiful UI components.

## 🏗️ Architecture

### **Tech Stack**
- **React 18** with TypeScript
- **Vite** for fast development and HMR
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **WebSocket** for real-time communication
- **Web Audio API** for audio processing

### **Project Structure**
```
frontend/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # Shadcn/ui components
│   │   ├── RealtimeVoiceInterface.tsx  # Main voice component
│   │   ├── AppSidebar.tsx      # Navigation sidebar
│   │   ├── ThemeToggle.tsx     # Dark/light mode
│   │   └── ...
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Main page layout
│   │   └── NotFound.tsx        # 404 page
│   ├── lib/                    # Utilities
│   │   └── utils.ts            # Helper functions
│   ├── hooks/                  # Custom React hooks
│   └── assets/                 # Static assets
├── public/                     # Public assets
│   ├── audio-processor.js      # AudioWorklet processor
│   └── ...
└── package.json               # Frontend dependencies
```

## 🎤 Voice Interface Component

### **RealtimeVoiceInterface.tsx**

The core component handling real-time voice interaction:

```typescript
export function RealtimeVoiceInterface({ className }: RealtimeVoiceInterfaceProps) {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // WebSocket and Audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlaybackContextRef = useRef<AudioContext | null>(null);
  
  // Audio processing refs
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioBufferRef = useRef<Int16Array[]>([]);
  const nextScheduledTimeRef = useRef<number | null>(null);
  
  // ... implementation
}
```

### **Key Features**

#### **1. Connection Management**
```typescript
const initializeConnection = async () => {
  try {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 24000
    });
    
    // Initialize WebSocket
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    wsRef.current = new WebSocket(`ws://localhost:8000/api/realtime/${sessionId}`);
    
    // Set up event handlers
    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onmessage = handleWebSocketMessage;
    wsRef.current.onclose = () => setIsConnected(false);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

#### **2. Audio Capture**
```typescript
const startListening = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 24000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    }
  });
  
  // Register AudioWorklet
  await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
  
  // Create processor node
  processorNodeRef.current = new AudioWorkletNode(
    audioContextRef.current,
    'audio-processor',
    { processorOptions: { bufferSize: 512 } }
  );
  
  // Handle audio data
  processorNodeRef.current.port.onmessage = (event) => {
    const audioData = event.data;
    audioBufferRef.current.push(new Int16Array(audioData));
  };
};
```

#### **3. Push-to-Talk Logic**
```typescript
const togglePushToTalk = () => {
  if (!isConnected) return;
  
  if (isListening) {
    // Stop listening and send accumulated audio
    setIsListening(false);
    
    if (audioBufferRef.current.length > 0) {
      sendAccumulatedAudio();
    }
    
    // Commit audio buffer
    wsRef.current?.send(JSON.stringify({
      type: 'input_audio_buffer.commit'
    }));
  } else {
    // Start listening
    setIsListening(true);
    startListening();
  }
};
```

#### **4. Audio Playback with Jitter Buffer**
```typescript
const JITTER_BUFFER_MS = 80;

const enqueuePlaybackChunk = async (audioData: ArrayBuffer) => {
  const ctx = audioPlaybackContextRef.current;
  if (!ctx) return;
  
  // Convert PCM16 to AudioBuffer
  const pcm16Data = new Int16Array(audioData);
  const audioBuffer = ctx.createBuffer(1, pcm16Data.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  
  // Convert Int16 to Float32
  for (let i = 0; i < pcm16Data.length; i++) {
    channelData[i] = pcm16Data[i] / 32768.0;
  }
  
  // Schedule playback with timeline
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  
  if (!nextScheduledTimeRef.current) {
    nextScheduledTimeRef.current = ctx.currentTime + (JITTER_BUFFER_MS / 1000);
  }
  
  const startTime = Math.max(
    ctx.currentTime + 0.02,
    nextScheduledTimeRef.current
  );
  
  source.start(startTime);
  nextScheduledTimeRef.current = startTime + (audioBuffer.length / 24000);
};
```

## 🎨 UI Components

### **Main Layout (Index.tsx)**
```typescript
export default function Index() {
  const [activeTab, setActiveTab] = useState("voice");
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* LEFT SIDEBAR - Navigation */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex lg:flex-col">
                <TabsTrigger value="voice">
                  <Brain className="h-4 w-4" />
                  <span>Voice</span>
                </TabsTrigger>
                {/* More tabs... */}
              </TabsList>
            </Tabs>
          </aside>

          {/* RIGHT: MAIN CONTENT */}
          <main className="space-y-8">
            <div className="text-center">
              <h1 className="font-archivo text-6xl font-bold">HI, ALEX</h1>
              <p className="text-lg">How can Jarvis help you today?</p>
            </div>
            
            <Tabs value={activeTab}>
              <TabsContent value="voice">
                <RealtimeVoiceInterface className="py-8" />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
```

### **Voice Interface UI**
```typescript
return (
  <div className={cn("flex flex-col items-center space-y-6", className)}>
    {/* Connection Status */}
    <div className="flex items-center space-x-2">
      <div className={cn(
        "w-3 h-3 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm text-muted-foreground">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>

    {/* Voice Button */}
    <Button
      size="lg"
      className={cn(
        "w-24 h-24 rounded-full transition-all duration-200",
        isListening && "bg-red-500 hover:bg-red-600 scale-110",
        isSpeaking && "animate-pulse"
      )}
      onMouseDown={togglePushToTalk}
      onMouseUp={togglePushToTalk}
      disabled={!isConnected}
    >
      {isListening ? (
        <MicIcon className="h-8 w-8" />
      ) : (
        <MicOffIcon className="h-8 w-8" />
      )}
    </Button>

    {/* Status Text */}
    <p className="text-center text-muted-foreground">
      {!isConnected && "Connecting..."}
      {isConnected && !isListening && !isSpeaking && "Click and hold to speak"}
      {isListening && "Listening..."}
      {isSpeaking && "Jarvis is speaking..."}
    </p>
  </div>
);
```

## 🔧 Audio Processing

### **AudioWorklet (audio-processor.js)**
```javascript
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions.bufferSize || 512;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        if (this.bufferIndex >= this.bufferSize) {
          // Convert Float32 to Int16
          const int16Buffer = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            int16Buffer[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32767));
          }
          
          // Send to main thread
          this.port.postMessage(int16Buffer.buffer);
          
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
```

## 🎨 Styling & Theming

### **Tailwind Configuration**
```typescript
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        archivo: ['Archivo', 'sans-serif'],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### **Dark/Light Mode**
```typescript
// ThemeToggle component
const { theme, setTheme } = useTheme();

return (
  <Button
    variant="outline"
    size="icon"
    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
  >
    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
  </Button>
);
```

## 🚨 Error Handling

### **WebSocket Errors**
```typescript
const handleWebSocketError = (error: Event) => {
  console.error('WebSocket error:', error);
  setIsConnected(false);
  setIsListening(false);
  setIsSpeaking(false);
  
  // Show user-friendly error message
  toast({
    title: "Connection Error",
    description: "Failed to connect to voice service. Please try again.",
    variant: "destructive"
  });
};
```

### **Audio Errors**
```typescript
const handleAudioError = (error: Error) => {
  console.error('Audio error:', error);
  
  if (error.name === 'NotAllowedError') {
    toast({
      title: "Microphone Access Denied",
      description: "Please allow microphone access to use voice features.",
      variant: "destructive"
    });
  }
};
```

## 🔧 Development

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Environment Variables**
```bash
# .env.local (optional)
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### **Debugging**
```typescript
// Enable detailed logging
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('Audio data:', audioData.length);
  console.log('WebSocket state:', wsRef.current?.readyState);
  console.log('Audio context state:', audioContextRef.current?.state);
}
```

## 🎯 Best Practices

### **Performance**
- Use `useCallback` and `useMemo` for expensive operations
- Clean up WebSocket connections and audio contexts
- Implement proper error boundaries
- Optimize re-renders with React.memo

### **Accessibility**
- Provide keyboard navigation for voice button
- Include ARIA labels for screen readers
- Support high contrast mode
- Provide visual feedback for all states

### **User Experience**
- Clear visual feedback for all interaction states
- Graceful degradation when features aren't supported
- Responsive design for different screen sizes
- Intuitive push-to-talk interaction

---

**The frontend provides a polished, responsive interface for seamless voice interaction!** 🎨✨
