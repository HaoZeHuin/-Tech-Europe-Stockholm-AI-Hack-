import * as React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  FileText,
  CalendarDays,
  Quote,
  X,
} from "lucide-react";

export type MemoryItem = {
  id: string;
  title: string;
  snippet: string;
  tag?: string;               // "goal" | "note" | "event" | "quote" | ...
  icon?: "file" | "event" | "quote";
};

type Props = {
  compact?: boolean;
  showSearchInCompact?: boolean; // keep false; you put Search in the page header
  className?: string;
  items?: MemoryItem[];

  // ---- new ----
  editing?: boolean;                         // show red delete badges
  onDelete?: (id: string) => Promise<void> | void;
  showSearchBar?: boolean;                   // render search input
  query?: string;                            // controlled query (from page)
  onQueryChange?: (q: string) => void;       // controlled setter
};

const MOCK_ITEMS: MemoryItem[] = [
  { id: "1", title: "Career Goals 2024", snippet: "Build AI products that help people manage their personal lives more effectively…", tag: "goal",  icon: "file"  },
  { id: "2", title: "Weekly standup notes", snippet: "Shipped: voice loop POC • Next: RAG ingest • Blockers: none",                tag: "note",  icon: "file"  },
  { id: "3", title: "Coffee with Alex — Thu 3pm", snippet: "Discuss Jarvis demo polish and video script",                           tag: "event", icon: "event" },
  { id: "4", title: "Quote I liked", snippet: "“What gets measured gets managed.”",                                                 tag: "quote", icon: "quote" },
];

function ItemIcon({ kind = "file" as MemoryItem["icon"] }) {
  switch (kind) {
    case "event": return <CalendarDays className="h-5 w-5 text-primary" />;
    case "quote": return <Quote className="h-5 w-5 text-amber-500" />;
    case "file":
    default:      return <FileText className="h-5 w-5 text-indigo-500" />;
  }
}

export function MemoryBrowser({
  compact = false,
  showSearchInCompact = false,
  className = "",
  items,
  editing = false,
  onDelete,
  showSearchBar = false,
  query,
  onQueryChange,
}: Props) {
  // local list state so we can remove items after delete
  const [list, setList] = React.useState<MemoryItem[]>(
    items && items.length ? items : MOCK_ITEMS
  );
  React.useEffect(() => {
    if (items && items.length) setList(items);
  }, [items]);

  // search: controlled or uncontrolled
  const [internalQuery, setInternalQuery] = React.useState(query ?? "");
  React.useEffect(() => {
    if (query !== undefined) setInternalQuery(query);
  }, [query]);

  const q = (query ?? internalQuery).trim().toLowerCase();
  const filtered = q
    ? list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q) ||
          (m.tag ?? "").toLowerCase().includes(q)
      )
    : list;

  // delete confirm
  const [pendingDelete, setPendingDelete] = React.useState<MemoryItem | null>(null);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (onDelete) await onDelete(pendingDelete.id);
      setList((old) => old.filter((x) => x.id !== pendingDelete.id));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <section className={clsx("space-y-4", className)}>
      {/* header area (compact/full) – we keep it minimal per your layout */}
      {compact ? (
        showSearchInCompact ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        ) : null
      ) : (
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Memory Browser</h2>
            <p className="text-muted-foreground">What Jarvis knows about you</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </header>
      )}

      {showSearchBar && (
        <div className="relative">
          <Input
            value={q}
            onChange={(e) =>
              onQueryChange ? onQueryChange(e.target.value) : setInternalQuery(e.target.value)
            }
            placeholder="Search memories…"
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id} className="p-4 relative">
            {/* red delete badge in edit mode */}
            {editing && (
              <button
                type="button"
                onClick={() => setPendingDelete(m)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center shadow hover:bg-red-600"
                title="Delete"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-start gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-2xl bg-muted/60">
                <ItemIcon kind={m.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg truncate">{m.title}</h3>
                  {m.tag && (
                    <span className="ml-auto text-xs rounded-full px-2 py-0.5 bg-muted text-foreground/80">
                      {m.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {m.snippet}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* empty state */}
        {filtered.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">
            No memories match “{q}”.
          </Card>
        )}
      </div>

      {/* confirm dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can’t be undone. The memory “{pendingDelete?.title}” will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default MemoryBrowser;
