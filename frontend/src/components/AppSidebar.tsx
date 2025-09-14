import { useEffect, useState } from "react";
import {
  Brain, Settings, Calendar, FileText, Languages,
  History, Trash2, User, Home, X
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { NAV_ITEMS } from "@/components/nav-items";
import type { NavKey } from "@/components/nav-items";
import { navGo, onNavGo } from "@/lib/nav-bus";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

type AppSidebarProps = {
  open?: boolean;                         // optional controlled open (for scrim)
  onOpenChange?: (open: boolean) => void; // notify parent App.tsx
  chatHistory: ChatHistory[];
  onDeleteChat: (id: string) => void;
  onSelectChat: (id: string) => void;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
};

const languages = [
  { code: "en", name: "English" }, { code: "es", name: "Español" },
  { code: "fr", name: "Français" }, { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" }, { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" }, { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" }, { code: "ko", name: "한국어" },
];

export function AppSidebar({
  open,
  onOpenChange,
  chatHistory,
  onDeleteChat,
  onSelectChat,
  currentLanguage,
  onLanguageChange,
}: AppSidebarProps) {
  // shadcn sidebar state (expanded vs collapsed)
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  // // keep track of active tab via the nav bus (so highlight stays in sync)
  // const [activeKey, setActiveKey] = useState<NavKey>("home");
  // useEffect(() => onNavGo((k) => setActiveKey(k)), []);

  // let App.tsx know when the sidebar is "open" (i.e., not collapsed)
  useEffect(() => {
    onOpenChange?.(!collapsed);
  }, [collapsed, onOpenChange]);

  // styling helper
  const itemCls = (isActive: boolean) =>
    `h-8 px-2 w-full flex items-center rounded-md ${
      isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
    }`;

  return (
    <Sidebar
      className={`z-50 ${collapsed ? "w-14" : "w-80"}`}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarContent className="p-2">
        {/* Trigger & close button */}
        <div className="flex justify-start items-center mb-2 px-2">
          <SidebarTrigger data-sidebar="trigger" className="h-8 w-8 p-0" />
          {!collapsed && <div className="flex-1" />}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        {/* <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton asChild>
                    <button
                      type="button"
                      onClick={() => {
                        navGo(key);             // switch tab
                        // on mobile/overlay, collapse after choosing
                        if (!collapsed) toggleSidebar();
                      }}
                      className={itemCls(activeKey === key)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm ml-2">{label}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Language */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2">
              Language
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">
                <Select value={currentLanguage} onValueChange={onLanguageChange}>
                  <SelectTrigger className="w-full h-8">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-3 w-3 flex-shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Chats */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2">
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chatHistory.slice(0, 10).map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <div className="flex items-center space-x-1 group">
                      <SidebarMenuButton
                        onClick={() => onSelectChat(chat.id)}
                        className="flex-1 justify-start h-auto px-2 py-1"
                      >
                        <Brain className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0 ml-2">
                          <div className="text-xs font-medium truncate">
                            {chat.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {chat.preview}
                          </div>
                        </div>
                      </SidebarMenuButton>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteChat(chat.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))}

                {chatHistory.length === 0 && (
                  <SidebarMenuItem>
                    <div className="px-2 py-4 text-center">
                      <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No chat history yet</p>
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User */}
        {!collapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50 mx-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Alex</div>
                  <div className="text-xs text-muted-foreground">User</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
