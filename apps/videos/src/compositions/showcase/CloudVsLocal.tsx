import { evolvePath } from "@remotion/paths";
import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ShieldIcon } from "@/components/ShieldIcon";
import { COLOR } from "@/lib/colors";
import { FONT, TEXT } from "@/lib/fonts";
import { EASE, SPRING } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CX = 1920 / 2;
const CY = 1080 / 2;
const DIVIDER_X = 960;

/* ------------------------------------------------------------------ */
/*  SVG path helpers                                                   */
/* ------------------------------------------------------------------ */

const CLOUD_SVG_PATH = "M6 19a5 5 0 0 1-1-9.9A7 7 0 0 1 19.07 11 4.5 4.5 0 0 1 18 20H6Z";

const LOCK_SVG_PATH =
  "M5 11V7a5 5 0 0 1 10 0v4M3 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z";

const _SERVER_SVG_PATH = "M2 2h16v6H2zM2 10h16v6H2zM6 5h.01M6 13h.01";

const _EYE_SVG_PATH =
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";

/* ------------------------------------------------------------------ */
/*  Cloud icon                                                         */
/* ------------------------------------------------------------------ */

const CloudIcon: React.FC<{
  size: number;
  color?: string;
  drawProgress?: number;
  style?: React.CSSProperties;
}> = ({ size, color = COLOR.danger, drawProgress = 1, style }) => {
  const { strokeDasharray, strokeDashoffset } = evolvePath(drawProgress, CLOUD_SVG_PATH);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      role="img"
      aria-label="Cloud"
    >
      <path
        d={CLOUD_SVG_PATH}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Server icon                                                        */
/* ------------------------------------------------------------------ */

const ServerIcon: React.FC<{
  size: number;
  color?: string;
  label?: string;
  style?: React.CSSProperties;
}> = ({ size, color = "#6b7280", label, style }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
    <svg width={size} height={size} viewBox="0 0 20 18" fill="none" role="img" aria-label="Server">
      <rect x={1} y={1} width={18} height={7} rx={2} stroke={color} strokeWidth={1.5} fill="none" />
      <rect
        x={1}
        y={10}
        width={18}
        height={7}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <circle cx={5} cy={4.5} r={1} fill={color} />
      <circle cx={5} cy={13.5} r={1} fill={color} />
    </svg>
    {label && (
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 9,
          fontWeight: 600,
          color,
          marginTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Question mark badge                                                */
/* ------------------------------------------------------------------ */

const QuestionBadge: React.FC<{
  x: number;
  y: number;
  scale: number;
}> = ({ x, y, scale }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(239,68,68,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT.body,
      fontSize: 12,
      fontWeight: 700,
      color: COLOR.danger,
    }}
  >
    ?
  </div>
);

/* ------------------------------------------------------------------ */
/*  Warning badge (triangle with !)                                    */
/* ------------------------------------------------------------------ */

const WarningBadge: React.FC<{
  x: number;
  y: number;
  scale: number;
  color?: string;
}> = ({ x, y, scale, color = COLOR.danger }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
    }}
  >
    <svg width={18} height={18} viewBox="0 0 18 18" role="img" aria-label="Warning">
      <path d="M9 1L17 16H1L9 1Z" fill={color} opacity={0.2} stroke={color} strokeWidth={1.2} />
      <text
        x={9}
        y={14}
        textAnchor="middle"
        fill={color}
        fontFamily={FONT.body}
        fontSize={10}
        fontWeight={700}
      >
        !
      </text>
    </svg>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Lock icon                                                          */
/* ------------------------------------------------------------------ */

const LockIcon: React.FC<{
  size: number;
  color?: string;
  drawProgress?: number;
  style?: React.CSSProperties;
}> = ({ size, color = COLOR.safe, drawProgress = 1, style }) => {
  const { strokeDasharray, strokeDashoffset } = evolvePath(drawProgress, LOCK_SVG_PATH);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 22"
      fill="none"
      style={style}
      role="img"
      aria-label="Lock"
    >
      <path
        d={LOCK_SVG_PATH}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Checkmark icon                                                     */
/* ------------------------------------------------------------------ */

const Checkmark: React.FC<{
  size: number;
  color: string;
  scale: number;
  style?: React.CSSProperties;
}> = ({ size, color, scale, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ ...style, transform: `scale(${scale})` }}
    role="img"
    aria-label="Checkmark"
  >
    <circle cx={12} cy={12} r={10} fill={color} opacity={0.15} />
    <path
      d="M8 12.5l2.5 2.5 5-5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Spinner                                                            */
/* ------------------------------------------------------------------ */

const Spinner: React.FC<{
  color: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ color, size, style }) => {
  const frame = useCurrentFrame();
  const rotation = frame * 18; // 6 deg/frame => 180 deg/s
  const circumference = Math.PI * (size - 4);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ ...style, transform: `rotate(${rotation}deg)` }}
      role="img"
      aria-label="Processing"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size - 4) / 2}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Eye icon (watching)                                                */
