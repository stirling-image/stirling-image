import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

// ---------------------------------------------------------------------------
// Ruler configuration
// ---------------------------------------------------------------------------

const RULER_SIZE = 20; // px
const TICK_COLOR = "var(--color-muted-foreground)";
const BG_COLOR = "var(--color-card)";
const TEXT_COLOR = "var(--color-muted-foreground)";

// ---------------------------------------------------------------------------
// Helper: pick tick spacing based on zoom level
// ---------------------------------------------------------------------------

function getTickInterval(zoom: number): { major: number; minor: number } {
  // Adjust tick spacing so labels don't overlap at any zoom
  if (zoom >= 4) return { major: 25, minor: 5 };
  if (zoom >= 2) return { major: 50, minor: 10 };
  if (zoom >= 1) return { major: 100, minor: 10 };
  if (zoom >= 0.5) return { major: 200, minor: 50 };
  if (zoom >= 0.25) return { major: 500, minor: 100 };
  return { major: 1000, minor: 200 };
}

// ---------------------------------------------------------------------------
// HorizontalRuler
// ---------------------------------------------------------------------------

export function HorizontalRuler() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const showRulers = useEditorStore((s) => s.showRulers);
  const addGuide = useEditorStore((s) => s.addGuide);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = RULER_SIZE;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const { major, minor } = getTickInterval(zoom);
    const startPx = -panOffset.x / zoom;
    const endPx = (w - panOffset.x) / zoom;
    const startTick = Math.floor(startPx / minor) * minor;

    ctx.strokeStyle = TICK_COLOR;
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "9px sans-serif";
    ctx.textBaseline = "top";

    for (let t = startTick; t <= endPx + minor; t += minor) {
      const screenX = t * zoom + panOffset.x;
      if (screenX < 0 || screenX > w) continue;

      const isMajor = t % major === 0;
      const tickHeight = isMajor ? 12 : 6;

      ctx.beginPath();
      ctx.moveTo(screenX, h);
      ctx.lineTo(screenX, h - tickHeight);
      ctx.lineWidth = isMajor ? 0.8 : 0.4;
      ctx.stroke();

      if (isMajor) {
        ctx.fillText(String(Math.round(t)), screenX + 2, 2);
      }
    }

    // Bottom border
    ctx.strokeStyle = TICK_COLOR;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();
    // canvasSize referenced to trigger redraw when canvas dimensions change
    void canvasSize;
  }, [zoom, panOffset, canvasSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Drag from ruler to create a horizontal guide
      const startY = e.clientY;
      const onMove = (me: MouseEvent) => {
        if (Math.abs(me.clientY - startY) > 10) {
          const canvasY = (me.clientY - startY) / zoom;
          addGuide("horizontal", canvasY);
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [zoom, addGuide],
  );

  if (!showRulers) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn("block w-full cursor-col-resize select-none")}
      style={{ height: RULER_SIZE }}
      onMouseDown={handleMouseDown}
    />
  );
}

// ---------------------------------------------------------------------------
// VerticalRuler
// ---------------------------------------------------------------------------

export function VerticalRuler() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = useEditorStore((s) => s.zoom);
  const panOffset = useEditorStore((s) => s.panOffset);
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const showRulers = useEditorStore((s) => s.showRulers);
  const addGuide = useEditorStore((s) => s.addGuide);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = RULER_SIZE;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const { major, minor } = getTickInterval(zoom);
    const startPx = -panOffset.y / zoom;
    const endPx = (h - panOffset.y) / zoom;
    const startTick = Math.floor(startPx / minor) * minor;

    ctx.strokeStyle = TICK_COLOR;
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "9px sans-serif";

    for (let t = startTick; t <= endPx + minor; t += minor) {
      const screenY = t * zoom + panOffset.y;
      if (screenY < 0 || screenY > h) continue;

      const isMajor = t % major === 0;
      const tickWidth = isMajor ? 12 : 6;

      ctx.beginPath();
      ctx.moveTo(w, screenY);
      ctx.lineTo(w - tickWidth, screenY);
      ctx.lineWidth = isMajor ? 0.8 : 0.4;
      ctx.stroke();

      if (isMajor) {
        ctx.save();
        ctx.translate(3, screenY + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = "top";
        ctx.fillText(String(Math.round(t)), 0, 0);
        ctx.restore();
      }
    }

    // Right border
    ctx.strokeStyle = TICK_COLOR;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(w - 0.5, 0);
    ctx.lineTo(w - 0.5, h);
    ctx.stroke();
    void canvasSize;
  }, [zoom, panOffset, canvasSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const startX = e.clientX;
      const onMove = (me: MouseEvent) => {
        if (Math.abs(me.clientX - startX) > 10) {
          const canvasX = (me.clientX - startX) / zoom;
          addGuide("vertical", canvasX);
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [zoom, addGuide],
  );

  if (!showRulers) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn("block h-full cursor-row-resize select-none")}
      style={{ width: RULER_SIZE }}
      onMouseDown={handleMouseDown}
    />
  );
}

export { RULER_SIZE };
