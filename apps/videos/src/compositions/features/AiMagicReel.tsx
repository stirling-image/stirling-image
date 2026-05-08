import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  interpolateColors,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { GrainOverlay } from "@/components/GrainOverlay";
import { WipeTransition } from "@/components/WipeTransition";
import { COLOR } from "@/lib/colors";
import { TEXT } from "@/lib/fonts";
import { EASE, SPRING, TIMING } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const CHECKERBOARD_BG = "repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 0 0 / 16px 16px";

/** A tiny sparkle that scales 0 -> 1.2 -> 0 and fades over 4 frames */
const Sparkle: React.FC<{
  x: number;
  y: number;
  startFrame: number;
  color?: string;
  size?: number;
}> = ({ x, y, startFrame, color = COLOR.accent, size = 6 }) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 4) return null;
  const scale = interpolate(local, [0, 2, 4], [0, 1.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(local, [0, 1, 4], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

/** Checkmark icon that pops in with a spring */
const Checkmark: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING.popIn,
  });
  if (frame < startFrame) return null;
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: COLOR.safe,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3 8.5L6.5 12L13 4"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Segment A -- Background Removal (frame 0-120)                      */
/* ------------------------------------------------------------------ */

const SegmentBackgroundRemoval: React.FC = () => {
  const frame = useCurrentFrame();
  const photoW = 280;
  const photoH = 360;
  const photoX = (800 - photoW) / 2;
  const photoY = (600 - photoH) / 2 + 20;

  // Scan line position (x within the photo)
  const scanX = interpolate(frame, [15, 80], [0, photoW], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Right clip for the "after" layer
  const rightClipPct = interpolate(frame, [15, 80], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Subject float-forward after scan completes
  const subjectScale = interpolate(frame, [80, 110], [1.0, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const subjectY = interpolate(frame, [80, 110], [0, -5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Checkerboard background for transparency effect
  const checkerBg = CHECKERBOARD_BG;

  // Scan line particle trail
  const particles = Array.from({ length: 5 }, (_, i) => {
    const py = random(`scan-particle-y-${i}`) * photoH;
    const drift = interpolate(frame, [15, 80], [0, -20], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const particleOpacity = interpolate(frame, [15, 80], [0.8, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      x: scanX - 4 + random(`scan-particle-x-${i}`) * 8,
      y: py + drift * random(`scan-drift-${i}`),
      opacity: particleOpacity * random(`scan-particle-o-${i}`),
    };
  });

  return (
    <AbsoluteFill style={{ background: COLOR.dark }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 30, left: 40 }}>
        <ClipReveal startFrame={10}>
          <span style={{ ...TEXT.label, color: COLOR.category.ai }}>Background Removal</span>
        </ClipReveal>
      </div>

      {/* Photo container */}
      <div
        style={{
          position: "absolute",
          left: photoX,
          top: photoY,
          width: photoW,
          height: photoH,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* "Before" layer: real portrait photo */}
        <Img
          src={staticFile("screenshots/sample-photo-portrait.jpg")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* "After" layer: checkerboard + portrait (revealed via clip) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${rightClipPct}% 0 0)`,
            transform: `scale(${subjectScale}) translateY(${subjectY}px)`,
          }}
        >
          {/* Checkerboard background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: checkerBg,
            }}
          />
          {/* Subject portrait on top of checkerboard */}
          <Img
            src={staticFile("screenshots/sample-photo-portrait.jpg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Scan line */}
        {frame >= 15 && frame <= 82 && (
          <div
            style={{
              position: "absolute",
              left: scanX - 1,
              top: 0,
              width: 2,
              height: "100%",
              background: COLOR.accent,
              boxShadow: "0 0 20px 10px rgba(245,158,11,0.3)",
              zIndex: 10,
            }}
          />
        )}

        {/* Scan line particle trail */}
        {frame >= 15 &&
          frame <= 80 &&
          particles.map((p, i) => (
            <div
              key={`scan-p-${i}`}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: COLOR.accent,
                opacity: p.opacity,
                zIndex: 11,
                pointerEvents: "none",
              }}
            />
          ))}
      </div>

      {/* Checkmark after completion */}
      <div
        style={{
          position: "absolute",
          left: photoX + photoW - 10,
          top: photoY + photoH - 10,
        }}
      >
        <Checkmark startFrame={85} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Segment B -- AI Colorization (frame 120-240)                       */
/* ------------------------------------------------------------------ */

const SegmentColorization: React.FC = () => {
  const frame = useCurrentFrame();
  const photoW = 360;
  const photoH = 240;
  const photoX = (800 - photoW) / 2;
  const photoY = (600 - photoH) / 2 + 20;

  // Color wave sweep
  const waveProgress = interpolate(frame, [25, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Hold pulse
  const holdScale = interpolate(frame, [90, 100, 110, 120], [1.0, 1.01, 1.0, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Color particles along the wavefront
  const colorParticles = Array.from({ length: 8 }, (_, i) => {
    const py = random(`color-particle-y-${i}`) * photoH;
    const px = (waveProgress / 100) * photoW;
    const hue = random(`color-particle-hue-${i}`) * 360;
    const lifeStart = 25 + Math.floor(random(`color-particle-start-${i}`) * 60);
    const localFrame = frame - lifeStart;
    const visible = localFrame >= 0 && localFrame <= 5;
    const particleOpacity = visible
      ? interpolate(localFrame, [0, 2, 5], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
    return {
      x: px + (random(`color-particle-ox-${i}`) - 0.5) * 20,
      y: py,
      hue,
      opacity: particleOpacity,
      visible,
    };
  });

  return (
    <AbsoluteFill style={{ background: COLOR.dark }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 30, left: 40 }}>
        <ClipReveal startFrame={15}>
          <span style={{ ...TEXT.label, color: COLOR.category.ai }}>AI Colorization</span>
        </ClipReveal>
      </div>

      {/* Photo container */}
      <div
        style={{
          position: "absolute",
          left: photoX,
          top: photoY,
          width: photoW,
          height: photoH,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          transform: `scale(${holdScale})`,
        }}
      >
        {/* B&W layer (on top, real B&W photo) */}
        <Img
          src={staticFile("screenshots/sample-photo-bw.jpg")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Color layer (revealed via clip, using portrait as color version) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${100 - waveProgress}% 0 0)`,
          }}
        >
          <Img
            src={staticFile("screenshots/sample-photo-portrait.jpg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.2)",
            }}
          />
        </div>

        {/* Color particles */}
        {colorParticles.map(
          (p, i) =>
            p.visible && (
              <div
                key={`color-p-${i}`}
                style={{
                  position: "absolute",
                  left: p.x - 3,
                  top: p.y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: `hsl(${p.hue}, 80%, 65%)`,
                  opacity: p.opacity,
                  pointerEvents: "none",
                }}
              />
            ),
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Segment C -- 4x Super Resolution (frame 240-360)                   */
/* ------------------------------------------------------------------ */

const PIXEL_GRID_SIZE = 8;
const PIXEL_GAP = 0.5;

/** Generate deterministic colors for the pixel grid (blues and greens from landscape) */
const pixelColors: string[] = Array.from({ length: PIXEL_GRID_SIZE * PIXEL_GRID_SIZE }, (_, i) => {
  const hue = random(`pixel-hue-${i}`) * 80 + 180; // blues and greens (180-260)
  const sat = 35 + random(`pixel-sat-${i}`) * 35;
  const lit = 35 + random(`pixel-lit-${i}`) * 30;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
});

const SegmentSuperResolution: React.FC = () => {
  const frame = useCurrentFrame();

  const tinySize = 60;
  const largeSize = 240;

  // Zoom in: frame 25-60 (local)
  const zoomIn = interpolate(frame, [25, 60], [1, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Pixel dissolve: frame 60-90 (local)
  const borderRadiusPct = interpolate(frame, [60, 80], [0, 50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const pixelBlur = interpolate(frame, [60, 75, 90], [0, 3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gapSize = interpolate(frame, [60, 90], [PIXEL_GAP, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Zoom out: frame 90-110 (local)
  const zoomOut = interpolate(frame, [90, 110], [6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Combined zoom
  const zoom = frame < 90 ? zoomIn : zoomOut;

  // Image size transition: tiny -> large after zoom out
  const imgSize = interpolate(frame, [90, 110], [tinySize, largeSize], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Determine if we should show the smooth version
  const showSmooth = frame > 85;
  const smoothOpacity = interpolate(frame, [85, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLOR.dark }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 30, left: 40 }}>
        <ClipReveal startFrame={15}>
          <span style={{ ...TEXT.label, color: COLOR.category.ai }}>4x Super Resolution</span>
        </ClipReveal>
      </div>

      {/* Pixel grid container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${zoom})`,
          width: frame >= 90 ? imgSize : tinySize,
          height: frame >= 90 ? imgSize : tinySize,
        }}
      >
        {/* Pixelated grid */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${PIXEL_GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${PIXEL_GRID_SIZE}, 1fr)`,
            gap: gapSize,
            filter: `blur(${pixelBlur}px)`,
            opacity: showSmooth ? 1 - smoothOpacity : 1,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {pixelColors.map((color, i) => (
            <div
              key={`px-${i}`}
              style={{
                background: color,
                borderRadius: `${borderRadiusPct}%`,
              }}
            />
          ))}
        </div>

        {/* Smooth "resolved" version - actual landscape photo */}
        {showSmooth && (
          <Img
            src={staticFile("screenshots/sample-photo-landscape.jpg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
              opacity: smoothOpacity,
              border: "1.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          />
        )}
      </div>

      {/* Size label */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {frame >= 90 && (
          <>
            <ClipReveal startFrame={92} duration={10}>
              <span
                style={{
                  ...TEXT.label,
                  fontSize: 14,
                  color: COLOR.muted,
                  textDecoration: "line-through",
                }}
              >
                60x60
              </span>
            </ClipReveal>
            <ClipReveal startFrame={96} duration={10}>
              <span style={{ ...TEXT.label, fontSize: 14, color: "white" }}>240x240</span>
            </ClipReveal>
          </>
        )}
      </div>

      {/* Checkmark */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Checkmark startFrame={108} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Segment D -- Photo Restoration (frame 360-480)                     */
/* ------------------------------------------------------------------ */

/** Generate deterministic scratch lines */
const SCRATCH_COUNT = 7;
const scratches = Array.from({ length: SCRATCH_COUNT }, (_, i) => ({
  x1: random(`scratch-x1-${i}`) * 300,
  y1: random(`scratch-y1-${i}`) * 300,
  x2: random(`scratch-x2-${i}`) * 300,
  y2: random(`scratch-y2-${i}`) * 300,
  width: 1 + random(`scratch-w-${i}`) * 1.5,
}));

const DUST_COUNT = 4;
const dustSpots = Array.from({ length: DUST_COUNT }, (_, i) => ({
  cx: random(`dust-cx-${i}`) * 260 + 20,
  cy: random(`dust-cy-${i}`) * 260 + 20,
  r: 3 + random(`dust-r-${i}`) * 6,
}));

/** Deterministic order for scratch/dust removal */
const damageOrder = Array.from({ length: SCRATCH_COUNT + DUST_COUNT }, (_, i) => i).sort(
  (a, b) => random(`damage-order-${a}`) - random(`damage-order-${b}`),
);

const SegmentRestoration: React.FC = () => {
  const frame = useCurrentFrame();
  const photoSize = 300;
  const photoX = (800 - photoSize) / 2;
  const photoY = (600 - photoSize) / 2 - 20;

  // Stagger: each damage element heals over the 390-440 range (local 30-80)
  const stagger = TIMING.staggerFrames * 4; // 8 frames between each

  // Sepia lift: frame 80-95 (local)
  const sepiaAmount = interpolate(frame, [80, 95], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });
  const contrastAmount = interpolate(frame, [80, 95], [0.9, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.smooth,
  });

  // Color shift from sepia to warm
  const _bgFrom = interpolateColors(frame, [80, 95], ["hsl(35, 40%, 45%)", "hsl(30, 55%, 50%)"]);
  const _bgTo = interpolateColors(frame, [80, 95], ["hsl(40, 35%, 55%)", "hsl(45, 50%, 58%)"]);

  return (
    <AbsoluteFill style={{ background: COLOR.dark }}>
      {/* Label */}
      <div style={{ position: "absolute", top: 30, left: 40 }}>
        <ClipReveal startFrame={25}>
          <span style={{ ...TEXT.label, color: COLOR.category.ai }}>Photo Restoration</span>
        </ClipReveal>
      </div>

      {/* Photo with damage */}
      <div
        style={{
          position: "absolute",
          left: photoX,
          top: photoY,
          width: photoSize,
          height: photoSize,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          filter: `sepia(${sepiaAmount * 0.8}) contrast(${contrastAmount})`,
        }}
      >
        {/* Base photo - real landscape */}
        <Img
          src={staticFile("screenshots/sample-photo-landscape.jpg")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* SVG damage overlay */}
        <svg
          width={photoSize}
          height={photoSize}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
        >
          {/* Scratch lines */}
          {scratches.map((s, i) => {
            const orderIdx = damageOrder.indexOf(i);
            const healStart = 30 + orderIdx * stagger;
            const opacity = interpolate(frame, [healStart, healStart + 6], [0.7, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <line
                key={`scratch-${i}`}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="rgba(255,250,240,0.8)"
                strokeWidth={s.width}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}

          {/* Dust spots */}
          {dustSpots.map((d, i) => {
            const orderIdx = damageOrder.indexOf(SCRATCH_COUNT + i);
            const healStart = 30 + orderIdx * stagger;
            const opacity = interpolate(frame, [healStart, healStart + 6], [0.4, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <circle
                key={`dust-${i}`}
                cx={d.cx}
                cy={d.cy}
                r={d.r}
                fill="rgba(255,250,240,0.5)"
                opacity={opacity}
              />
            );
          })}
        </svg>

        {/* Sparkles at healed damage locations */}
        {damageOrder.map((dmgIdx, orderIdx) => {
          const healStart = 30 + orderIdx * stagger;
          const isDust = dmgIdx >= SCRATCH_COUNT;
          const sparkleX = isDust
            ? dustSpots[dmgIdx - SCRATCH_COUNT].cx
            : (scratches[dmgIdx].x1 + scratches[dmgIdx].x2) / 2;
          const sparkleY = isDust
            ? dustSpots[dmgIdx - SCRATCH_COUNT].cy
            : (scratches[dmgIdx].y1 + scratches[dmgIdx].y2) / 2;
          return (
            <Sparkle
              key={`heal-sparkle-${dmgIdx}`}
              x={sparkleX}
              y={sparkleY}
              startFrame={healStart}
              size={8}
            />
          );
        })}
      </div>

      {/* Final text */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <ClipReveal startFrame={95}>
          <span style={{ ...TEXT.sectionTitle, fontSize: 36 }}>15 AI models. Your hardware.</span>
        </ClipReveal>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Composition                                                   */
/* ------------------------------------------------------------------ */

export const AiMagicReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLOR.dark }}>
      {/* Segment A: Background Removal (frame 0-120) */}
      <Sequence from={0} durationInFrames={120}>
        <SegmentBackgroundRemoval />
      </Sequence>

      {/* Segment B: AI Colorization (frame 120-240) */}
      <Sequence from={120} durationInFrames={120}>
        <WipeTransition startFrame={0} duration={15} direction="right">
          <SegmentColorization />
        </WipeTransition>
      </Sequence>

      {/* Segment C: 4x Super Resolution (frame 240-360) */}
      <Sequence from={240} durationInFrames={120}>
        <WipeTransition startFrame={0} duration={15} direction="right">
          <SegmentSuperResolution />
        </WipeTransition>
      </Sequence>

      {/* Segment D: Photo Restoration (frame 360-480) */}
      <Sequence from={360} durationInFrames={120}>
        <WipeTransition startFrame={0} duration={15} direction="right">
          <SegmentRestoration />
        </WipeTransition>
      </Sequence>

      {/* Film grain */}
      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