/* ------------------------------------------------------------------ */

const EyeIcon: React.FC<{
  x: number;
  y: number;
  opacity: number;
}> = ({ x, y, opacity }) => {
  const frame = useCurrentFrame();
  // Blink: close eye briefly every ~40 frames
  const blinkPhase = frame % 40;
  const eyeScale = blinkPhase >= 0 && blinkPhase < 3 ? 0.3 : 1;

  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        left: x - 12,
        top: y - 12,
        opacity,
        transform: `scaleY(${eyeScale})`,
        transformOrigin: "center",
      }}
      role="img"
      aria-label="Watching"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={COLOR.danger}
        strokeWidth={1.5}
        fill="none"
      />
      <circle cx={12} cy={12} r={3} fill={COLOR.danger} opacity={0.5} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Cloud server positions (pre-computed for scatter)                   */
/* ------------------------------------------------------------------ */

const CLOUD_SERVERS = [
  { x: 180, y: 340, label: "" },
  { x: 340, y: 420, label: "" },
  { x: 580, y: 300, label: "" },
];

const EXTRA_SERVERS = [
  { x: 120, y: 500, label: "" },
  { x: 450, y: 540, label: "" },
  { x: 680, y: 460, label: "" },
  { x: 280, y: 580, label: "" },
];

/* Labeled nodes for Act 3 */
const THIRD_PARTY_NODES = [
  { x: 620, y: 540, label: "3rd Party", color: "#6b7280" },
  { x: 150, y: 600, label: "Analytics", color: "#6b7280" },
  { x: 420, y: 640, label: "Training Data", color: "#d97706" },
];

/* ------------------------------------------------------------------ */
/*  Main composition                                                   */
/* ------------------------------------------------------------------ */

