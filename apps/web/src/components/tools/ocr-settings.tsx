import { useState } from "react";
import { useFileStore } from "@/stores/file-store";
import { Loader2, Copy, Check } from "lucide-react";

function getToken(): string {
  return localStorage.getItem("stirling-token") || "";
}

type OcrEngine = "tesseract" | "paddleocr";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

export function OcrSettings() {
  const { files, processing, error, setProcessing, setError } = useFileStore();

  const [engine, setEngine] = useState<OcrEngine>("tesseract");
  const [language, setLanguage] = useState("en");
  const [text, setText] = useState<string | null>(null);
  const [detectedEngine, setDetectedEngine] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);
    setText(null);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("settings", JSON.stringify({ engine, language }));

      const res = await fetch("/api/v1/tools/ocr", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Failed: ${res.status}`);
      }

      const data = await res.json();
      setText(data.text || "");
      setDetectedEngine(data.engine || engine);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Engine selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">OCR Engine</label>
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => setEngine("tesseract")}
            className={`flex-1 text-xs py-1.5 rounded ${
              engine === "tesseract"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Tesseract
          </button>
          <button
            onClick={() => setEngine("paddleocr")}
            className={`flex-1 text-xs py-1.5 rounded ${
              engine === "paddleocr"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            PaddleOCR
          </button>
        </div>
      </div>

      {/* Language selector */}
      <div>
        <label className="text-xs text-muted-foreground">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!hasFile || processing}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
        {processing ? "Extracting Text..." : "Extract Text"}
      </button>

      {/* Progress indicator */}
      {processing && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            AI processing may take 10-30 seconds...
          </p>
        </div>
      )}

      {/* Result */}
      {text !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Extracted Text ({detectedEngine})
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            value={text}
            rows={8}
            className="w-full px-2 py-1.5 rounded border border-border bg-muted text-xs text-foreground font-mono resize-y"
          />
          {text.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {text.length} characters extracted
            </p>
          )}
        </div>
      )}
    </div>
  );
}
