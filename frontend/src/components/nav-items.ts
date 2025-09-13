import { Home, FolderOpen, Brain, CalendarDays, Settings, LucideIcon } from "lucide-react";

export type NavKey = "home" | "files" | "memory" | "recap" | "settings";

export const NAV_ITEMS: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: "home",   label: "Home",         icon: Home },
  { key: "files",  label: "Files",        icon: FolderOpen },
  { key: "memory", label: "Memory",       icon: Brain },
  { key: "recap",  label: "Weekly recap", icon: CalendarDays },
  { key: "settings", label: "Settings",   icon: Settings },
];
