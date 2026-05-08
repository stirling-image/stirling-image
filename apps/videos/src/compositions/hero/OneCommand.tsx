import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TerminalWindow } from "@/components/TerminalWindow";
import { TypeWriter } from "@/components/TypeWriter";
import { FONT, TEXT } from "@/lib/fonts";
import { EASE, SPRING } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/*  Docker command segments with syntax highlighting                    */
/* ------------------------------------------------------------------ */

const DOCKER_SEGMENTS = [
  { text: "docker", color: "#ff7b72" },
  { text: " run ", color: "#7ee787" },
  { text: "-d ", color: "#79c0ff" },
  { text: "--name ", color: "#79c0ff" },
  { text: "snapotter ", color: "#a5d6ff" },
  { text: "-p ", color: "#79c0ff" },
  { text: "1349:1349 ", color: "#a5d6ff" },
  { text: "snapotter/snapotter", color: "#7ee787" },
];

/* ------------------------------------------------------------------ */
/*  Spinner characters                                                 */
/* ------------------------------------------------------------------ */

const SPINNER_CHARS = ["|", "/", "-", "\\"];

/* ------------------------------------------------------------------ */
/*  Address bar component for the morph                                */
/* ------------------------------------------------------------------ */

const AddressBar: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      opacity,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderRadius: 6,
      padding: "3px 12px",
      height: 24,
    }}
  >
    {/* Green lock icon */}
    <svg width={12} height={12} viewBox="0 0 12 12" role="img" aria-label="Secure">
      <rect x={2} y={5.5} width={8} height={5.5} rx={1} fill="#28c840" />
      <path
        d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"
        stroke="#28c840"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
    <span
      style={{
        fontFamily: FONT.body,
        fontSize: 12,
        fontWeight: 500,
        color: "rgba(255,255,255,0.7)",
      }}
    >
      localhost:1349
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main composition                                                   */
/* ------------------------------------------------------------------ */

