import { Trail } from "@remotion/motion-blur";
import { evolvePath } from "@remotion/paths";
import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { Counter } from "@/components/Counter";
import { GrainOverlay } from "@/components/GrainOverlay";
import { COLOR } from "@/lib/colors";
import { FONT, TEXT } from "@/lib/fonts";
import { EASE, SPRING } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATIONS = [
  { id: "resize", label: "Resize", color: "#3B82F6", x: 120 },
  { id: "compress", label: "Compress", color: "#10B981", x: 340 },
  { id: "watermark", label: "Watermark", color: "#EF4444", x: 560 },
] as const;

const FOLDER_X = 720;
const STATION_Y = 280;
const STATION_W = 100;
const STATION_H = 80;
const THUMB_START_X = -60;
const BATCH_COUNT = 50;

/* ------------------------------------------------------------------ */
/*  SVG Station Icons (minimal 20x20)                                  */
/* ------------------------------------------------------------------ */

const ResizeIcon: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <path
      d="M4 16L16 4M16 4H10M16 4V10"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CompressIcon: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <circle cx={10} cy={10} r={7} stroke="white" strokeWidth={2} />
    <path
      d="M10 5V10L13 13"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WatermarkIcon: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <rect x={3} y={6} width={14} height={10} rx={2} stroke="white" strokeWidth={2} />
    <path d="M7 4H13" stroke="white" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const STATION_ICONS: Record<string, React.FC> = {
  resize: ResizeIcon,
  compress: CompressIcon,
  watermark: WatermarkIcon,
};

/* ------------------------------------------------------------------ */
/*  Station component                                                  */
/* ------------------------------------------------------------------ */

const Station: React.FC<{
  station: (typeof STATIONS)[number];
  index: number;
  glowing: boolean;
  pulseGlow: boolean;
}> = ({ station, index, glowing, pulseGlow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    delay: index * 8,
    config: SPRING.snappy,
  });

  const Icon = STATION_ICONS[station.id];
  const glowOpacity = pulseGlow ? 0.3 + Math.sin(frame * 0.3) * 0.2 : glowing ? 0.5 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: station.x - STATION_W / 2,
        top: STATION_Y - STATION_H / 2,
        width: STATION_W,
        height: STATION_H,
        borderRadius: 12,
        backgroundColor: `${station.color}20`,
        border: `2px solid ${station.color}${glowing || pulseGlow ? "cc" : "66"}`,
        boxShadow:
          glowOpacity > 0
            ? `0 4px 20px rgba(0,0,0,0.4), 0 0 20px ${station.color}${Math.round(glowOpacity * 255)
                .toString(16)
                .padStart(2, "0")}`
            : "0 4px 20px rgba(0,0,0,0.4)",
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {Icon && <Icon />}
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 12,
          fontWeight: 600,
          color: station.color,
          letterSpacing: "0.02em",
        }}
      >
        {station.label}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Connector lines between stations                                   */
/* ------------------------------------------------------------------ */

const ConnectorLine: React.FC<{
  fromX: number;
  toX: number;
  delay: number;
}> = ({ fromX, toX, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  const x1 = fromX + STATION_W / 2 + 4;
  const x2 = toX - STATION_W / 2 - 4;
  const pathD = `M ${x1} ${STATION_Y} L ${x2} ${STATION_Y}`;
  const evolved = evolvePath(progress, pathD);

  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: 800, height: 600 }}>
      <path
        d={pathD}
        fill="none"
        stroke={`${COLOR.muted}80`}
        strokeWidth={2}
        strokeDasharray={evolved.strokeDasharray}
        strokeDashoffset={evolved.strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Folder icon                                                        */
/* ------------------------------------------------------------------ */

const FolderIcon: React.FC<{ pulse: boolean }> = ({ pulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, delay: 24, config: SPRING.snappy });
  const pulseScale = pulse ? 1 + Math.sin(frame * 0.2) * 0.05 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: FOLDER_X - 30,
        top: STATION_Y - 25,
        transform: `scale(${scale * pulseScale})`,
      }}
    >
      <svg width={60} height={50} viewBox="0 0 60 50" fill="none">
        <path
          d="M4 12C4 9.79 5.79 8 8 8H22L28 14H52C54.21 14 56 15.79 56 18V42C56 44.21 54.21 46 52 46H8C5.79 46 4 44.21 4 42V12Z"
          fill="#F59E0B"
          opacity={0.9}
        />
        <path
          d="M4 18H56V42C56 44.21 54.21 46 52 46H8C5.79 46 4 44.21 4 42V18Z"
          fill="#FBBF24"
          opacity={0.6}
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Progress ring (SVG circle with stroke animation)                   */
/* ------------------------------------------------------------------ */

