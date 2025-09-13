# Voice Interface

## 🎤 Overview

The voice interface is the primary interaction method, providing real-time speech-to-speech communication with natural conversation flow and intelligent tool calling.

## 🏗️ Architecture

### **WebRTC Connection Flow**
```
Browser                    OpenAI Realtime API
  │                              │
  ├─ Request Ephemeral Token ────┤
  │                              │
  ├─ WebRTC Connection ──────────┤
  │                              │
  ├─ Audio Stream ───────────────┤
  │                              │
  ├─ Tool Call Events ───────────┤
  │                              │
  └─ Response Audio ─────────────┤
```

### **Component Structure**
```
Frontend Voice Interface
├── WebRTC Manager
│   ├── Connection Management
│   ├── Audio Streaming
│   └── Event Handling
├── Audio Processing
│   ├── Microphone Access
│   ├── Audio Playback
│   └── Noise Cancellation
├── Tool Call Handler
│   ├── Request Processing
│   ├── Approval UI
│   └── Result Display
└── Context Manager
    ├── Conversation State
    ├── User Preferences
    └── Session Management
```

## 🔧 Implementation Details

### **WebRTC Connection Setup**

```typescript
// VoiceInterface.tsx
import { RealtimeAPI } from 'openai';

class VoiceInterface {
  private realtime: RealtimeAPI;
  private isConnected = false;
  
  async connect() {
    // 1. Get ephemeral token from backend
    const token = await this.getEphemeralToken();
    
    // 2. Initialize Realtime API
    this.realtime = new RealtimeAPI({
      apiKey: token,
      model: 'gpt-4o-realtime-preview-2024-10-01',
      tools: OPENAI_TOOLS, // From contracts
    });
    
    // 3. Set up event handlers
    this.setupEventHandlers();
    
    // 4. Connect
    await this.realtime.connect();
    this.isConnected = true;
  }
  
  private setupEventHandlers() {
    // Audio input/output
    this.realtime.on('audio.input', this.handleAudioInput);
    this.realtime.on('audio.output', this.handleAudioOutput);
    
    // Tool calling
    this.realtime.on('tool_call', this.handleToolCall);
    this.realtime.on('tool_result', this.handleToolResult);
    
    // Connection events
    this.realtime.on('connected', this.onConnected);
    this.realtime.on('disconnected', this.onDisconnected);
    this.realtime.on('error', this.onError);
  }
}
```

### **Audio Processing**

```typescript
// AudioManager.ts
class AudioManager {
  private audioContext: AudioContext;
  private microphone: MediaStream;
  private audioElement: HTMLAudioElement;
  
  async initialize() {
    // 1. Get microphone access
    this.microphone = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Optimized for speech
      }
    });
    
    // 2. Set up audio context
    this.audioContext = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive',
    });
    
    // 3. Create audio processing pipeline
    this.setupAudioPipeline();
  }
  
  private setupAudioPipeline() {
    const source = this.audioContext.createMediaStreamSource(this.microphone);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      const audioData = event.inputBuffer.getChannelData(0);
      this.processAudioChunk(audioData);
    };
    
    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }
  
  private processAudioChunk(audioData: Float32Array) {
    // Convert to format expected by OpenAI
    const pcm16 = this.convertToPCM16(audioData);
    this.realtime.sendAudio(pcm16);
  }
}
```

### **Tool Call Handling**
```typescript
// ToolCallHandler.ts
class ToolCallHandler {
  private backend: BackendAPI;
  
  async handleToolCall(toolCall: ToolCall) {
    const { name, parameters } = toolCall.function;
    
    // 1. Show approval UI for write operations
    if (this.requiresApproval(name)) {
      const approved = await this.showApprovalDialog(toolCall);
      if (!approved) {
        this.realtime.sendToolResult(toolCall.id, {
          success: false,
          message: "User declined the action"
        });
        return;
      }
    }
    
    // 2. Execute tool
    try {
      const result = await this.executeTool(name, parameters);
      this.realtime.sendToolResult(toolCall.id, result);
    } catch (error) {
      this.realtime.sendToolResult(toolCall.id, {
        success: false,
        error: error.message
      });
    }
  }
  
  private async executeTool(name: string, parameters: any) {
    // Direct tools (weather, maps, etc.)
    if (this.isDirectTool(name)) {
      return await this.backend.callDirectTool(name, parameters);
    }
    
    // n8n workflow tools
    if (this.isN8nTool(name)) {
      return await this.backend.callN8nWorkflow(name, parameters);
    }
    
    throw new Error(`Unknown tool: ${name}`);
  }
  
  private requiresApproval(toolName: string): boolean {
    const writeTools = [
      'note_append',
      'task_create', 
      'calendar_scheduling',
      'weekly_planner',
      'pdf_inbox'
    ];
    return writeTools.includes(toolName);
  }
}
```

