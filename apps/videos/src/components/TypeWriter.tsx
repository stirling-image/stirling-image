import type React from "react";
import { useCurrentFrame } from "remotion";
import { FONT } from "@/lib/fonts";

interface Segment {
  text: string;
  color: string;
}

export const TypeWriter: React.FC<{
  segments: Segment[];
  startFrame: number;
  speed?: number;
  style?: React.CSSProperties;
}> = ({ segments, startFrame, speed = 2, style }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charIndex = Math.floor(elapsed / speed);
  const fullText = segments.map((s) => s.text).join("");
  const visibleChars = Math.min(charIndex, fullText.length);

  let rendered = 0;
  const nodes: React.ReactNode[] = [];
  for (const seg of segments) {
    const segStart = rendered;
    const visible = Math.max(0, Math.min(visibleChars - segStart, seg.text.length));
    if (visible > 0) {
      nodes.push(
        <span key={segStart} style={{ color: seg.color }}>
          {seg.text.slice(0, visible)}
        </span>,
      );
    }
    rendered += seg.text.length;
    if (rendered >= visibleChars) break;
  }

  const showCursor = visibleChars < fullText.length && Math.floor(frame / 8) % 2 === 0;

  return (
    <span style={{ fontFamily: FONT.mono, ...style }}>
      {nodes}
      {showCursor && (
        <span
          style={{
            backgroundColor: "#7ee787",
            width: 10,
            height: 20,
            display: "inline-block",
          }}
        />
      )}
    </span>
  );
};
