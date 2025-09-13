import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Zap, Lock } from "lucide-react";

export function ModeToggle() {
  const [mode, setMode] = useState<"local" | "hybrid">("local");

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Privacy Mode
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose how Jarvis processes your data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Mode */}
        <Button
          variant={mode === "local" ? "ai" : "outline"}
          className="h-auto p-4 flex-col items-start space-y-2"
          onClick={() => setMode("local")}
        >
          <div className="flex items-center space-x-2 w-full">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Local Only</span>
            {mode === "local" && <Badge className="ml-auto">Active</Badge>}
          </div>
          <p className="text-xs text-left opacity-90">
            All processing on your device. Complete privacy, uses local AI models.
          </p>
        </Button>

        {/* Hybrid Mode */}
        <Button
          variant={mode === "hybrid" ? "ai" : "outline"}
          className="h-auto p-4 flex-col items-start space-y-2"
          onClick={() => setMode("hybrid")}
        >
          <div className="flex items-center space-x-2 w-full">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Hybrid (OpenAI)</span>
            {mode === "hybrid" && <Badge className="ml-auto">Active</Badge>}
          </div>
          <p className="text-xs text-left opacity-90">
            Enhanced reasoning with OpenAI. Requires approval for cloud processing.
          </p>
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-success mr-2" />
          Your files stay on your device in both modes
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-voice-active mr-2" />
          You approve every action before execution
        </div>
      </div>
    </Card>
  );
}