## 🎯 Voice Interaction Patterns

### **Natural Conversation Flow**

```typescript
// Example voice interactions
const voicePatterns = {
  // Simple queries
  "What's the weather like?": {
    tool: "weather_lookup",
    parameters: { location: "current" }
  },
  
  // Complex requests
  "Schedule a meeting with John tomorrow at 2pm": {
    tool: "calendar_scheduling",
    parameters: {
      title: "Meeting with John",
      start_time: "2024-09-14T14:00:00Z",
      duration_minutes: 60,
      attendee_emails: ["john@example.com"]
    }
  },
  
  // Context-aware requests
  "Add this to my notes": {
    tool: "note_append",
    parameters: {
      path: "daily/2024-09-13.md",
      markdown: "[Previous conversation context]"
    }
  }
};
```

### **Approval Workflows**

```typescript
// ApprovalDialog.tsx
const ApprovalDialog = ({ toolCall, onApprove, onDecline }) => {
  const getApprovalMessage = (toolCall) => {
    switch (toolCall.function.name) {
      case 'calendar_scheduling':
        return `Schedule "${toolCall.function.arguments.title}" at ${toolCall.function.arguments.start_time}?`;
      
      case 'note_append':
        return `Add this to your notes: "${toolCall.function.arguments.markdown.substring(0, 100)}..."?`;
      
      case 'task_create':
        return `Create task: "${toolCall.function.arguments.title}"?`;
      
      default:
        return `Execute ${toolCall.function.name}?`;
    }
  };
  
  return (
    <div className="approval-dialog">
      <h3>Confirm Action</h3>
      <p>{getApprovalMessage(toolCall)}</p>
      <div className="buttons">
        <button onClick={onApprove}>Yes, proceed</button>
        <button onClick={onDecline}>Cancel</button>
      </div>
    </div>
  );
};
```

## 🔊 Audio Quality & Performance

### **Audio Processing Pipeline**

```
Microphone Input
    ↓
Noise Cancellation
    ↓
Echo Cancellation
    ↓
Auto Gain Control
    ↓
16kHz PCM Encoding
    ↓
WebRTC Stream
    ↓
OpenAI Processing
    ↓
TTS Response
    ↓
Audio Playback
```

### **Performance Optimization**

```typescript
// Performance optimizations
const audioConfig = {
  // Input settings
  sampleRate: 16000,        // Optimal for speech recognition
  bufferSize: 4096,         // Balance between latency and stability
  channels: 1,              // Mono audio
  
  // Processing settings
  noiseSuppression: true,   // Reduce background noise
  echoCancellation: true,   // Prevent echo feedback
  autoGainControl: true,    // Normalize volume levels
  
  // Network settings
  bitrate: 64000,           // 64kbps for voice
  latency: 'interactive',   // Minimize delay
  jitterBuffer: 50,         // 50ms jitter buffer
};
```

### **Error Handling**

```typescript
// Error handling patterns
class VoiceErrorHandler {
  handleConnectionError(error: Error) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        this.showMessage("Connection lost. Reconnecting...");
        this.reconnect();
        break;
      
      case 'AUDIO_PERMISSION_DENIED':
        this.showMessage("Microphone access required for voice interface");
        this.requestMicrophonePermission();
        break;
      
      case 'TOOL_EXECUTION_ERROR':
        this.showMessage("Sorry, I couldn't complete that action. Please try again.");
        break;
      
      default:
        this.showMessage("Something went wrong. Please try again.");
        console.error('Voice error:', error);
    }
  }
  
  async reconnect() {
    try {
      await this.voiceInterface.disconnect();
      await this.voiceInterface.connect();
      this.showMessage("Reconnected successfully");
    } catch (error) {
      this.showMessage("Failed to reconnect. Please refresh the page.");
    }
  }
}
```

## 🎯 Voice Patterns

**Simple queries**: "What's the weather?" → `weather_lookup` tool  
**Complex requests**: "Schedule meeting with John tomorrow" → `calendar_scheduling` tool  
**Context-aware**: "Add this to my notes" → `note_append` tool

## 🔊 Audio Quality

**Pipeline**: Microphone → Noise Cancellation → 16kHz PCM → WebRTC → OpenAI → TTS → Playback

**Performance**: < 5 second total round-trip, optimized for 16kHz sample rate

## 🎨 UI Components

**Status indicators**: Listening/Processing states  
**Live transcript**: Real-time speech-to-text display  
**Approval dialogs**: Permission requests for write operations  
**Audio controls**: Microphone toggle and volume

## 🔧 Configuration

**Audio settings**: Sensitivity, noise suppression, echo cancellation  
**Speech settings**: Rate, pitch, voice selection  
**Interaction**: Auto-listen, timeout, confirmation requirements

---

*See Tool System guide for tool execution details.*
