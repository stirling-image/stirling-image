import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { ProgressBar } from "@/components/ProgressBar";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

export const SingleToolScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: SPRING.snappy });
  const dropFrame = 40;
  const dropProgress = spring({ frame: frame - dropFrame, fps, config: SPRING.natural });
  const processFrame = 180;
  const showResult = frame > processFrame + 60;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <div style={{ transform: `translateX(${(1 - slideIn) * 300}px)`, opacity: slideIn }}>
        <AppWindow
          title="Resize"
          width={1600}
          height={900}
          topBarColor="#ffffff"
          bodyColor="#ffffff"
        >
          <div style={{ display: "flex", height: "100%" }}>
            {/* Dropzone */}
            <div
              style={{
                flex: 0.6,
                padding: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {frame < dropFrame ? (
                <div
                  style={{
                    width: "100%",
                    height: 400,
                    border: "2px dashed #d4d4d4",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT.body,
                    fontSize: 16,
                    color: "#a3a3a3",
                  }}
                >
                  Drop an image here
                </div>
              ) : (
                <div
                  style={{
                    transform: `translateY(${(1 - dropProgress) * -200}px)`,
                    opacity: dropProgress,
                  }}
                >
                  <PhotoPlaceholder width={500} height={375} hue={30} />
                </div>
              )}
            </div>

            {/* Settings */}
            <div
              style={{
                flex: 0.4,
                padding: 24,
                backgroundColor: "#fafafa",
                borderLeft: "1px solid #e5e5e5",
              }}
            >
              <div
                style={{
                  fontFamily: FONT.heading,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#0a0a0a",
                  marginBottom: 20,
                }}
              >
                Settings
              </div>

              {/* Width field */}
              <label
                style={{
                  fontFamily: FONT.body,
                  fontSize: 13,
                  color: "#737373",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Width
              </label>
              <div
                style={{
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid #e5e5e5",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  color: "#0a0a0a",
                  marginBottom: 16,
                }}
              >
                1920
              </div>

              {/* Height field */}
              <label
                style={{
                  fontFamily: FONT.body,
                  fontSize: 13,
                  color: "#737373",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Height
              </label>
              <div
                style={{
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid #e5e5e5",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  color: "#a3a3a3",
                  marginBottom: 16,
                }}
              >
                auto
              </div>

              {/* Process button / results */}
              {frame >= processFrame && !showResult && (
                <ProgressBar
                  startFrame={0}
                  duration={60}
                  width={300}
                  color="#3b82f6"
                  style={{ marginTop: 20 }}
                />
              )}

              {showResult && (
                <div style={{ marginTop: 20, display: "flex", gap: 16 }}>
                  <div style={{ fontFamily: FONT.body, fontSize: 14, color: "#a3a3a3" }}>
                    2.4 MB
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.body,
                      fontSize: 14,
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    340 KB
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.heading,
                      fontSize: 14,
                      color: COLOR.accent,
                      fontWeight: 700,
                    }}
                  >
                    -86%
                  </div>
                </div>
              )}
            </div>
          </div>
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};
