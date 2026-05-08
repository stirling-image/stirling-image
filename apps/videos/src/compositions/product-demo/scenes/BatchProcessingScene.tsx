import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { ClipReveal } from "@/components/ClipReveal";
import { ProgressBar } from "@/components/ProgressBar";
import { FONT, TEXT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

const FILES = [
  { name: "photo_001.jpg", from: "1.8 MB", to: "95 KB" },
  { name: "photo_002.jpg", from: "3.2 MB", to: "210 KB" },
  { name: "landscape.png", from: "4.1 MB", to: "280 KB" },
  { name: "portrait.jpg", from: "2.7 MB", to: "160 KB" },
  { name: "macro_01.jpg", from: "5.0 MB", to: "320 KB" },
  { name: "event_23.jpg", from: "1.5 MB", to: "85 KB" },
  { name: "scan_hires.png", from: "8.2 MB", to: "450 KB" },
  { name: "product_a.jpg", from: "2.0 MB", to: "120 KB" },
];

export const BatchProcessingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const processStartFrame = 100;
  const filesPerSecond = 3;
  const framesPerFile = Math.floor(30 / filesPerSecond);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <AppWindow
        title="Compress"
        width={1600}
        height={900}
        topBarColor="#ffffff"
        bodyColor="#ffffff"
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {FILES.map((file, i) => {
              const enterDelay = 20 + i * 4;
              const enterSpring = spring({ frame: frame - enterDelay, fps, config: SPRING.popIn });
              const fileProcessFrame = processStartFrame + i * framesPerFile;
              const isDone = frame > fileProcessFrame + framesPerFile;
              const isProcessing = frame >= fileProcessFrame && !isDone;

              return (
                <div
                  key={file.name}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${isDone ? "#22c55e40" : "#e5e5e5"}`,
                    backgroundColor: isDone ? "#f0fdf4" : "white",
                    opacity: enterSpring,
                    transform: `scale(${0.8 + enterSpring * 0.2})`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT.body,
                      fontSize: 12,
                      color: "#0a0a0a",
                      fontWeight: 500,
                      marginBottom: 8,
                    }}
                  >
                    {file.name}
                  </div>

                  {isProcessing && (
                    <ProgressBar
                      startFrame={0}
                      duration={framesPerFile}
                      width={200}
                      height={4}
                      color="#3b82f6"
                    />
                  )}

                  {isDone && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#22c55e", fontSize: 14 }}>&#10003;</span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 11, color: "#a3a3a3" }}>
                        {file.from}
                      </span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 11, color: "#a3a3a3" }}>
                        {"→"}
                      </span>
                      <span
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 11,
                          color: "#22c55e",
                          fontWeight: 600,
                        }}
                      >
                        {file.to}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {frame > 280 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <ClipReveal startFrame={280}>
                <span style={{ ...TEXT.sectionTitle, fontSize: 32, color: "#0a0a0a" }}>
                  Unlimited batch. No caps.
                </span>
              </ClipReveal>
            </div>
          )}
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
};
