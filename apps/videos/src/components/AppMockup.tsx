import type React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

const CATEGORY_COLORS = [
  COLOR.category.essentials,
  COLOR.category.optimization,
  COLOR.category.adjustments,
  COLOR.category.ai,
  COLOR.category.watermark,
  COLOR.category.utilities,
  COLOR.category.layout,
  COLOR.category.format,
];

const TOOLBAR_ICONS = [
  { id: "crop", width: 24, bg: "#d1d5db" },
  { id: "resize", width: 24, bg: "#d1d5db" },
  { id: "adjust", width: 24, bg: "#d1d5db" },
  { id: "filter", width: 32, bg: "#d1d5db" },
  { id: "export", width: 24, bg: "#d1d5db" },
];

export const AppMockup: React.FC<{
  startFrame: number;
}> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* Sidebar slides in from left */
  const sidebarSpring = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING.snappy,
  });
  const sidebarX = interpolate(sidebarSpring, [0, 1], [-240, 0]);

  /* Header slides down from top */
  const headerSpring = spring({
    frame: frame - (startFrame + 4),
    fps,
    config: SPRING.snappy,
  });
  const headerY = interpolate(headerSpring, [0, 1], [-56, 0]);

  /* Center canvas fade in */
  const canvasOpacity = interpolate(frame, [startFrame + 8, startFrame + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Toolbar fade in */
  const toolbarOpacity = interpolate(frame, [startFrame + 12, startFrame + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          height: 56,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          gap: 12,
          flexShrink: 0,
          transform: `translateY(${headerY}px)`,
        }}
      >
        {/* Otter logo + name */}
        <Img src={staticFile("logo.png")} style={{ width: 28, height: 28, borderRadius: 4 }} />
        <span
          style={{
            fontFamily: FONT.heading,
            fontWeight: 700,
            fontSize: 16,
            color: "#1a1a2e",
          }}
        >
          SnapOtter
        </span>

        {/* Search bar placeholder */}
        <div
          style={{
            flex: 1,
            maxWidth: 400,
            height: 32,
            backgroundColor: "#f3f4f6",
            borderRadius: 8,
            marginLeft: 24,
            border: "1px solid #e5e7eb",
          }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar */}
        <div
          style={{
            width: 240,
            backgroundColor: "#f8fafc",
            borderRight: "1px solid #e5e7eb",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flexShrink: 0,
            transform: `translateX(${sidebarX}px)`,
          }}
        >
          {CATEGORY_COLORS.map((color, i) => (
            <div
              key={color}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: color,
                  opacity: 0.85,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: 60 + (i % 3) * 20,
                  backgroundColor: "#d1d5db",
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>

        {/* Center canvas area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
          }}
        >
          {/* Photo placeholder */}
          <div style={{ opacity: canvasOpacity }}>
            <PhotoPlaceholder width={320} height={220} hue={200} />
          </div>

          {/* Toolbar row */}
          <div
            style={{
              display: "flex",
              gap: 12,
              opacity: toolbarOpacity,
            }}
          >
            {TOOLBAR_ICONS.map((icon) => (
              <div
                key={icon.id}
                style={{
                  width: icon.width,
                  height: 24,
                  backgroundColor: icon.bg,
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
