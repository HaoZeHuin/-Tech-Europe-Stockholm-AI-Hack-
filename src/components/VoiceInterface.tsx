import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Brain, FileText, Calendar, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInterface } from "./ChatInterface";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceInterfaceProps {
  className?: string;
}

export function VoiceInterface({ className }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedActions, setSuggestedActions] = useState([
    "Plan my week",
    "Should I do this based on my goals?",
    "Research and create checklist",
    "What's in my calendar today?"
  ]);

  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  // If there are messages, show chat interface
  if (messages.length > 0) {
    return (
      <ChatInterface
        className={className}
        messages={messages}
        onSendMessage={handleSendMessage}
        onBackToVoice={() => setMessages([])}
        isThinking={isThinking}
      />
    );
  }

  function handleSendMessage(message: string) {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: `I understand you said: "${message}". How can I help you with that?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
    }, 2000);
  }

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);

      // Set up audio analysis for visual feedback
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      microphone.current = audioContext.current.createMediaStreamSource(stream);
      
      analyser.current.fftSize = 256;
      const bufferLength = analyser.current.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);
      
      microphone.current.connect(analyser.current);
      
      // Start visual feedback loop
      updateAudioLevel();

    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setAudioLevel(0);
    
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    
    // Simulate voice command
    setTimeout(() => {
      handleSendMessage("Voice command processed");
    }, 1000);
  };

  const updateAudioLevel = () => {
    if (!analyser.current || !dataArray.current) return;

    analyser.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length;
    setAudioLevel(average / 255);

    if (isListening) {
      requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleSuggestedAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleSendMessage(textInput);
      setTextInput("");
    }
  };

  const microphoneStyle = {
    transform: `scale(${1 + audioLevel * 0.3})`,
    boxShadow: `0 0 ${audioLevel * 40}px hsl(var(--voice-active) / 0.5)`,
  };

  // Initial voice interface (hero mode)
  return (
    <div className={cn("flex flex-col items-center space-y-8", className)}>
      {/* Voice Button - Made Much Bigger */}
      <div className="relative">
        <Button
          variant={isListening ? "voice" : "voice-inactive"}
          size="lg"
          onClick={handleVoiceToggle}
          className={cn(
            "h-40 w-40 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl",
            isListening && "animate-voice-pulse"
          )}
          style={isListening ? microphoneStyle : undefined}
        >
          {isListening ? (
            <Mic className="h-24 w-24" />
          ) : (
            <MicOff className="h-24 w-24" />
          )}
        </Button>
        
        {/* Audio level indicator */}
        {isListening && (
          <div className="absolute -inset-6 rounded-full border-2 border-voice-active/30 animate-voice-pulse" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center space-y-4">
        {isListening && (
          <p className="text-voice-active font-medium animate-ai-thinking text-lg">
            Listening...
          </p>
        )}
        {isThinking && (
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-ai-thinking text-ai-thinking" />
            <p className="text-ai-thinking font-medium animate-ai-thinking text-lg">
              Thinking...
            </p>
          </div>
        )}
        {!isListening && !isThinking && (
          <p className="text-muted-foreground text-lg">
            Press to talk with Jarvis
          </p>
        )}
        
        {/* Text Input Alternative */}
        <div className="text-center w-full">
          <p className="text-sm text-muted-foreground mb-3">Or type your message:</p>
          <form onSubmit={handleTextSubmit} className="relative w-full max-w-2xl mx-auto px-4">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your command here..."
              className="pr-14 h-14 text-lg w-full rounded-xl"
              disabled={isThinking}
            />
            <Button
              type="submit"
              variant="voice-inactive"
              size="sm"
              className="absolute right-6 top-2 h-10 w-10 p-0 rounded-lg active:bg-gradient-voice active:shadow-voice-glow"
              disabled={!textInput.trim() || isThinking}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="space-y-3 w-full max-w-2xl px-4">
        <p className="text-sm text-muted-foreground text-center">
          Quick actions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedActions.map((action, index) => (
            <Button
              key={index}
              variant="warm"
              size="sm"
              onClick={() => handleSuggestedAction(action)}
              className="justify-start h-auto py-4 px-4 text-left"
            >
              {index === 0 && <Calendar className="h-4 w-4 mr-3 flex-shrink-0" />}
              {index === 1 && <Brain className="h-4 w-4 mr-3 flex-shrink-0" />}
              {index === 2 && <Search className="h-4 w-4 mr-3 flex-shrink-0" />}
              {index === 3 && <FileText className="h-4 w-4 mr-3 flex-shrink-0" />}
              <span className="text-sm">{action}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}