export const OneCommand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;

  /* ================================================================ */
  /*  Act 1: Terminal slides up (frame 0-30)                           */
  /* ================================================================ */

  const terminalEntrySpring = spring({
    frame,
    fps,
    config: SPRING.snappy,
  });
  const terminalSlideY = interpolate(terminalEntrySpring, [0, 1], [600, 0]);

  /* ================================================================ */
  /*  Act 2: Typing (frame 30-180)                                     */
  /* ================================================================ */

  /* Prompt "$ " visible once terminal is in */
  const promptOpacity = interpolate(frame, [28, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Cursor blink at the prompt before typing starts (frame 30-35) */
  const preTypingCursorVisible = frame >= 30 && frame < 35 && Math.floor(frame / 4) % 2 === 0;

  /* ================================================================ */
  /*  Act 3: Processing lines (frame 180-215)                          */
  /* ================================================================ */

  /* "Pulling..." text appears */
  const pullingOpacity = interpolate(frame, [180, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Spinner cycles every 3 frames */
  const spinnerChar =
    frame >= 185 && frame < 210
      ? SPINNER_CHARS[Math.floor((frame - 185) / 3) % SPINNER_CHARS.length]
      : null;

  /* Checkmark line */
  const checkmarkSpring = spring({
    frame: frame - 210,
    fps,
    config: SPRING.popIn,
  });
  const showCheckmark = frame >= 210;

  /* ================================================================ */
  /*  Act 4: Terminal-to-App Morph (frame 215-280)                     */
  /* ================================================================ */

  /* Body background color morph */
  const bodyBg =
    frame >= 215 ? interpolateColors(frame, [215, 250], ["#0d1117", "#ffffff"]) : "#0d1117";

  /* Terminal text fade out */
  const textFadeOut = interpolate(frame, [215, 235], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Window size morph */
  const windowWidth = interpolate(frame, [215, 260], [900, 1100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const windowHeight = interpolate(frame, [215, 260], [500, 650], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  /* Dots fade out */
  const dotsOpacity = interpolate(frame, [220, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Address bar fade in */
  const addressBarOpacity = interpolate(frame, [240, 255], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Top bar color morph */
  const topBarColor =
    frame >= 215 ? interpolateColors(frame, [215, 250], ["#1e1e2e", "#2d2d3f"]) : "#1e1e2e";

  /* App mockup appears at frame 260 */
  const showAppMockup = frame >= 258;
  const appMockupOpacity = interpolate(frame, [258, 270], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ================================================================ */
  /*  Act 5: Tagline + float (frame 280-390)                           */
  /* ================================================================ */

  /* Amber glow behind browser */
  const glowOpacity = interpolate(frame, [320, 340], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Float animation (subtle oscillation) */
  const floatY = frame >= 350 ? Math.sin((frame - 350) * 0.15) * 3 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0a09", overflow: "hidden" }}>
      {/* Amber glow behind browser (Act 5) */}
      {frame >= 320 && (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy - 30,
            width: 1200,
            height: 800,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(245,158,11,0.4) 0%, transparent 70%)",
            opacity: glowOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Terminal / Browser window */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy - 30,
          transform: `translate(-50%, -50%) translateY(${terminalSlideY + floatY}px)`,
        }}
      >
        <TerminalWindow
          width={windowWidth}
          height={windowHeight}
          title="Terminal"
          dotsOpacity={dotsOpacity}
          topBarColor={topBarColor}
          bodyColor={bodyBg}
          titleElement={frame >= 240 ? <AddressBar opacity={addressBarOpacity} /> : undefined}
        >
          {/* Terminal text content (fades out during morph) */}
          <div style={{ opacity: textFadeOut }}>
            {/* Prompt line */}
            <div
              style={{
                ...TEXT.mono,
                fontSize: 18,
                lineHeight: 1.6,
                display: "flex",
                alignItems: "center",
                opacity: promptOpacity,
              }}
            >
              <span style={{ color: "#8b949e", marginRight: 8 }}>$</span>
              {frame >= 35 ? (
                <TypeWriter
                  segments={DOCKER_SEGMENTS}
                  startFrame={35}
                  speed={2}
                  style={{ fontSize: 18 }}
                />
              ) : (
                preTypingCursorVisible && (
                  <span
                    style={{
                      backgroundColor: "#7ee787",
                      width: 10,
                      height: 20,
                      display: "inline-block",
                    }}
                  />
                )
              )}
            </div>

            {/* Processing output (Act 3) */}
            {frame >= 180 && (
              <div
                style={{
                  ...TEXT.mono,
                  fontSize: 16,
                  marginTop: 12,
                  opacity: pullingOpacity,
                }}
              >
                <div style={{ color: "#8b949e" }}>Pulling snapotter/snapotter:latest...</div>

                {/* Spinner line */}
                {spinnerChar && !showCheckmark && (
                  <div style={{ color: "#58a6ff", marginTop: 4 }}>{spinnerChar}</div>
                )}

                {/* Checkmark line */}
                {showCheckmark && (
                  <div
                    style={{
                      color: "#7ee787",
                      marginTop: 4,
                      transform: `scale(${checkmarkSpring})`,
                      transformOrigin: "left center",
                    }}
                  >
                    &#10003; Container started on :1349
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real app screenshot (appears during morph) */}
          {showAppMockup && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: appMockupOpacity,
                overflow: "hidden",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <Img
                src={staticFile("screenshots/app-full.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                }}
              />
            </div>
          )}
        </TerminalWindow>
      </div>

      {/* Tagline (Act 5) */}
      {frame >= 310 && (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy + windowHeight / 2 + 20 + floatY,
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <ClipReveal startFrame={320}>
            <span style={{ ...TEXT.sectionTitle, color: "white" }}>
              One command. That&apos;s it.
            </span>
          </ClipReveal>
        </div>
      )}

      <GrainOverlay />
    </AbsoluteFill>
  );
};
