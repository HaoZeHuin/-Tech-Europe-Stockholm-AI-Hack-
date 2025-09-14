import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CursorGoop } from "@/components/CursorGoop";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Logo from "./components/Logo";
import AppHeader from "./components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";

const queryClient = new QueryClient();

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

function App() {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: "1",
      title: "Planning my week",
      timestamp: new Date(Date.now() - 86400000),
      preview: "Help me organize my tasks..."
    },
    {
      id: "2", 
      title: "Research checklist",
      timestamp: new Date(Date.now() - 172800000),
      preview: "Create a research plan for..."
    }
  ]);
  
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const handleDeleteChat = (id: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  };

  const handleSelectChat = (id: string) => {
    console.log("Selected chat:", id);
    // TODO: Load chat conversation
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    // TODO: Implement language switching logic
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CursorGoop />
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar 
                chatHistory={chatHistory}
                onDeleteChat={handleDeleteChat}
                onSelectChat={handleSelectChat}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
              
              <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
                  <div className="h-12 px-4 flex items-center justify-between">
                    <Logo className="h-5 w-auto" />
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                    </div>
                  </div>
                </header>
                
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
