import type React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { GradientBlob } from "@/components/GradientBlob";
import { GrainOverlay } from "@/components/GrainOverlay";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { TOOLS } from "@/lib/tools";

const DURATION = 150;

const BLOBS = [
  {
    color: "#f59e0b",
    radius: 180,
    cx: 200,
    cy: 150,
    a: 2,
    b: 3,
    phaseX: 0,
    phaseY: 0,
    amplitudeX: 80,
    amplitudeY: 60,
  },
  {
    color: "#f97316",
    radius: 150,
    cx: 500,
    cy: 350,
    a: 3,
    b: 2,
    phaseX: 1.2,
    phaseY: 0.8,
    amplitudeX: 70,
    amplitudeY: 90,
  },
  {
    color: "#3b82f6",
    radius: 200,
    cx: 600,
    cy: 150,
    a: 2,
    b: 1,
    phaseX: 2.4,
    phaseY: 1.6,
    amplitudeX: 90,
    amplitudeY: 50,
  },
  {
    color: "#14b8a6",
    radius: 140,
    cx: 350,
    cy: 400,
    a: 1,
    b: 2,
    phaseX: 3.6,
    phaseY: 2.4,
    amplitudeX: 60,
    amplitudeY: 80,
  },
  {
    color: "#8b5cf6",
    radius: 160,
    cx: 150,
    cy: 350,
    a: 3,
    b: 1,
    phaseX: 4.8,
    phaseY: 3.2,
    amplitudeX: 50,
    amplitudeY: 70,
  },
];

/** Pre-computed scattered tool name positions (frozen, for texture) */
const SCATTERED_TOOLS = TOOLS.slice(0, 15).map((tool, i) => ({
  name: tool.name,
  x: ((i * 137 + 47) % 750) + 25,
  y: ((i * 89 + 23) % 550) + 25,
  fontSize: 11 + (i % 3) * 2,
}));

export const BrandGradient: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = 1 + Math.sin(frame * 0.08) * 0.03;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark, overflow: "hidden" }}>
      {/* Scattered tool names for texture (frozen, 5% opacity) */}
      {SCATTERED_TOOLS.map((tool) => (
        <span
          key={tool.name}
          style={{
            position: "absolute",
            left: tool.x,
            top: tool.y,
            fontFamily: FONT.body,
            fontSize: tool.fontSize,
            fontWeight: 500,
            color: "rgba(255,255,255,0.05)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {tool.name}
        </span>
      ))}

      {BLOBS.map((blob) => (
        <GradientBlob key={blob.color} config={blob} duration={DURATION} />
      ))}

      {/* Center logo with subtle scale pulse */}
      <Img
        src={staticFile("logo.png")}
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          left: 400 - 40,
          top: 300 - 40,
          transform: `scale(${logoScale})`,
          zIndex: 10,
        }}
      />

      {/* Radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      <GrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
