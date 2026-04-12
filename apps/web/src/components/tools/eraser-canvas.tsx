import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = { points: Point[]; size: number };

export interface EraserCanvasRef {
  exportMask: () => Promise<Blob | null>;
  clear: () => void;
  undo: () => void;
}

interface EraserCanvasProps {
  imageSrc: string;
  brushSize: number;
  onStrokeChange: (hasStrokes: boolean) => void;
}

export const EraserCanvas = forwardRef<EraserCanvasRef, EraserCanvasProps>(function EraserCanvas(
  { imageSrc, brushSize, onStrokeChange },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const naturalRef = useRef({ w: 0, h: 0 });

  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  // Cursor position for brush preview
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  // Measure and fit image to container
  const measure = useCallback(() => {
    const img = imgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper || !img.naturalWidth) return;

    naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
    const scale = Math.min(
      wrapper.clientWidth / img.naturalWidth,
      wrapper.clientHeight / img.naturalHeight,
    );
    setCanvasSize({
      w: Math.floor(img.naturalWidth * scale),
      h: Math.floor(img.naturalHeight * scale),
    });
  }, []);

  // Reset strokes when image changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: imageSrc triggers intentional reset
  useEffect(() => {
    strokesRef.current = [];
    currentPointsRef.current = [];
    onStrokeChange(false);
    setCanvasSize(null);
  }, [imageSrc, onStrokeChange]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 60, 60, 0.4)";
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 60, 60, 0.4)";
      ctx.lineWidth = stroke.size;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  // Redraw all strokes
  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasSize) return;

    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }, [canvasSize, drawStroke]);

  // Keyboard shortcut: Ctrl+Z for undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        strokesRef.current.pop();
        onStrokeChange(strokesRef.current.length > 0);
        redraw();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStrokeChange, redraw]);

  // Get canvas-relative point from event
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const raw = "touches" in e ? e.touches[0] : e;
    if (!raw) return null;
    return { x: raw.clientX - rect.left, y: raw.clientY - rect.top };
  }, []);

  const handleDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ("touches" in e) e.preventDefault();
      const pt = getPoint(e);
      if (!pt) return;
      drawingRef.current = true;
      currentPointsRef.current = [pt];

      // Immediate dot
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 60, 60, 0.4)";
        ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [getPoint, brushSize],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Update cursor position for brush preview
      const pt = getPoint(e);
      if (pt) setCursorPos(pt);

      if (!drawingRef.current) return;
      if ("touches" in e) e.preventDefault();
      if (!pt) return;

      currentPointsRef.current.push(pt);

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const pts = currentPointsRef.current;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 60, 60, 0.4)";
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    },
    [getPoint, brushSize],
  );

  const handleUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      strokesRef.current.push({
        points: [...currentPointsRef.current],
        size: brushSize,
      });
      currentPointsRef.current = [];
      onStrokeChange(true);
      redraw();
    }
  }, [brushSize, onStrokeChange, redraw]);

  const handleLeave = useCallback(() => {
    setCursorPos(null);
    handleUp();
  }, [handleUp]);

  // Expose methods
  useImperativeHandle(
    ref,
    () => ({
      exportMask: async () => {
        const nat = naturalRef.current;
        if (!nat.w || !canvasSize || strokesRef.current.length === 0) return null;

        const mask = document.createElement("canvas");
        mask.width = nat.w;
        mask.height = nat.h;
        const ctx = mask.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, nat.w, nat.h);

        const sx = nat.w / canvasSize.w;
        const sy = nat.h / canvasSize.h;

        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const stroke of strokesRef.current) {
          const scaledSize = stroke.size * Math.max(sx, sy);

          if (stroke.points.length === 1) {
            ctx.beginPath();
            ctx.arc(
              stroke.points[0].x * sx,
              stroke.points[0].y * sy,
              scaledSize / 2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.lineWidth = scaledSize;
            ctx.moveTo(stroke.points[0].x * sx, stroke.points[0].y * sy);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x * sx, stroke.points[i].y * sy);
            }
            ctx.stroke();
          }
        }

        return new Promise<Blob | null>((resolve) => {
          mask.toBlob((b) => resolve(b), "image/png");
        });
      },
      clear: () => {
        strokesRef.current = [];
        currentPointsRef.current = [];
        onStrokeChange(false);
        redraw();
      },
      undo: () => {
        strokesRef.current.pop();
        onStrokeChange(strokesRef.current.length > 0);
        redraw();
      },
    }),
    [canvasSize, onStrokeChange, redraw],
  );

  return (
    <div ref={wrapperRef} className="relative flex items-center justify-center w-full h-full">
      {/* Hidden img for measuring natural size before canvas is ready */}
      {!canvasSize && (
        <img
          ref={imgRef}
          src={imageSrc}
          onLoad={measure}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      )}
      {canvasSize && (
        <div className="relative" style={{ width: canvasSize.w, height: canvasSize.h }}>
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Paint over objects to erase"
            className="block"
            style={{ width: canvasSize.w, height: canvasSize.h }}
          />
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="absolute inset-0 touch-none"
            style={{ cursor: "none" }}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleLeave}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
          />
          {/* Brush cursor preview */}
          {cursorPos && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-white/80"
              style={{
                width: brushSize,
                height: brushSize,
                left: cursorPos.x - brushSize / 2,
                top: cursorPos.y - brushSize / 2,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
});
