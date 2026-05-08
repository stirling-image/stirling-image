import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { CATEGORY_LABELS, CATEGORY_ORDER, COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";
import { TOOLS } from "@/lib/tools";

const VISIBLE_TOOLS = TOOLS.slice(0, 12);

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowScale = spring({ frame, fps, config: SPRING.snappy });
  const searchText = "resize";
  const typingStart = 60;
  const charsVisible = Math.floor(Math.max(0, frame - typingStart) / 3);
  const typed = searchText.slice(0, charsVisible);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <div style={{ transform: `scale(${0.95 + windowScale * 0.05})`, opacity: windowScale }}>
        <AppWindow
          title="SnapOtter"
          width={1600}
          height={900}
          topBarColor="#ffffff"
          bodyColor="#ffffff"
        >
          <div style={{ padding: 24 }}>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Img src={staticFile("logo.png")} style={{ width: 32, height: 32 }} />
              <span
                style={{
                  fontFamily: FONT.heading,
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#0a0a0a",
                }}
              >
                SnapOtter
              </span>
              <div
                style={{
                  flex: 1,
                  maxWidth: 400,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: FONT.body,
                  fontSize: 14,
                  color: typed ? "#0a0a0a" : "#a3a3a3",
                }}
              >
                {typed || "Search tools..."}
                {frame >= typingStart &&
                  charsVisible < searchText.length &&
                  Math.floor(frame / 8) % 2 === 0 && (
                    <span
                      style={{ width: 2, height: 16, backgroundColor: "#3b82f6", marginLeft: 1 }}
                    />
                  )}
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {CATEGORY_ORDER.map((cat) => (
                <div
                  key={cat}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 16,
                    fontSize: 12,
                    fontFamily: FONT.body,
                    fontWeight: 500,
                    backgroundColor: `${COLOR.category[cat]}15`,
                    color: COLOR.category[cat],
                    border: `1px solid ${COLOR.category[cat]}30`,
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </div>
              ))}
            </div>

            {/* Tool grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {VISIBLE_TOOLS.map((tool) => {
                const matches = !typed || tool.name.toLowerCase().includes(typed.toLowerCase());
                const cardOpacity = typed ? (matches ? 1 : 0.2) : 1;
                const cardScale = typed ? (matches ? 1 : 0.95) : 1;
                return (
                  <div
                    key={tool.name}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e5e5e5",
                      backgroundColor: "white",
                      opacity: cardOpacity,
                      transform: `scale(${cardScale})`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: COLOR.category[tool.category] ?? COLOR.accent,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        fontFamily: FONT.body,
                        fontWeight: 500,
                        fontSize: 14,
                        color: "#0a0a0a",
                      }}
                    >
                      {tool.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};
