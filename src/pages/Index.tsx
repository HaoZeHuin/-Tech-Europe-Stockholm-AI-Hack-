import { useState } from "react";
import { VoiceInterface } from "@/components/VoiceInterface";
import { MemoryBrowser } from "@/components/MemoryBrowser";
import { FileManager } from "@/components/FileManager";
import { UserProfile } from "@/components/UserProfile";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Settings, FileText, Calendar, User, Sun, Cloud, Moon, FolderOpen } from "lucide-react";


const Index = () => {
  const [activeTab, setActiveTab] = useState("voice");
  
  // Get current time-based icon and styling
  const getTimeIconData = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      return {
        Icon: Sun,
        className: "text-warning/40 drop-shadow-[0_0_40px_hsl(var(--warning)/0.6)]"
      };
    }
    if (hour >= 18 && hour < 21) {
      return {
        Icon: Cloud,
        className: "text-primary/40 drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
      };
    }
    return {
      Icon: Moon,
      className: "text-muted-foreground/40 drop-shadow-[0_0_25px_hsl(var(--muted-foreground)/0.3)]"
    };
  };
  
  const { Icon: TimeIcon, className: iconClassName } = getTimeIconData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section with Massive Weather Icon and Centered Greeting */}
      <div className="container mx-auto px-4 py-8 relative">
        {/* Theme Toggle */}
        <div className="absolute top-0 right-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center">
          {/* Weather Icon with Centered Greeting */}
          <div className="relative flex justify-center items-center">
            <TimeIcon className={`h-64 w-64 stroke-[0.5] ${iconClassName}`} />
            
            {/* Centered Text Inside Weather Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <h1 className="font-archivo text-6xl md:text-7xl font-bold leading-tight tracking-tight">
                HI, ALEX
              </h1>
              <p className="text-lg text-foreground/80">
                How can Jarvis help you today?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="voice" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Memory</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-8">
            <VoiceInterface className="py-8" />
          </TabsContent>

          <TabsContent value="files" className="space-y-8">
            <FileManager />
          </TabsContent>

          <TabsContent value="memory" className="space-y-8">
            <MemoryBrowser />
          </TabsContent>

          <TabsContent value="profile" className="space-y-8">
            <UserProfile />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-8">
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Calendar Integration</h3>
              <p className="text-muted-foreground mb-4">
                Connect your calendar to enable intelligent scheduling and route optimization based on weather and your preferences.
              </p>
              <Button variant="ai">Connect Calendar</Button>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <div className="grid gap-6">
              <ModeToggle />
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-3">
                      <FileText className="h-4 w-4 mr-2" />
                      Import Notes Vault
                    </Button>
                    <Button variant="outline" className="h-auto py-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      Connect Calendar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Import your Obsidian vault, markdown notes, and calendar to give Jarvis context about your life.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
