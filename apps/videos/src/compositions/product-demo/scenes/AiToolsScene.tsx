import type React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { AppWindow } from "@/components/AppWindow";
import { BeforeAfter } from "@/components/BeforeAfter";
import { ClipReveal } from "@/components/ClipReveal";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { COLOR } from "@/lib/colors";
import { FONT, TEXT } from "@/lib/fonts";

const Checkerboard: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      backgroundImage:
        "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      opacity: 0.4,
    }}
  />
);

export const AiToolsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f4" }}
    >
      {/* Background removal demo (0-180) */}
      <Sequence from={0} durationInFrames={180}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <AppWindow
            title="Remove Background"
            width={1200}
            height={700}
            topBarColor="#ffffff"
            bodyColor="#ffffff"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 40,
                padding: 24,
              }}
            >
              <Sequence from={0} durationInFrames={60}>
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "3px solid #3b82f6",
                        borderTop: "3px solid transparent",
                        borderRadius: "50%",
                      }}
                    />
                    <span style={{ fontFamily: FONT.body, fontSize: 14, color: "#3b82f6" }}>
                      Running rembg model locally...
                    </span>
                  </div>
                </AbsoluteFill>
              </Sequence>

              <Sequence from={60} durationInFrames={120}>
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
                  <BeforeAfter
                    before={<PhotoPlaceholder width={450} height={340} hue={30} />}
                    after={
                      <div style={{ position: "relative", width: 450, height: 340 }}>
                        <Checkerboard w={450} h={340} />
                        <div
                          style={{
                            position: "absolute",
                            top: 50,
                            left: 140,
                            width: 170,
                            height: 240,
                            borderRadius: "50% 50% 45% 45%",
                            background: "linear-gradient(135deg, #e8a87c, #d4856b)",
                          }}
                        />
                      </div>
                    }
                    scanStartFrame={10}
                    scanDuration={50}
                    width={450}
                    height={340}
                  />
                </AbsoluteFill>
              </Sequence>
            </div>
          </AppWindow>
        </AbsoluteFill>
      </Sequence>

      {/* Quick AI tool montage (180-360) */}
      <Sequence from={180} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <AppWindow
            title="Upscale 4x"
            width={1000}
            height={500}
            topBarColor="#ffffff"
            bodyColor="#ffffff"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 30,
              }}
            >
              <PhotoPlaceholder width={100} height={100} hue={200} />
              <span
                style={{
                  fontFamily: FONT.heading,
                  fontWeight: 800,
                  fontSize: 32,
                  color: COLOR.accent,
                }}
              >
                4x
              </span>
              <PhotoPlaceholder width={300} height={300} hue={200} />
            </div>
          </AppWindow>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <AppWindow
            title="OCR / Text Extraction"
            width={1000}
            height={500}
            topBarColor="#ffffff"
            bodyColor="#ffffff"
          >
            <div style={{ display: "flex", height: "100%" }}>
              <div
                style={{
                  flex: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhotoPlaceholder width={300} height={350} hue={50} />
              </div>
              <div
                style={{
                  flex: 0.5,
                  padding: 24,
                  borderLeft: "1px solid #e5e5e5",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 14, color: "#0a0a0a" }}
                >
                  Extracted Text
                </div>
                {["Lorem ipsum dolor sit", "amet consectetur", "adipiscing elit sed do"].map(
                  (line, i) => (
                    <div
                      key={`ocr-${i}`}
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 13,
                        color: "#525252",
                        padding: "4px 8px",
                        backgroundColor: "#eff6ff",
                        borderRadius: 4,
                      }}
                    >
                      {line}
                    </div>
                  ),
                )}
              </div>
            </div>
          </AppWindow>
        </AbsoluteFill>
      </Sequence>

      {/* Bottom text */}
      <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center" }}>
        <ClipReveal startFrame={300}>
          <span style={{ ...TEXT.sectionTitle, fontSize: 32, color: "#0a0a0a" }}>
            All on your hardware.
          </span>
        </ClipReveal>
      </div>
    </AbsoluteFill>
  );
};
