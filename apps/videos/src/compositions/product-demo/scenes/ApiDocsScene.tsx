import type React from "react";
import { AbsoluteFill } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { ClipReveal } from "@/components/ClipReveal";
import { TypeWriter } from "@/components/TypeWriter";
import { FONT, TEXT } from "@/lib/fonts";

const CURL_SEGMENTS = [
  { text: "curl ", color: "#e6edf3" },
  { text: "-X POST ", color: "#79c0ff" },
  { text: "localhost:1349/api/v1/tools/resize ", color: "#a5d6ff" },
  { text: '-F "file=@photo.jpg" ', color: "#7ee787" },
  { text: "-F ", color: "#79c0ff" },
  { text: '"settings={\\"width\\":800}"', color: "#ffa657" },
];

export const ApiDocsScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      <AppWindow
        title="API Docs"
        width={1200}
        height={600}
        topBarColor="#1e293b"
        bodyColor="#0d1117"
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 12,
              color: "#8b949e",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Example Request
          </div>
          <div
            style={{ backgroundColor: "#161b22", borderRadius: 8, padding: 16, marginBottom: 16 }}
          >
            <TypeWriter
              segments={CURL_SEGMENTS}
              startFrame={10}
              speed={1}
              style={{ fontSize: 14, lineHeight: 1.6 }}
            />
          </div>

          <ClipReveal startFrame={80}>
            <div style={{ backgroundColor: "#161b22", borderRadius: 8, padding: 16 }}>
              <pre
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  color: "#e6edf3",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {`{
  "downloadUrl": "/api/v1/download/abc123",
  "originalSize": 2400000,
  "processedSize": 340000
}`}
              </pre>
            </div>
          </ClipReveal>
        </div>
      </AppWindow>

      <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center" }}>
        <ClipReveal startFrame={100}>
          <span style={{ ...TEXT.sectionTitle, fontSize: 28, color: "#0a0a0a" }}>
            Every tool via REST API.
          </span>
        </ClipReveal>
      </div>
    </AbsoluteFill>
  );
};
