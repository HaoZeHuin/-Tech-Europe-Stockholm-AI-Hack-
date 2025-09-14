import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  FileImage, 
  FileAudio, 
  File, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  FolderOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";
// Put this near the top of your component (outside the function) if you want base URL support:
const API_BASE =
  (import.meta.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

interface FileItem {
  id: string;
  name: string;
  type: "document" | "image" | "audio" | "other";
  size: string;
  uploadDate: string;
  tags: string[];
  processed: boolean;
  summary?: string;
}

const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "Work Goals 2024.md",
    type: "document",
    size: "12 KB",
    uploadDate: "2024-01-15",
    tags: ["goals", "work", "planning"],
    processed: true,
    summary: "Annual work objectives and career development plan"
  },
  {
    id: "2", 
    name: "Meeting Notes - Project Alpha.pdf",
    type: "document",
    size: "2.3 MB",
    uploadDate: "2024-01-12",
    tags: ["meetings", "project-alpha", "team"],
    processed: true,
    summary: "Project kickoff meeting notes with timeline and deliverables"
  },
  {
    id: "3",
    name: "Voice Memo - Ideas.m4a",
    type: "audio",
    size: "8.7 MB", 
    uploadDate: "2024-01-10",
    tags: ["ideas", "brainstorm", "voice"],
    processed: false,
    summary: "Recording of creative ideas for new product features"
  },
  {
    id: "4",
    name: "Personal Schedule Template.md",
    type: "document",
    size: "5 KB",
    uploadDate: "2024-01-08",
    tags: ["schedule", "template", "productivity"],
    processed: true,
    summary: "Template for daily and weekly schedule planning"
  }
];

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document": return <FileText className="h-4 w-4" />;
      case "image": return <FileImage className="h-4 w-4" />;
      case "audio": return <FileAudio className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "document": return "bg-primary/10 text-primary";
      case "image": return "bg-voice-active/10 text-voice-active"; 
      case "audio": return "bg-ai-memory/10 text-ai-memory";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === "all" || file.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Replace your current handleFileUpload with this:
  const handleFileUpload = async () => {
    // create a temporary file input so we don't need to add one to the JSX
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".md,.pdf,.txt"; // must match your backend allow-list

    input.onchange = async () => {
      const chosen = Array.from(input.files || []);
      if (!chosen.length) return;

      const form = new FormData();
      chosen.forEach((f) => form.append("files", f)); // field name must be "files"

      try {
        const res = await fetch(`${API_BASE}/upload/files`, {
          method: "POST",
          body: form, // DO NOT set Content-Type; browser sets it with boundary
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Upload failed: ${res.status} ${text}`);
        }
        const data = await res.json();
        console.log("✅ Upload OK:", data); // { saved: [...], ingested_chunks: N }
        alert(`Ingested ${data.ingested_chunks} chunks into Weaviate`);
      } catch (err) {
        console.error("❌ Upload error:", err);
        alert("Upload failed. Check server logs/CORS.");
      }
    };

    // trigger the picker
    input.click();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">File Manager</h2>
          <p className="text-muted-foreground">Upload and manage your documents, notes, and media</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <div className="p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Your Files</h3>
          <p className="text-muted-foreground mb-4">
            Drag & drop your markdown notes, PDFs, audio recordings, or click to browse
          </p>
          <Button onClick={handleFileUpload} className="mb-2">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground">
            Supported: .md, .pdf, .docx, .txt, .m4a, .wav, .mp3
          </p>
        </div>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("all")}
          >
            All
          </Button>
          <Button
            variant={selectedFilter === "document" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("document")}
          >
            Documents
          </Button>
          <Button
            variant={selectedFilter === "audio" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("audio")}
          >
            Audio
          </Button>
        </div>
      </div>

      {/* Files List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="p-4 hover:shadow-medium transition-all duration-300">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getFileTypeColor(file.type)}`}>
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{file.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={file.processed ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {file.processed ? "Processed" : "Processing"}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {file.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {file.summary}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {file.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground space-x-2">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.uploadDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}