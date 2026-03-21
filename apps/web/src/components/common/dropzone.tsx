import { useCallback, useState, type DragEvent } from "react";
import { Upload, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFiles?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  /** Files that have already been dropped (for showing count & list). */
  currentFiles?: File[];
}

export function Dropzone({ onFiles, accept, multiple = true, currentFiles = [] }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles?.(files);
    },
    [onFiles]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) onFiles?.(files);
    };
    input.click();
  };

  const hasMultipleFiles = currentFiles.length > 1;

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer min-h-[400px] mx-auto max-w-2xl w-full",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="text-3xl font-bold text-muted-foreground/30">
          Stirling <span className="text-primary/30">Image</span>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors text-sm font-medium">
          <Upload className="h-4 w-4" />
          Upload from computer
        </button>
        <p className="text-sm text-muted-foreground">
          Drop files here or click the upload button
        </p>

        {/* Show file count badge and list when multiple files are dropped */}
        {hasMultipleFiles && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <FileImage className="h-3.5 w-3.5" />
              {currentFiles.length} files selected
            </span>
            <div className="max-h-32 overflow-y-auto w-full max-w-xs">
              {currentFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-muted-foreground px-2 py-0.5"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 ml-2">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
