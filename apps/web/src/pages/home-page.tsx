import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ImageViewer } from "@/components/common/image-viewer";
import { MultiImageViewer } from "@/components/common/multi-image-viewer";
import { useFileStore } from "@/stores/file-store";
import { TOOLS, CATEGORIES } from "@stirling-image/shared";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";

// Tools shown prominently as "quick actions" at the top
const QUICK_ACTION_IDS = ["resize", "compress", "convert", "remove-background"];

export function HomePage() {
  const { setFiles, files, reset, originalBlobUrl, selectedFileName, selectedFileSize } = useFileStore();
  const navigate = useNavigate();

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      reset();
      setFiles(newFiles);
    },
    [setFiles, reset],
  );

  const handleToolClick = (route: string) => {
    // Files are already in the store — just navigate
    navigate(route);
  };

  const hasFile = files.length > 0;

  // If no file uploaded, show default layout (tool panel + dropzone)
  if (!hasFile) {
    return <AppLayout onFiles={handleFiles} />;
  }

  // File uploaded — show tool selector on left, image preview on right
  return (
    <AppLayout showToolPanel={false} onFiles={handleFiles}>
      <div className="flex h-full w-full">
        {/* Left panel: Tool selector */}
        <div className="w-80 border-r border-border overflow-y-auto shrink-0">
          {/* File info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm">
              <icons.CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {selectedFileName ?? files[0].name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFileSize ? `${(selectedFileSize / 1024).toFixed(1)} KB` : ""}
              {files.length > 1 && ` — ${files.length} files`}
            </p>
            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground mt-2"
            >
              Change file
            </button>
          </div>

          {/* Quick actions */}
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTION_IDS.map((id) => {
                const tool = TOOLS.find((t) => t.id === id);
                if (!tool) return null;
                const Icon = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] || icons.FileImage;
                return (
                  <button
                    key={id}
                    onClick={() => handleToolClick(tool.route)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All tools by category */}
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
              All Tools
            </h3>
            {CATEGORIES.map((category) => {
              const categoryTools = TOOLS.filter((t) => t.category === category.id);
              if (categoryTools.length === 0) return null;
              return (
                <div key={category.id} className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5" style={{ color: category.color }}>
                    {category.name}
                  </p>
                  <div className="space-y-0.5">
                    {categoryTools.map((tool) => {
                      const Icon = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] || icons.FileImage;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.route)}
                          className={cn(
                            "flex items-center gap-2.5 w-full py-1.5 px-2 rounded-lg text-left transition-colors",
                            "hover:bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm">{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Image preview */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          {files.length > 1 ? (
            <MultiImageViewer />
          ) : originalBlobUrl ? (
            <ImageViewer
              src={originalBlobUrl}
              filename={selectedFileName ?? files[0].name}
              fileSize={selectedFileSize ?? files[0].size}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Loading preview...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
