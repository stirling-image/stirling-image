import type React from "react";
import { useState } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { GrainOverlay } from "@/components/GrainOverlay";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { TOOLS } from "@/lib/tools";

const LAYERS = [
  { speed: 0.8, fontSize: 14, opacity: 0.12, count: 10, blur: 1 },
  { speed: 1.5, fontSize: 18, opacity: 0.22, count: 9, blur: 0.5 },
  { speed: 2.5, fontSize: 24, opacity: 0.35, count: 6, blur: 0 },
];

const X_FREQ = (2 * Math.PI) / 120;

export const FloatingTools: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const wrapH = height + 100;

  const [items] = useState(() => {
    let toolIdx = 0;
    return LAYERS.flatMap((layer, li) =>
      Array.from({ length: layer.count }, (_, i) => {
        const tool = TOOLS[toolIdx % TOOLS.length];
        toolIdx++;
        return {
          tool,
          layer,
          x: random(`float-x-${li}-${i}`) * width,
          startY: random(`float-y-${li}-${i}`) * wrapH,
          phase: random(`float-phase-${li}-${i}`) * Math.PI * 2,
        };
      }),
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark, overflow: "hidden" }}>
      {items.map((item, idx) => {
        const rawY = item.startY - frame * item.layer.speed;
        const y = (((rawY % wrapH) + wrapH) % wrapH) - 50;
        const xOffset = Math.sin(frame * X_FREQ + item.phase) * 8;

        return (
          <span
            key={idx}
            style={{
              position: "absolute",
              left: item.x + xOffset,
              top: y,
              fontFamily: FONT.body,
              fontSize: item.layer.fontSize,
              fontWeight: 500,
              color: COLOR.category[item.tool.category] ?? COLOR.accent,
              opacity: item.layer.opacity,
              whiteSpace: "nowrap",
              filter: item.layer.blur > 0 ? `blur(${item.layer.blur}px)` : undefined,
            }}
          >
            {item.tool.name}
          </span>
        );
      })}
      {/* Radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
      <GrainOverlay opacity={0.02} />
    </AbsoluteFill>
  );
};