const ProgressRing: React.FC<{
  progress: number;
  color: string;
  x: number;
  y: number;
}> = ({ progress, color, x, y }) => {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg
      width={36}
      height={36}
      style={{
        position: "absolute",
        left: x - 18,
        top: y - 18,
        opacity: progress > 0 ? 1 : 0,
      }}
    >
      <circle cx={18} cy={18} r={r} fill="none" stroke={`${color}33`} strokeWidth={3} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Checkmark                                                          */
/* ------------------------------------------------------------------ */

const Checkmark: React.FC<{ visible: boolean }> = ({ visible }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!visible) return null;

  const scale = spring({
    frame,
    fps,
    config: SPRING.popIn,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: FOLDER_X - 10,
        top: STATION_Y - 42,
        transform: `scale(${scale})`,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <circle cx={10} cy={10} r={10} fill={COLOR.safe} />
        <path
          d="M6 10L9 13L14 7"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Single thumbnail traversal (Act 2)                                 */
/* ------------------------------------------------------------------ */

const SingleFlow: React.FC = () => {
  const frame = useCurrentFrame();

  // Spec timing (global -> local, Sequence from=40):
  // Frame 40-70  (local 0-30):  Travel to Station 1 + resize effect
  // Frame 70-100 (local 30-60): Travel to Station 2 + compress effect
  // Frame 100-130(local 60-90): Travel to Station 3 + watermark effect
  // Frame 130-155(local 90-115): Travel to folder + checkmark

  // Thumbnail X position: moves through each station to folder
  // Input/output arrays must be same length (12 entries each)
  const thumbX = interpolate(
    frame,
    [0, 18, 26, 30, 48, 56, 60, 78, 86, 90, 110, 115],
    [
      THUMB_START_X, // 0: start off-screen
      STATIONS[0].x, // 18: arrive at Resize
      STATIONS[0].x, // 26: pause for resize effect
      STATIONS[0].x, // 30: leave Resize
      STATIONS[1].x, // 48: arrive at Compress
      STATIONS[1].x, // 56: pause for compress effect
      STATIONS[1].x, // 60: leave Compress
      STATIONS[2].x, // 78: arrive at Watermark
      STATIONS[2].x, // 86: pause for watermark effect
      STATIONS[2].x, // 90: leave Watermark
      FOLDER_X, // 110: arrive at folder
      FOLDER_X, // 115: hold at folder
    ],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.smooth },
  );

  // Thumbnail size: shrinks at resize station (local 18-26)
  const thumbSize = interpolate(frame, [18, 26], [48, 36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Resize label morph
  const showResizeLabel = frame >= 16 && frame <= 34;
  const resizeLabelProgress = interpolate(frame, [18, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Compress ring progress (local 48-60)
  const compressRingProgress = interpolate(frame, [48, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Watermark stamp (local 78-86)
  const stampOpacity = interpolate(frame, [78, 84], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slide behind folder (local 105-115)
  const folderScale = interpolate(frame, [105, 115], [1, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const thumbOpacity = interpolate(frame, [108, 115], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Station glow states (6 frames each centered on arrival)
  const resizeGlow = frame >= 16 && frame < 30;
  const compressGlow = frame >= 46 && frame < 62;
  const watermarkGlow = frame >= 76 && frame < 90;

  // Checkmark appears at local frame 115
  const showCheck = frame >= 115;

  return (
    <>
      {/* Thumbnail */}
      <div
        style={{
          position: "absolute",
          left: thumbX - thumbSize / 2,
          top: STATION_Y - thumbSize / 2,
          opacity: thumbOpacity,
          transform: `scale(${folderScale})`,
          zIndex: frame >= 108 ? 0 : 5,
        }}
      >
        <Img
          src={staticFile("screenshots/sample-photo-landscape.jpg")}
          style={{
            width: thumbSize,
            height: thumbSize,
            objectFit: "cover",
            borderRadius: 6,
            border: "1.5px solid rgba(255,255,255,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        />
        {/* Watermark stamp */}
        {stampOpacity > 0 && (
          <span
            style={{
              position: "absolute",
              bottom: 2,
              right: 3,
              fontFamily: FONT.body,
              fontSize: 8,
              fontWeight: 700,
              color: `rgba(255,255,255,${stampOpacity})`,
              whiteSpace: "nowrap",
            }}
          >
            SnapOtter
          </span>
        )}
      </div>

      {/* Resize label */}
      {showResizeLabel && (
        <span
          style={{
            position: "absolute",
            left: STATIONS[0].x - 20,
            top: STATION_Y + 50,
            fontFamily: FONT.mono,
            fontSize: 11,
            color: STATIONS[0].color,
            opacity: interpolate(frame, [16, 18, 32, 34], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {resizeLabelProgress < 0.5 ? "1200px" : "800px"}
        </span>
      )}

      {/* Compress ring + file size */}
      <ProgressRing
        progress={compressRingProgress}
        color={STATIONS[1].color}
        x={STATIONS[1].x + 55}
        y={STATION_Y - 20}
      />
      {frame >= 46 && frame <= 68 && (
        <span
          style={{
            position: "absolute",
            left: STATIONS[1].x - 30,
            top: STATION_Y + 50,
            fontFamily: FONT.mono,
            fontSize: 11,
            color: STATIONS[1].color,
            opacity: interpolate(frame, [46, 48, 66, 68], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <Counter
            from={2400}
            to={180}
            startFrame={48}
            duration={12}
            format={(n) => (n >= 1000 ? `${(n / 1000).toFixed(1)} MB` : `${n} KB`)}
          />
        </span>
      )}

      {/* Station glows passed as props */}
      {STATIONS.map((s, i) => (
        <Station
          key={s.id}
          station={s}
          index={i}
          glowing={
            (i === 0 && resizeGlow) || (i === 1 && compressGlow) || (i === 2 && watermarkGlow)
          }
          pulseGlow={false}
        />
      ))}

      <Checkmark visible={showCheck} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Batch thumbnail (Act 3)                                            */
/* ------------------------------------------------------------------ */

const BatchThumb: React.FC<{
  index: number;
}> = ({ index }) => {
  const frame = useCurrentFrame();
  const staggerDelay = index * 3;
  const localFrame = frame - staggerDelay;

  if (localFrame < 0) return null;

  const size = 24 + random(`thumb-size-${index}`) * 8;
  const yOffset = (random(`thumb-y-${index}`) - 0.5) * 30;
  const objPosX = Math.round(random(`thumb-opx-${index}`) * 100);
  const objPosY = Math.round(random(`thumb-opy-${index}`) * 100);

  // Fast traversal: cover pipeline in ~28 frames per thumb
  const thumbX = interpolate(localFrame, [0, 28], [THUMB_START_X, FOLDER_X + 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  const opacity = interpolate(localFrame, [0, 3, 25, 28], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (localFrame > 32) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: thumbX - size / 2,
        top: STATION_Y - size / 2 + yOffset,
        opacity,
        zIndex: 4,
      }}
    >
      <Img
        src={staticFile("screenshots/sample-photo-landscape.jpg")}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          objectPosition: `${objPosX}% ${objPosY}%`,
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Batch stream wrapper with Trail                                    */
/* ------------------------------------------------------------------ */

const BatchStream: React.FC = () => {
  const frame = useCurrentFrame();
  const thumbs = Array.from({ length: BATCH_COUNT }, (_, i) => i);

  // How many have arrived at folder
  const arrivedCount = thumbs.filter((i) => {
    const localFrame = frame - i * 3;
    return localFrame >= 28;
  }).length;

  return (
    <>
      {/* Stations with continuous pulse glow during batch */}
      {STATIONS.map((s, i) => (
        <Station key={s.id} station={s} index={i} glowing={false} pulseGlow={frame >= 10} />
      ))}

      <Trail layers={4} lagInFrames={0.1} trailOpacity={0.5}>
        <AbsoluteFill>
          {thumbs.map((i) => (
            <BatchThumb key={i} index={i} />
          ))}
        </AbsoluteFill>
      </Trail>

      {/* Batch counter above folder */}
      {arrivedCount > 0 && (
        <div
          style={{
            position: "absolute",
            left: FOLDER_X - 30,
            top: STATION_Y - 75,
            width: 60,
            textAlign: "center",
          }}
        >
          <Counter
            from={0}
            to={arrivedCount}
            startFrame={0}
            duration={1}
            style={{
              fontFamily: FONT.heading,
              fontWeight: 800,
              fontSize: 28,
              color: COLOR.accent,
            }}
          />
        </div>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Main composition                                                   */
/* ------------------------------------------------------------------ */

export const PipelineFlow: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark, overflow: "hidden" }}>
      {/* Act 1: Stations Appear (frame 0-40) */}
      <Sequence from={0} durationInFrames={390}>
        {/* Connector lines (drawn during Act 1) */}
        <ConnectorLine fromX={STATIONS[0].x} toX={STATIONS[1].x} delay={12} />
        <ConnectorLine fromX={STATIONS[1].x} toX={STATIONS[2].x} delay={20} />
        <ConnectorLine fromX={STATIONS[2].x} toX={FOLDER_X} delay={28} />

        {/* Folder (appears last in Act 1) */}
        <FolderIcon pulse={frame >= 340 && frame < 380} />
      </Sequence>

      {/* Act 1 stations (visible throughout until Act 2 takes over) */}
      {frame < 40 &&
        STATIONS.map((s, i) => (
          <Station key={s.id} station={s} index={i} glowing={false} pulseGlow={false} />
        ))}

      {/* Act 2: Single Image Flow (frame 40-170) */}
      <Sequence from={40} durationInFrames={130}>
        <SingleFlow />
      </Sequence>

      {/* "Chain any tools." text (frame 155-350) */}
      {frame >= 155 && frame < 350 && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame, [155, 170, 340, 350], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <ClipReveal startFrame={155}>
            <span style={{ ...TEXT.body, color: "white" }}>Chain any tools.</span>
          </ClipReveal>
        </div>
      )}

      {/* Act 3: Batch Mode (frame 170-340) */}
      <Sequence from={180} durationInFrames={160}>
        <BatchStream />
      </Sequence>

      {/* Act 3 stations when not covered by SingleFlow or BatchStream */}
      {frame >= 170 &&
        frame < 180 &&
        STATIONS.map((s, i) => (
          <Station key={s.id} station={s} index={i} glowing={false} pulseGlow={false} />
        ))}

      {/* Act 4: Result (frame 340-390) */}
      {frame >= 340 && (
        <>
          {STATIONS.map((s, i) => (
            <Station key={s.id} station={s} index={i} glowing={false} pulseGlow={false} />
          ))}

          {/* Final counter at 50 */}
          <div
            style={{
              position: "absolute",
              left: FOLDER_X - 30,
              top: STATION_Y - 75,
              width: 60,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: FONT.heading,
                fontWeight: 800,
                fontSize: 28,
                color: COLOR.accent,
              }}
            >
              50
            </span>
          </div>
        </>
      )}

      {/* "Batch everything." text (frame 360-390) */}
      <Sequence from={360} durationInFrames={30}>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            width: "100%",
            textAlign: "center",
          }}
        >
          <ClipReveal startFrame={0}>
            <span style={{ ...TEXT.sectionTitle }}>Batch everything.</span>
          </ClipReveal>
        </div>
      </Sequence>

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
