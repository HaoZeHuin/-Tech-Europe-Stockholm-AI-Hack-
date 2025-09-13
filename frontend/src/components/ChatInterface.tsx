import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Brain, Send, User, Bot, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onBackToVoice: () => void;
  isThinking: boolean;
}

export function ChatInterface({ className, messages, onSendMessage, onBackToVoice, isThinking }: ChatInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textInput, setTextInput] = useState("");
  
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

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
    
    // Simulate voice command processing
    setTimeout(() => {
      onSendMessage("Voice command processed");
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

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSendMessage(textInput);
      setTextInput("");
    }
  };

  const microphoneStyle = {
    transform: `scale(${1 + audioLevel * 0.2})`,
    boxShadow: `0 0 ${audioLevel * 20}px hsl(var(--voice-active) / 0.5)`,
  };

  return (
    <div className={cn("flex flex-col h-full max-w-4xl mx-auto", className)}>
      {/* Header with back button */}
      <div className="flex items-center space-x-3 p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToVoice}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Voice</span>
        </Button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold">Chat with Jarvis</h2>
        </div>
      </div>
      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start space-x-3",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-voice flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <Card className={cn(
                "max-w-xs lg:max-w-md px-4 py-3",
                message.type === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <div className="space-y-2">
                  <p className="text-sm">{message.content}</p>
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => speakText(message.content)}
                      >
                        🔊 Speak
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-voice flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <Card className="bg-muted px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 animate-ai-thinking text-ai-thinking" />
                  <p className="text-sm text-ai-thinking animate-ai-thinking">
                    Thinking...
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end space-x-3">
          {/* Voice Button - Smaller for chat mode */}
          <div className="relative">
            <Button
              variant={isListening ? "voice" : "voice-inactive"}
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                "h-12 w-12 rounded-full transition-all duration-300",
                isListening && "animate-voice-pulse"
              )}
              style={isListening ? microphoneStyle : undefined}
            >
              {isListening ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
            
            {/* Audio level indicator */}
            {isListening && (
              <div className="absolute -inset-2 rounded-full border-2 border-voice-active/30 animate-voice-pulse" />
            )}
          </div>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex-1 relative">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              className="pr-12 h-12"
              disabled={isThinking}
            />
            <Button
              type="submit"
              variant="voice-inactive"
              size="sm"
              className="absolute right-1 top-1 h-10 w-10 p-0 active:bg-gradient-voice active:shadow-voice-glow"
              disabled={!textInput.trim() || isThinking}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        {/* Status */}
        {isListening && (
          <p className="text-voice-active font-medium text-sm mt-2 text-center">
            Listening...
          </p>
        )}
      </div>
    </div>
  );
}