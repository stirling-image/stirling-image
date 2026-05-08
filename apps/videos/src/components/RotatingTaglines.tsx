import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { EASE } from "@/lib/motion";

export const RotatingTaglines: React.FC<{
  lines: string[];
  startFrame: number;
  framesPerLine: number;
  fontSize?: number;
  color?: string;
}> = ({ lines, startFrame, framesPerLine, fontSize = 36, color = COLOR.accent }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;

  const lineIndex = Math.floor(elapsed / framesPerLine);
  const lineProgress = (elapsed % framesPerLine) / framesPerLine;
  if (lineIndex >= lines.length) return null;

  const enterDuration = 0.2;
  const holdEnd = 0.7;
  const exitEnd = 1.0;

  const opacity =
    lineProgress < enterDuration
      ? interpolate(lineProgress, [0, enterDuration], [0, 1], { easing: EASE.enter })
      : lineProgress < holdEnd
        ? 1
        : interpolate(lineProgress, [holdEnd, exitEnd], [1, 0], { easing: EASE.exit });

  const translateY =
    lineProgress < enterDuration
      ? interpolate(lineProgress, [0, enterDuration], [30, 0], { easing: EASE.enter })
      : lineProgress > holdEnd
        ? interpolate(lineProgress, [holdEnd, exitEnd], [0, -20], { easing: EASE.exit })
        : 0;

  const glowOpacity = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.03, 0.08]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${COLOR.accent} 0%, transparent 70%)`,
          opacity: glowOpacity,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize,
          color,
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
        }}
      >
        {lines[lineIndex]}
      </div>
    </div>
  );
};
