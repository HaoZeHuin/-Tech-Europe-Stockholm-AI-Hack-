import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FolderOpen, FileText, Settings, BarChart3, Home } from "lucide-react";

export default function SideRail() {
  return (
    <aside className="md:sticky md:top-6">
      {/* Collapsed rail; expand on hover. Keep width stable so content doesn't jump */}
      <div className="group/rail relative w-16">
        {/* Header row: keep this always visible */}
        <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">
          <Home className="h-4 w-4" />
          {/* reveal the word on hover */}
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
            Jarvis
          </span>
        </div>

        {/* Flyout area: invisible until hover; then fades in AND expands width */}
        <div
          className={[
            // occupy rail space; on hover we visually widen with an inner container
            "relative",
            // hide interactions until expanded
            "pointer-events-none opacity-0",
            "transition-opacity duration-200",
            "group-hover/rail:opacity-100 group-hover/rail:pointer-events-auto",
          ].join(" ")}
        >
          {/* inner expands so labels have room; looks like the white sidebar */}
          <div className="w-16 md:w-16 md:group-hover/rail:w-48 transition-[width] duration-300">
            <TabsList
              aria-orientation="vertical"
              className="flex flex-col items-stretch gap-2 bg-transparent p-2"
            >
              <NavItem value="voice" icon={Brain} label="Voice" />
              <NavItem value="files" icon={FolderOpen} label="Files" />
              <NavItem value="memory" icon={FileText} label="Memory" />
              <NavItem value="recap" icon={BarChart3} label="Weekly Recap" />
              <NavItem value="settings" icon={Settings} label="Settings" />
            </TabsList>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={[
        "relative overflow-hidden",
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
        // default icon/text color to match white sidebar
        "text-foreground/80",
        // hover/active feel similar to white sidebar items
        "hover:bg-muted/60 data-[state=active]:bg-muted/80",
        "transition active:scale-[.98] shadow-sm",
        // left accent bar on active
        "before:absolute before:left-1.5 before:top-1/2 before:-translate-y-1/2",
        "before:h-5 before:w-1.5 before:rounded-full before:bg-primary",
        "before:opacity-0 data-[state=active]:before:opacity-100",
      ].join(" ")}
      title={label} // tooltip when collapsed
    >
      {/* Make the icon itself fade in on hover so it's "transparent" beforehand */}
      <Icon
        className="h-5 w-5 shrink-0 opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
        aria-hidden="true"
      />
      {/* Label only visible when expanded */}
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
        {label}
      </span>
    </TabsTrigger>
  );
}
