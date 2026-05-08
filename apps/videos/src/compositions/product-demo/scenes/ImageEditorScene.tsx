import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

const TOOLBAR_ICONS = [
  "Move",
  "Select",
  "Brush",
  "Eraser",
  "Clone",
  "Dodge",
  "Text",
  "Shape",
  "Line",
  "Gradient",
  "Fill",
  "Crop",
  "Eyedropper",
  "Zoom",
  "Hand",
];

export const ImageEditorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({ frame, fps, config: SPRING.snappy });
  const brushFrame = 60;
  const brushProgress = interpolate(frame, [brushFrame, brushFrame + 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const activeToolIdx = frame < 60 ? 2 : frame < 120 ? 6 : frame < 200 ? 11 : 2;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <div style={{ transform: `scale(${0.95 + enterSpring * 0.05})`, opacity: enterSpring }}>
        <AppWindow
          title="Editor"
          width={1600}
          height={900}
          topBarColor="#1e293b"
          bodyColor="#0f172a"
        >
          <div style={{ display: "flex", height: "100%" }}>
            {/* Toolbar */}
            <div
              style={{
                width: 48,
                backgroundColor: "#1e293b",
                borderRight: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 8,
                gap: 2,
              }}
            >
              {TOOLBAR_ICONS.map((icon, i) => (
                <div
                  key={icon}
                  style={{
                    width: 36,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: i === activeToolIdx ? "#3b82f6" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: i === activeToolIdx ? "white" : "#94a3b8",
                    fontFamily: FONT.body,
                    fontWeight: 500,
                  }}
                >
                  {icon.slice(0, 2)}
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <PhotoPlaceholder width={900} height={600} hue={180} />

              {/* Brush stroke */}
              {brushProgress > 0 && (
                <svg
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                  width="100%"
                  height="100%"
                >
                  <path
                    d="M 300 350 Q 450 280 600 320 T 900 300"
                    fill="none"
                    stroke={COLOR.accent}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={800}
                    strokeDashoffset={800 * (1 - brushProgress)}
                    opacity={0.7}
                  />
                </svg>
              )}

              {/* Text overlay */}
              {frame > 130 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 80,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: FONT.heading,
                    fontWeight: 700,
                    fontSize: 28,
                    color: "white",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    opacity: interpolate(frame, [130, 145], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  SnapOtter
                </div>
              )}
            </div>

            {/* Layers panel */}
            <div
              style={{
                width: 200,
                backgroundColor: "#1e293b",
                borderLeft: "1px solid #334155",
                padding: 12,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Layers
              </div>
              {["Text Layer", "Brush Stroke", "Background"].map((layer, i) => (
                <div
                  key={layer}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 4,
                    backgroundColor: i === 0 ? "#334155" : "transparent",
                    fontFamily: FONT.body,
                    fontSize: 12,
                    color: "#e2e8f0",
                    marginBottom: 2,
                  }}
                >
                  {layer}
                </div>
              ))}
            </div>
          </div>
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};
