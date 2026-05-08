import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { EASE, SPRING } from "@/lib/motion";

const BLOCKS = [
  { name: "Resize", color: COLOR.category.essentials, enterFrame: 40, x: 250 },
  { name: "Compress", color: COLOR.category.optimization, enterFrame: 80, x: 580 },
  { name: "Watermark", color: COLOR.category.watermark, enterFrame: 120, x: 910 },
];

export const PipelineBuilderScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <AppWindow
        title="Pipeline Builder"
        width={1600}
        height={900}
        topBarColor="#ffffff"
        bodyColor="#ffffff"
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Blocks */}
          {BLOCKS.map((block) => {
            const s = spring({ frame: frame - block.enterFrame, fps, config: SPRING.popIn });
            return (
              <div
                key={block.name}
                style={{
                  position: "absolute",
                  left: block.x,
                  top: 280,
                  width: 160,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: `${block.color}20`,
                  border: `2px solid ${block.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT.body,
                  fontWeight: 600,
                  fontSize: 16,
                  color: block.color,
                  opacity: s,
                  transform: `scale(${0.5 + s * 0.5})`,
                }}
              >
                {block.name}
              </div>
            );
          })}

          {/* Connection lines */}
          {frame > 140 &&
            [0, 1].map((ci) => {
              const lineProgress = interpolate(frame, [140 + ci * 20, 170 + ci * 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE.enter,
              });
              const x1 = BLOCKS[ci].x + 160;
              const x2 = BLOCKS[ci + 1].x;
              return (
                <svg
                  key={`line-${ci}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1={x1}
                    y1={320}
                    x2={x1 + (x2 - x1) * lineProgress}
                    y2={320}
                    stroke="#a3a3a3"
                    strokeWidth={2}
                    strokeDasharray="6,4"
                  />
                </svg>
              );
            })}

          {/* Running indicator */}
          {frame > 220 && (
            <div
              style={{
                position: "absolute",
                bottom: 100,
                width: "100%",
                textAlign: "center",
                fontFamily: FONT.body,
                fontSize: 14,
                color: "#22c55e",
                fontWeight: 500,
                opacity: interpolate(frame, [220, 235], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              &#10003; Pipeline completed -- 5 images processed
            </div>
          )}
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
};
