import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeVoiceInterfaceProps {
  className?: string;
}

export function RealtimeVoiceInterface({ className }: RealtimeVoiceInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio and WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

  // Audio playback refs
  const audioPlaybackContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Audio buffer management
  const audioBufferRef = useRef<Int16Array[]>([]);
  const bufferDurationRef = useRef(0);
  const isRecordingRef = useRef(false);

  // Audio playback refs with jitter buffer
  const nextScheduledTimeRef = useRef<number | null>(null);

  // Initialize audio context and WebSocket connection
  const initializeConnection = useCallback(async () => {
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') return;
    
    setConnectionStatus('connecting');
    
    try {
      // Initialize audio contexts
      // Use 24kHz to match OpenAI response.audio.delta PCM format
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioPlaybackContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Get microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,  // Match playback rate if device supports it
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create WebSocket connection with session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/api/realtime/${sessionId}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = async () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setIsConnected(true);
        await setupAudioProcessing();
      };

      wsRef.current.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        cleanup();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        cleanup();
      };

    } catch (error) {
      console.error('Failed to initialize connection:', error);
      setConnectionStatus('error');
    }
  }, [connectionStatus]);

  // Setup audio processing
  const setupAudioProcessing = async () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    try {
      // Load audio processor worklet
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      
      // Create audio worklet node
      audioWorkletRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      // Create media stream source
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(audioWorkletRef.current);
      
      // Handle audio data from worklet
      audioWorkletRef.current.port.onmessage = (event) => {
        const audioData = event.data as Float32Array;
        
        // Calculate audio level for visualization
        const level = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
        setAudioLevel(Math.min(level * 10, 1));
        
        // Accumulate audio data if recording
        if (isRecordingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          const pcm16Data = float32ToPCM16(audioData);
          audioBufferRef.current.push(pcm16Data);
          
          // Calculate buffer duration (assuming 24kHz sample rate for input)
          bufferDurationRef.current += (audioData.length / 24000) * 1000; // in milliseconds
          
          // Send accumulated audio data periodically (every ~100ms)
          if (bufferDurationRef.current >= 100) {
            sendAccumulatedAudio();
          }
        }
      };
      
    } catch (error) {
      console.error('Failed to setup audio processing:', error);
    }
  };

  // Handle WebSocket messages with OpenAI-compatible format
  const handleWebSocketMessage = (data: any) => {
    console.log('Received message:', data.type, data);
    
    switch (data.type) {
      case 'session.created':
        console.log('Session created');
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'response.audio.delta':
        // Schedule audio chunk immediately with jitter buffer
        if (data.delta) {
          console.log('Received audio delta:', data.delta.length, 'characters');
          const audioData = base64ToArrayBuffer(data.delta);
          enqueuePlaybackChunk(audioData);
        }
        break;
        
      case 'response.audio.done':
        console.log('Audio response completed');
        setIsSpeaking(false);
        break;
        
      case 'response.text.delta':
        // Log text responses for debugging
        if (data.delta) {
          console.log('Text response:', data.delta);
        }
        break;
        
      case 'response.done':
        setIsSpeaking(false);
        break;
        
      case 'error':
        console.error('OpenAI error:', data.error);
        break;
        
      default:
        console.log('Unhandled message type:', data.type, data);
    }
  };

  // Jitter buffer playback with timeline scheduling
  const JITTER_BUFFER_MS = 80; // 80ms jitter buffer
  
  const enqueuePlaybackChunk = async (audioData: ArrayBuffer) => {
    if (!audioPlaybackContextRef.current) return;
    
    try {
      const ctx = audioPlaybackContextRef.current;
      
      // Ensure audio context is running
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Convert PCM16 to AudioBuffer
      const pcm16Data = new Int16Array(audioData);
      const audioBuffer = ctx.createBuffer(1, pcm16Data.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert PCM16 to float32
      for (let i = 0; i < pcm16Data.length; i++) {
        channelData[i] = pcm16Data[i] / 32768.0;
      }
      
      // Schedule playback with jitter buffer
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      // Initialize playhead if needed
      if (!nextScheduledTimeRef.current) {
        nextScheduledTimeRef.current = ctx.currentTime + (JITTER_BUFFER_MS / 1000);
      }
      
      // Schedule at the next available time slot
      const startTime = Math.max(ctx.currentTime + 0.02, nextScheduledTimeRef.current);
      source.start(startTime);
      
      // Update next scheduled time
      nextScheduledTimeRef.current = startTime + (audioBuffer.length / 24000);
      
      console.log(`Scheduled audio chunk: ${pcm16Data.length} samples (${(pcm16Data.length / 24000 * 1000).toFixed(1)}ms) at time ${startTime.toFixed(3)}`);
      setIsSpeaking(true);
      
    } catch (error) {
      console.error('Error scheduling audio chunk:', error);
    }
  };

  // Convert Int16Array to base64 for OpenAI WebSocket format
  const int16ToBase64 = (pcm: Int16Array): string => {
    const bytes = new Uint8Array(pcm.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  };

  // Send accumulated audio data using OpenAI WebSocket format
  const sendAccumulatedAudio = () => {
    if (audioBufferRef.current.length === 0 || !wsRef.current) return;
    
    // Combine all accumulated audio chunks
    const totalLength = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Int16Array(totalLength);
    let offset = 0;
    
    for (const chunk of audioBufferRef.current) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Send using OpenAI WebSocket format: input_audio_buffer.append
    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: int16ToBase64(combinedAudio)
    }));
    
    // Clear the buffer
    audioBufferRef.current = [];
    bufferDurationRef.current = 0;
    
    console.log('Sent accumulated audio via input_audio_buffer.append:', totalLength, 'samples');
  };

  // Toggle push-to-talk
  const togglePushToTalk = () => {
    if (!isConnected) return;
    
    if (isListening) {
      // Stop recording
      console.log('Stopping push-to-talk');
      setIsListening(false);
      isRecordingRef.current = false;
      
      // Send any remaining audio data
      if (audioBufferRef.current.length > 0) {
        sendAccumulatedAudio();
      }
      
      // Commit audio buffer using OpenAI WebSocket format
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Committing audio buffer via input_audio_buffer.commit');
        wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      }
    } else {
      // Start recording
      console.log('Starting push-to-talk');
      setIsListening(true);
      isRecordingRef.current = true;
      
      // Clear any existing buffer
      audioBufferRef.current = [];
      bufferDurationRef.current = 0;
    }
  };

  // Disconnect from voice session
  const disconnect = () => {
    cleanup();
    setConnectionStatus('disconnected');
    setIsConnected(false);
  };

  // Cleanup resources
  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (audioPlaybackContextRef.current) {
      audioPlaybackContextRef.current.close();
      audioPlaybackContextRef.current = null;
    }
    
    audioWorkletRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    // Clear audio buffer
    audioBufferRef.current = [];
    bufferDurationRef.current = 0;
    isRecordingRef.current = false;
    
    // Reset playback scheduling
    nextScheduledTimeRef.current = null;
  };

  // Utility functions
  const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Converted base64 to ArrayBuffer:', bytes.length, 'bytes');
      return bytes.buffer;
    } catch (error) {
      console.error('Error converting base64 to ArrayBuffer:', error);
      return new ArrayBuffer(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <Card className="p-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Voice Assistant</h2>
            <p className="text-muted-foreground text-lg">
              Talk to Jarvis using your voice. Press and hold to speak.
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-4">
            <div className={cn(
              "w-3 h-3 rounded-full",
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            )} />
            <span className="text-sm text-muted-foreground">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
            </span>
          </div>

          {/* Audio Level Indicator */}
          {isConnected && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="text-sm text-muted-foreground">
                  {isSpeaking ? 'Jarvis is speaking' : 'Ready to listen'}
                </span>
              </div>
              <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {!isConnected ? (
              <Button 
                onClick={initializeConnection}
                disabled={connectionStatus === 'connecting'}
                size="lg"
                className="px-8"
              >
                <Phone className="h-5 w-5 mr-2" />
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Jarvis'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePushToTalk}
                  disabled={isSpeaking}
                  size="lg"
                  variant={isListening ? "default" : "outline"}
                  className="px-8"
                >
                  {isListening ? <Mic className="h-5 w-5 mr-2" /> : <MicOff className="h-5 w-5 mr-2" />}
                  {isListening ? 'Stop Recording' : 'Start Recording'}
                </Button>
                
                <Button 
                  onClick={disconnect}
                  variant="outline"
                  size="lg"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          {isConnected && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Click "Start Recording" to begin speaking, then click "Stop Recording" when finished.</p>
              <p>Jarvis will process your request and respond with voice.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

