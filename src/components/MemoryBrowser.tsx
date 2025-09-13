import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Calendar, User, Target, Search } from "lucide-react";

interface MemoryItem {
  id: string;
  type: "note" | "goal" | "calendar" | "fact" | "task";
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
}

const mockMemoryItems: MemoryItem[] = [
  {
    id: "1",
    type: "goal",
    title: "Career Goals 2024",
    content: "Build AI products that help people manage their personal lives more effectively...",
    timestamp: "2024-01-15",
    tags: ["career", "AI", "personal"]
  },
  {
    id: "2",
    type: "note",
    title: "Weekly Reflection",
    content: "This week I made good progress on the Jarvis project. Need to focus more on user experience...",
    timestamp: "2024-01-10",
    tags: ["reflection", "progress", "jarvis"]
  },
  {
    id: "3",
    type: "calendar",
    title: "Team Meeting",
    content: "Discuss hackathon progress and next steps for the AI assistant platform",
    timestamp: "2024-01-12",
    tags: ["meeting", "team", "hackathon"]
  },
  {
    id: "4",
    type: "fact",
    title: "Personal Preference",
    content: "Prefers to work in focused 2-hour blocks with breaks. Most productive in the morning.",
    timestamp: "2024-01-08",
    tags: ["productivity", "preferences", "work-style"]
  }
];

export function MemoryBrowser() {
  const getIcon = (type: string) => {
    switch (type) {
      case "goal": return <Target className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      case "calendar": return <Calendar className="h-4 w-4" />;
      case "fact": return <User className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "goal": return "bg-primary/10 text-primary";
      case "note": return "bg-secondary/50 text-secondary-foreground";
      case "calendar": return "bg-voice-active/10 text-voice-active";
      case "fact": return "bg-ai-memory/10 text-ai-memory";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Memory Browser</h2>
          <p className="text-muted-foreground">What Jarvis knows about you</p>
        </div>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="grid gap-4">
        {mockMemoryItems.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-medium transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{item.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}