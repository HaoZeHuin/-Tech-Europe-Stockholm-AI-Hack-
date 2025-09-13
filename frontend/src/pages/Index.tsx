import { useState } from "react";
import { VoiceInterface } from "@/components/VoiceInterface";
import { MemoryBrowser } from "@/components/MemoryBrowser";
import { FileManager } from "@/components/FileManager";
import { UserProfile } from "@/components/UserProfile";
import WeeklyRecap from "@/components/WeeklyRecap";
import { ModeToggle } from "@/components/ModeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Settings, FileText, Calendar, User, Sun, Cloud, Moon, FolderOpen, BarChart3, Edit, Search } from "lucide-react";
import HeroWeather from "@/components/HeroWeather";
import type { WeatherKind } from "@/lib/weather";

const Index = () => {
  const [activeTab, setActiveTab] = useState("voice");
  const [demoKind, setDemoKind] = useState<WeatherKind | null>(null);
  const [memEditing, setMemEditing] = useState(false);
  const [memShowSearch, setMemShowSearch] = useState(false);
  const [memQuery, setMemQuery] = useState("");

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
            {/* <HeroWeather size={300} strokeWidth={2} showCaption={false} /> */}
            <HeroWeather
              size={300}
              strokeWidth={2}
              glow="strong"
              showCaption={false}
              overrideKind={demoKind ?? undefined}
            />

            {/* overlay your greeting */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 pointer-events-none">
              <h1 className="font-archivo text-6xl md:text-7xl font-bold leading-tight tracking-tight">
                HI, ALEX
              </h1>
              <p className="text-lg text-foreground/80">Great to see you again! How can Jarvis help you today?</p>
            </div>
          </div>
        </div>
      </div>



      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-[72px_1fr] gap-6">
            {/* LEFT SIDEBAR */}
            <aside className="md:sticky md:top-6">
              <TabsList
                className="flex md:flex-col items-center md:items-stretch gap-2 bg-transparent p-0"
                aria-orientation="vertical"
              >
                <TabsTrigger
                  value="voice"
                  className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted"
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Voice</span>
                </TabsTrigger>

                <TabsTrigger
                  value="files"
                  className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Files</span>
                </TabsTrigger>

                <TabsTrigger
                  value="memory"
                  className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Memory</span>
                </TabsTrigger>

                {/* <TabsTrigger
                  value="profile"
                  className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Profile</span>
                </TabsTrigger> */}

                <TabsTrigger value="recap" className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Weekly Recap</span>
                </TabsTrigger>

                <TabsTrigger
                  value="settings"
                  className="md:justify-start gap-2 px-3 py-2 rounded-xl data-[state=active]:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Settings</span>
                </TabsTrigger>
              </TabsList>
            </aside>

            {/* RIGHT: CONTENT */}
            <section className="space-y-8">
              <TabsContent value="voice" className="space-y-8 m-0">
                <VoiceInterface className="py-8" />
              </TabsContent>

              <TabsContent value="files" className="space-y-8 m-0">
                <FileManager />
              </TabsContent>

              <TabsContent value="memory" className="space-y-6 m-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Memory</h2>
                    <p className="text-muted-foreground">How Jarvis remembers things</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={memShowSearch ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setMemShowSearch((v) => !v)}
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                    <Button
                      variant={memEditing ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => setMemEditing((v) => !v)}
                    >
                      <Edit className="h-4 w-4" />
                      {memEditing ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                {/* compact = hide MB heading, keep Search button */}
                <MemoryBrowser
                  compact
                  showSearchInCompact={false}
                  editing={memEditing}
                  showSearchBar={memShowSearch}
                  query={memQuery}
                  onQueryChange={setMemQuery}
                  onDelete={(id) => {
                    // TODO: call backend delete; for now:
                    console.log("delete memory", id);
                  }}
                />
              </TabsContent>

              {/* <TabsContent value="profile" className="space-y-8 m-0">
                <UserProfile />
              </TabsContent> */}

              <TabsContent value="recap" className="space-y-8 m-0">
                <WeeklyRecap />
              </TabsContent>

              <TabsContent value="settings" className="space-y-8 m-0">
                <div className="grid gap-6">
                  <ModeToggle />
                  {/* …settings cards… */}
                </div>
              </TabsContent>
            </section>
          </div>
        </Tabs>
      </div>

      {/* Main Interface
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
      </div> */}
    </div>
  );
};

export default Index;