export const CloudVsLocal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* ================================================================ */
  /*  Act 1: Split Establishment (frame 0-40)                          */
  /* ================================================================ */

  /* Divider line draws top to bottom */
  const dividerPath = `M${DIVIDER_X} 0 L${DIVIDER_X} 1080`;
  const dividerProgress = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });
  const dividerEvolve = evolvePath(dividerProgress, dividerPath);

  /* Tint overlays */
  const leftTintOpacity = interpolate(frame, [15, 25], [0, 0.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightTintOpacity = interpolate(frame, [15, 25], [0, 0.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Cloud icon draw */
  const cloudDrawProgress = interpolate(frame, [25, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  /* ================================================================ */
  /*  Act 2: Single Photo Comparison (frame 40-160)                    */
  /* ================================================================ */

  /* -- LEFT SIDE -- */

  /* Photo appears */
  const leftPhotoOpacity = interpolate(frame, [40, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Photo moves to cloud: follows curved path upward */
  const leftUploadProgress = interpolate(frame, [55, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const leftPhotoX = interpolate(leftUploadProgress, [0, 0.5, 1], [200, 350, 400]);
  const leftPhotoY = interpolate(leftUploadProgress, [0, 0.5, 1], [700, 400, 160]);

  /* Cloud flash when photo arrives */
  const cloudFlashOpacity =
    frame >= 80 && frame < 88
      ? interpolate(frame, [80, 84, 88], [0, 0.4, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  /* Scatter copies to servers */
  const scatterProgress = interpolate(frame, [85, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  /* Question marks pop in */
  const questionMarks = CLOUD_SERVERS.map((server, i) => {
    const qStart = 110 + i * 6;
    const qSpring = spring({
      frame: frame - qStart,
      fps,
      config: SPRING.popIn,
    });
    return { ...server, scale: qSpring };
  });

  /* Eye icon */
  const eyeOpacity = interpolate(frame, [118, 125], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* "who has your data?" */
  const leftLabelOpacity = interpolate(frame, [130, 145], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* -- RIGHT SIDE -- */

  /* Photo appears */
  const rightPhotoOpacity = interpolate(frame, [40, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Photo moves to local server: curves downward */
  const rightDownloadProgress = interpolate(frame, [55, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const rightPhotoX = interpolate(rightDownloadProgress, [0, 0.5, 1], [1400, 1350, 1400]);
  const rightPhotoY = interpolate(rightDownloadProgress, [0, 0.5, 1], [300, 500, 620]);

  /* Processing spinner -> checkmark */
  const showSpinner = frame >= 80 && frame < 100;
  const checkmarkSpring = spring({
    frame: frame - 100,
    fps,
    config: SPRING.popIn,
  });
  const showCheckmark = frame >= 100;

  /* Lock icon draws in */
  const lockProgress = interpolate(frame, [100, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  /* "stays on your machine" */
  const rightLabelOpacity = interpolate(frame, [130, 145], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Shield outline */
  const _shieldDrawProgress = interpolate(frame, [135, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  /* ================================================================ */
  /*  Act 3: Escalation (frame 160-320)                                */
  /* ================================================================ */

  /* Left: extra photos upload (staggered) */
  const extraPhotoCount = 4;
  const extraPhotos = Array.from({ length: extraPhotoCount }, (_, i) => {
    const start = 160 + i * 6;
    const progress = interpolate(frame, [start, start + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.smooth,
    });
    const hue = 20 + random(`extra-hue-${i}`) * 60;
    return { progress, hue, index: i };
  });

  /* Extra server appearances */
  const extraServerAppearances = EXTRA_SERVERS.map((server, i) => {
    const start = 175 + i * 8;
    const s = spring({
      frame: frame - start,
      fps,
      config: SPRING.snappy,
    });
    return { ...server, scale: s };
  });

  /* 3rd party node connections */
  const thirdPartyNodes = THIRD_PARTY_NODES.map((node, i) => {
    const start = 200 + i * 15;
    const drawProg = interpolate(frame, [start, start + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.enter,
    });
    const labelOpacity = interpolate(frame, [start + 15, start + 25], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { ...node, drawProgress: drawProg, labelOpacity };
  });

  /* ToS scroll */
  const tosHeight = interpolate(frame, [220, 260], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  /* Warning badges */
  const warningBadges = [
    { x: 160, y: 360, start: 265 },
    { x: 360, y: 440, start: 272 },
    { x: 560, y: 320, start: 278 },
    { x: 110, y: 520, start: 284 },
    { x: 440, y: 560, start: 290 },
  ].map((badge) => {
    const s = spring({
      frame: frame - badge.start,
      fps,
      config: SPRING.popIn,
    });
    return { ...badge, scale: s };
  });

  /* Left side red tint escalation (starts at 5%, escalates to 20% by Act 4) */
  const escalatedLeftTint = interpolate(frame, [160, 320], [0.05, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Shake animation (frame 300-320) */
  const shakeX = frame >= 300 && frame <= 320 ? Math.sin(frame * 2.5) * 5 : 0;

  /* Right: extra photos arrive calmly */
  const rightExtraPhotos = Array.from({ length: 4 }, (_, i) => {
    const start = 165 + i * 20;
    const progress = interpolate(frame, [start, start + 25], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.smooth,
    });
    const checkSpring = spring({
      frame: frame - (start + 28),
      fps,
      config: SPRING.popIn,
    });
    const hue = 140 + random(`right-hue-${i}`) * 60;
    return { progress, checkScale: checkSpring, hue, index: i };
  });

  /* Shield breathing */
  const shieldBreathing = frame >= 290 ? 1 + Math.sin((frame - 290) * 0.08) * 0.01 : 1;

  /* ================================================================ */
  /*  Act 4: Contrast Peak (frame 320-420)                             */
  /* ================================================================ */

  /* Left: deeper red tint */
  const peakLeftTint = interpolate(frame, [320, 360], [0.2, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Left vibrate */
  const vibrateX = frame >= 320 && frame < 420 ? Math.sin(frame * 3) * 3 : 0;

  /* Right glow */
  const rightGlowOpacity = interpolate(frame, [360, 400], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ================================================================ */
  /*  Act 5: Resolution (frame 420-540)                                */
  /* ================================================================ */

  /* Left half slides off */
  const leftSlideX = interpolate(frame, [420, 470], [0, -960], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });
  const leftFadeOut = interpolate(frame, [420, 460], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Divider slides with left */
  const dividerSlideX = interpolate(frame, [420, 470], [0, -960], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  /* Right side expands to center */
  const rightExpandX = interpolate(frame, [450, 500], [960, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  /* Full-width shield */
  const fullShieldOpacity = interpolate(frame, [470, 500], [0, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Logo fade in */
  const logoOpacity = interpolate(frame, [520, 535], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Compute effective left tint for current frame */
  const effectiveLeftTint =
    frame < 160 ? leftTintOpacity : frame < 320 ? escalatedLeftTint : peakLeftTint;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark, overflow: "hidden" }}>
      {/* ================================================================ */}
      {/*  LEFT HALF: Cloud Services                                       */}
      {/* ================================================================ */}
      <div
        style={{
          position: "absolute",
          left: leftSlideX,
          top: 0,
          width: DIVIDER_X,
          height: 1080,
          overflow: "hidden",
          opacity: leftFadeOut,
          transform: `translateX(${shakeX + vibrateX}px)`,
        }}
      >
        {/* Red tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: COLOR.cloudRed,
            opacity: effectiveLeftTint,
            pointerEvents: "none",
          }}
        />

        {/* Title */}
        {frame >= 25 && (
          <div
            style={{
              position: "absolute",
              left: DIVIDER_X / 2,
              top: 50,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CloudIcon size={28} drawProgress={cloudDrawProgress} />
            <ClipReveal startFrame={25} duration={10}>
              <span
                style={{
                  ...TEXT.label,
                  color: COLOR.danger,
                  fontSize: 16,
                }}
              >
                Cloud Services
              </span>
            </ClipReveal>
          </div>
        )}

        {/* Cloud icon at top center */}
        <div
          style={{
            position: "absolute",
            left: DIVIDER_X / 2 - 20,
            top: 120,
          }}
        >
          <CloudIcon size={40} color={COLOR.danger} />
          {/* Cloud flash */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              backgroundColor: COLOR.danger,
              opacity: cloudFlashOpacity,
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Eye icon above cloud */}
        {frame >= 115 && <EyeIcon x={DIVIDER_X / 2} y={105} opacity={eyeOpacity} />}

        {/* Photo thumbnail (Act 2) */}
        {frame >= 40 && frame < 85 && (
          <Img
            src={staticFile("screenshots/sample-photo-portrait.jpg")}
            style={{
              position: "absolute",
              width: 48,
              height: 48,
              objectFit: "cover",
              borderRadius: 6,
              left: leftPhotoX - 24,
              top: leftPhotoY - 24,
              opacity: leftPhotoOpacity,
            }}
          />
        )}

        {/* Upload arrow path */}
        {frame >= 55 && frame < 85 && (
          <svg
            style={{ position: "absolute", inset: 0 }}
            width={DIVIDER_X}
            height={1080}
            role="img"
            aria-label="Upload path"
          >
            <line
              x1={200}
              y1={700}
              x2={400}
              y2={160}
              stroke={COLOR.danger}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.4 * leftUploadProgress}
            />
          </svg>
        )}

        {/* Scattered servers */}
        {frame >= 85 &&
          CLOUD_SERVERS.map((server, i) => (
            <div
              key={`server-${i}`}
              style={{
                position: "absolute",
                left: server.x,
                top: server.y,
                transform: `translate(-50%, -50%) scale(${Math.min(scatterProgress * 2, 1)})`,
                opacity: Math.min(scatterProgress * 2, 1),
              }}
            >
              <ServerIcon size={36} />
            </div>
          ))}

        {/* Scattered photo copies to servers */}
        {frame >= 85 &&
          CLOUD_SERVERS.map((server, i) => {
            const copyX = interpolate(scatterProgress, [0, 1], [400, server.x]);
            const copyY = interpolate(scatterProgress, [0, 1], [160, server.y - 30]);
            return (
              <Img
                key={`copy-${i}`}
                src={staticFile("screenshots/sample-photo-portrait.jpg")}
                style={{
                  position: "absolute",
                  width: 28,
                  height: 28,
                  objectFit: "cover",
                  borderRadius: 4,
                  left: copyX - 14,
                  top: copyY - 14,
                  opacity: scatterProgress,
                }}
              />
            );
          })}

        {/* Dotted trail lines from cloud to servers */}
        {frame >= 90 && (
          <svg
            style={{ position: "absolute", inset: 0 }}
            width={DIVIDER_X}
            height={1080}
            role="img"
            aria-label="Data connections"
          >
            {CLOUD_SERVERS.map((server, i) => (
              <line
                key={`trail-${i}`}
                x1={DIVIDER_X / 2}
                y1={160}
                x2={server.x}
                y2={server.y}
                stroke={COLOR.danger}
                strokeWidth={1}
                strokeDasharray="3 5"
                opacity={0.3 * scatterProgress}
              />
            ))}
          </svg>
        )}

        {/* Question marks */}
        {frame >= 110 &&
          questionMarks.map((q, i) => (
            <QuestionBadge key={`q-${i}`} x={q.x + 20} y={q.y - 20} scale={q.scale} />
          ))}

        {/* "who has your data?" label */}
        {frame >= 130 && (
          <div
            style={{
              position: "absolute",
              left: DIVIDER_X / 2,
              top: 780,
              transform: "translateX(-50%)",
              opacity: leftLabelOpacity,
              textAlign: "center",
            }}
          >
            <span style={{ ...TEXT.body, color: COLOR.danger, fontSize: 16 }}>
              who has your data?
            </span>
          </div>
        )}

        {/* Act 3: Extra photos uploading */}
        {frame >= 160 &&
          extraPhotos.map((photo) => {
            const px = interpolate(photo.progress, [0, 1], [100 + photo.index * 60, 400]);
            const py = interpolate(photo.progress, [0, 1], [750, 160]);
            if (photo.progress <= 0) return null;
            return (
              <Img
                key={`extra-${photo.index}`}
                src={staticFile("screenshots/sample-photo-portrait.jpg")}
                style={{
                  position: "absolute",
                  width: 36,
                  height: 36,
                  objectFit: "cover",
                  objectPosition: `${photo.index * 25}% center`,
                  borderRadius: 6,
                  left: px - 18,
                  top: py - 18,
                  opacity: photo.progress,
                }}
              />
            );
          })}

        {/* Extra servers */}
        {frame >= 175 &&
          extraServerAppearances.map((server, i) => (
            <div
              key={`eserver-${i}`}
              style={{
                position: "absolute",
                left: server.x,
                top: server.y,
                transform: `translate(-50%, -50%) scale(${server.scale})`,
                opacity: Math.min(server.scale * 2, 1),
              }}
            >
              <ServerIcon size={36} />
            </div>
          ))}

        {/* 3rd party nodes with connections */}
        {frame >= 200 && (
          <svg
            style={{ position: "absolute", inset: 0 }}
            width={DIVIDER_X}
            height={1080}
            role="img"
            aria-label="Third party connections"
          >
            {thirdPartyNodes.map((node, i) => {
              const sourceServer = i < EXTRA_SERVERS.length ? EXTRA_SERVERS[i] : CLOUD_SERVERS[0];
              return (
                <line
                  key={`tp-line-${i}`}
                  x1={sourceServer.x}
                  y1={sourceServer.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={node.color}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  opacity={0.4 * node.drawProgress}
                />
              );
            })}
          </svg>
        )}

        {frame >= 200 &&
          thirdPartyNodes.map((node, i) => (
            <div
              key={`tp-${i}`}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                transform: "translate(-50%, -50%)",
                opacity: node.labelOpacity,
              }}
            >
              <div
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  backgroundColor: `${node.color}20`,
                  border: `1px solid ${node.color}40`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 10,
                    fontWeight: 600,
                    color: node.color,
                  }}
                >
                  {node.label}
                </span>
              </div>
            </div>
          ))}

        {/* ToS scroll */}
        {frame >= 220 && tosHeight > 0 && (
          <div
            style={{
              position: "absolute",
              left: DIVIDER_X / 2 - 30,
              top: 200,
              width: 60,
              height: tosHeight,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={`tos-line-${i}`}
                style={{
                  height: 2,
                  width: `${50 + random(`tos-w-${i}`) * 40}%`,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        )}

        {/* Warning badges */}
        {frame >= 260 &&
          warningBadges.map((badge, i) => (
            <WarningBadge
              key={`warn-${i}`}
              x={badge.x}
              y={badge.y}
              scale={badge.scale}
              color={i >= 3 ? COLOR.danger : "#d97706"}
            />
          ))}

        {/* Act 4: "where did your data go?" */}
        {frame >= 320 && frame < 420 && (
          <div
            style={{
              position: "absolute",
              left: DIVIDER_X / 2,
              top: 860,
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <ClipReveal startFrame={320} duration={18}>
              <span style={{ ...TEXT.sectionTitle, fontSize: 32, color: COLOR.danger }}>
                where did your data go?
              </span>
            </ClipReveal>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  RIGHT HALF: SnapOtter Local                                     */}
      {/* ================================================================ */}
      <div
        style={{
          position: "absolute",
          left: frame >= 420 ? rightExpandX : DIVIDER_X,
          top: 0,
          width: frame >= 450 ? 1920 : DIVIDER_X,
          height: 1080,
          overflow: "hidden",
        }}
      >
        {/* Green tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: COLOR.localGreen,
            opacity: rightTintOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Title */}
        {frame >= 30 && frame < 470 && (
          <div
            style={{
              position: "absolute",
              left: frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2,
              top: 50,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Img
              src={staticFile("logo.png")}
              width={28}
              height={28}
              style={{ borderRadius: 4, opacity: frame >= 35 ? 1 : 0 }}
            />
            <ClipReveal startFrame={30} duration={10}>
              <span
                style={{
                  ...TEXT.label,
                  color: COLOR.safe,
                  fontSize: 16,
                }}
              >
                SnapOtter
              </span>
            </ClipReveal>
          </div>
        )}

        {/* Local server icon */}
        <div
          style={{
            position: "absolute",
            left: frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2,
            top: 620,
            transform: `translate(-50%, -50%) scale(${shieldBreathing})`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ServerIcon size={32} color={COLOR.safe} />
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: 10,
                fontWeight: 600,
                color: COLOR.safe,
              }}
            >
              Local Server
            </span>
          </div>

          {/* Right glow behind server (Act 4) */}
          {frame >= 360 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 200,
                height: 200,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${COLOR.safe}40, transparent 70%)`,
                opacity: rightGlowOpacity,
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* First photo (Act 2) */}
        {frame >= 40 && frame < 80 && (
          <Img
            src={staticFile("screenshots/sample-photo-portrait.jpg")}
            style={{
              position: "absolute",
              width: 48,
              height: 48,
              objectFit: "cover",
              borderRadius: 6,
              left: rightPhotoX - DIVIDER_X - 24,
              top: rightPhotoY - 24,
              opacity: rightPhotoOpacity,
            }}
          />
        )}

        {/* Download arrow path */}
        {frame >= 55 && frame < 80 && (
          <svg
            style={{ position: "absolute", inset: 0 }}
            width={DIVIDER_X}
            height={1080}
            role="img"
            aria-label="Local path"
          >
            <line
              x1={DIVIDER_X / 2}
              y1={300}
              x2={DIVIDER_X / 2}
              y2={600}
              stroke={COLOR.safe}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.4 * rightDownloadProgress}
            />
          </svg>
        )}

        {/* Processing spinner */}
        {showSpinner && (
          <div
            style={{
              position: "absolute",
              left: (frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2) - 12,
              top: 560,
            }}
          >
            <Spinner color={COLOR.safe} size={24} />
          </div>
        )}

        {/* Checkmark */}
        {showCheckmark && (
          <div
            style={{
              position: "absolute",
              left: (frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2) - 12,
              top: 560,
            }}
          >
            <Checkmark size={24} color={COLOR.safe} scale={checkmarkSpring} />
          </div>
        )}

        {/* Lock icon */}
        {frame >= 100 && (
          <div
            style={{
              position: "absolute",
              left: (frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2) - 10,
              top: 520,
            }}
          >
            <LockIcon size={20} drawProgress={lockProgress} />
          </div>
        )}

        {/* "stays on your machine" label */}
        {frame >= 130 && frame < 470 && (
          <div
            style={{
              position: "absolute",
              left: frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2,
              top: 780,
              transform: "translateX(-50%)",
              opacity: rightLabelOpacity,
              textAlign: "center",
            }}
          >
            <span style={{ ...TEXT.body, color: COLOR.safe, fontSize: 16 }}>
              stays on your machine
            </span>
          </div>
        )}

        {/* Shield outline */}
        {frame >= 135 && frame < 470 && (
          <div
            style={{
              position: "absolute",
              left: (frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2) - 100,
              top: 400,
              opacity: 0.2,
              transform: `scale(${shieldBreathing})`,
            }}
          >
            <ShieldIcon size={200} startFrame={135} duration={25} />
          </div>
        )}

        {/* Right extra photos (Act 3) */}
        {frame >= 165 &&
          rightExtraPhotos.map((photo) => {
            if (photo.progress <= 0) return null;
            const px = DIVIDER_X / 2 - 80 + photo.index * 40;
            const py = interpolate(photo.progress, [0, 1], [400, 680]);
            return (
              <div
                key={`rphoto-${photo.index}`}
                style={{ position: "absolute", left: px, top: py }}
              >
                <Img
                  src={staticFile("screenshots/sample-photo-portrait.jpg")}
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "cover",
                    objectPosition: `${photo.index * 25}% center`,
                    borderRadius: 6,
                  }}
                />
                {photo.checkScale > 0.1 && (
                  <div style={{ position: "absolute", right: -8, bottom: -8 }}>
                    <Checkmark size={14} color={COLOR.safe} scale={photo.checkScale} />
                  </div>
                )}
              </div>
            );
          })}

        {/* "Air-gapped ready" label (Act 3) */}
        {frame >= 260 && frame < 470 && (
          <div
            style={{
              position: "absolute",
              left: frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2,
              top: 820,
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <ClipReveal startFrame={260} duration={12}>
              <span style={{ ...TEXT.body, color: COLOR.safe, fontSize: 14, fontWeight: 600 }}>
                Air-gapped ready
              </span>
            </ClipReveal>
          </div>
        )}

        {/* GDPR/HIPAA badge */}
        {frame >= 270 && frame < 470 && (
          <div
            style={{
              position: "absolute",
              left: frame >= 450 ? CX - rightExpandX : DIVIDER_X / 2,
              top: 850,
              transform: "translateX(-50%)",
            }}
          >
            <ClipReveal startFrame={270} duration={10}>
              <div
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  backgroundColor: `${COLOR.safe}20`,
                  border: `1px solid ${COLOR.safe}40`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLOR.safe,
                  }}
                >
                  GDPR / HIPAA
                </span>
              </div>
            </ClipReveal>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  DIVIDER LINE                                                    */}
      {/* ================================================================ */}
      {frame < 470 && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transform: `translateX(${dividerSlideX}px)`,
            opacity: leftFadeOut,
          }}
          width={1920}
          height={1080}
          role="img"
          aria-label="Divider"
        >
          <path
            d={dividerPath}
            stroke="#374151"
            strokeWidth={1}
            fill="none"
            opacity={0.3}
            strokeDasharray={dividerEvolve.strokeDasharray}
            strokeDashoffset={dividerEvolve.strokeDashoffset}
          />
        </svg>
      )}

      {/* ================================================================ */}
      {/*  Act 5: Full-width shield overlay                                */}
      {/* ================================================================ */}
      {frame >= 470 && (
        <div
          style={{
            position: "absolute",
            left: CX - 300,
            top: CY - 315,
            opacity: fullShieldOpacity,
          }}
        >
          <ShieldIcon size={600} startFrame={470} duration={20} />
        </div>
      )}

      {/* ================================================================ */}
      {/*  Act 5: Hero tagline                                             */}
      {/* ================================================================ */}
      {frame >= 500 && (
        <div
          style={{
            position: "absolute",
            left: CX,
            top: CY - 30,
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <ClipReveal startFrame={500} duration={18}>
            <span style={{ ...TEXT.heroHeadline }}>Your images never leave your network.</span>
          </ClipReveal>
        </div>
      )}

      {/* ================================================================ */}
      {/*  Act 5: Logo                                                     */}
      {/* ================================================================ */}
      {frame >= 520 && (
        <div
          style={{
            position: "absolute",
            left: CX - 40,
            top: CY + 50,
            opacity: logoOpacity,
          }}
        >
          <Img src={staticFile("logo.png")} width={80} height={80} style={{ borderRadius: 8 }} />
        </div>
      )}

      <GrainOverlay />
    </AbsoluteFill>
  );
};
