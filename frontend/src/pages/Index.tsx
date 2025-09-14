import { useState } from "react";
import { RealtimeVoiceInterface } from "@/components/RealtimeVoiceInterface";
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
                <div className="flex justify-center">
                  <RealtimeVoiceInterface className="py-8" />
                </div>
              </TabsContent>

              <TabsContent value="files" className="space-y-8 m-0">
                <div className="flex justify-center">
                  <FileManager />
                </div>
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
    </div>
  );
};

export default Index;
