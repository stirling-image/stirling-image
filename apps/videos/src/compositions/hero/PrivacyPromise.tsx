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
import { ClipReveal } from "@/components/ClipReveal";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ShieldIcon } from "@/components/ShieldIcon";
import { TEXT } from "@/lib/fonts";
import { EASE, SPRING } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/*  Photo config                                                       */
/* ------------------------------------------------------------------ */

const PHOTOS = [
  {
    src: "screenshots/sample-photo-portrait.jpg",
    w: 180,
    h: 135,
    fromX: -300,
    fromY: -250,
    delay: 0,
  },
  {
    src: "screenshots/sample-photo-landscape.jpg",
    w: 160,
    h: 120,
    fromX: 320,
    fromY: 280,
    delay: 4,
  },
  { src: "screenshots/sample-photo-bw.jpg", w: 150, h: 115, fromX: 280, fromY: -260, delay: 8 },
] as const;

/* ------------------------------------------------------------------ */
/*  Padlock SVG (simple circle + rect)                                 */
/* ------------------------------------------------------------------ */

const PadlockIcon: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg
    width={36}
    height={36}
    viewBox="0 0 24 24"
    style={{ opacity }}
    role="img"
    aria-label="Padlock"
  >
    <rect x={5} y={11} width={14} height={11} rx={2} fill="rgba(255,255,255,0.6)" />
    <path
      d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Main composition                                                   */
/* ------------------------------------------------------------------ */

export const PrivacyPromise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;

  /* ---- Act 3: shield + photos scale & move up ---- */
  const act3Scale = interpolate(frame, [160, 180], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.snap,
  });
  const act3OffsetY = interpolate(frame, [160, 180], [0, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.snap,
  });

  /* ---- Act 4: fade out ---- */
  const act4ShieldOpacity = interpolate(frame, [240, 270], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  /* ---- Shield fill (Act 2) ---- */
  const shieldFillOpacity = interpolate(frame, [110, 130], [0, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ---- Shield pulse glow (Act 2, frame 130-160) ---- */
  const pulseScale = frame >= 130 && frame <= 240 ? 1 + Math.sin((frame - 130) * 0.314) * 0.02 : 1;

  /* ---- Padlock fade in (Act 2) ---- */
  const padlockOpacity = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ---- Act 4 scale-down for shield ---- */
  const act4ShieldScale = interpolate(frame, [240, 270], [1, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  /* ---- Text fade out (Act 4) ---- */
  const act4TextOpacity = interpolate(frame, [240, 265], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.exit,
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.15) 0%, #0c0a09 70%)`,
        overflow: "hidden",
      }}
    >
      {/* ---- Shield + Photos group (scales together in Act 3) ---- */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) translateY(${act3OffsetY}px) scale(${act3Scale * act4ShieldScale * pulseScale})`,
          opacity: act4ShieldOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Shield icon */}
        <ShieldIcon size={200} startFrame={75} duration={35} fillOpacity={shieldFillOpacity} />

        {/* Padlock at shield base */}
        <div style={{ marginTop: -30 }}>
          <PadlockIcon opacity={padlockOpacity * act4ShieldOpacity} />
        </div>

        {/* Photos floating around the shield */}
        {PHOTOS.map((photo, i) => {
          const entrySpring = spring({
            frame: frame - 15 - photo.delay,
            fps,
            config: SPRING.natural,
          });

          /* Act 1: drift from edges toward center */
          const driftProgress = interpolate(frame, [25, 75], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.smooth,
          });

          /* Act 2: settle inside shield */
          const settleSpring = spring({
            frame: frame - 110,
            fps,
            config: SPRING.settle,
          });

          /* Settled positions: clustered near center */
          const settledX = (i - 1) * 40;
          const settledY = (i - 1) * 25;

          /* Current position blends drift -> settled */
          const preSettleX = photo.fromX * (1 - driftProgress);
          const preSettleY = photo.fromY * (1 - driftProgress);
          const photoX =
            frame < 110 ? preSettleX : preSettleX + (settledX - preSettleX) * settleSpring;
          const photoY =
            frame < 110 ? preSettleY : preSettleY + (settledY - preSettleY) * settleSpring;

          /* Rotation: organic drift then settle */
          const driftRotation = (i % 2 === 0 ? 3 : -3) * (1 - driftProgress);
          const settledRotation = (i - 1) * 2;
          const rotation =
            frame < 110
              ? driftRotation
              : driftRotation + (settledRotation - driftRotation) * settleSpring;

          /* Act 4: photos drift back out (reverse of arrival) */
          const exitProgress = interpolate(frame, [270, 295], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.exit,
          });
          const exitX = photoX + photo.fromX * exitProgress;
          const exitY = photoY + photo.fromY * exitProgress;
          const exitOpacity = interpolate(frame, [270, 295], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE.exit,
          });

          /* Entry opacity (photos appear from frame 15) */
          const entryOpacity = interpolate(frame, [15 + photo.delay, 20 + photo.delay], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <Img
              key={photo.src}
              src={staticFile(photo.src)}
              style={{
                position: "absolute",
                width: photo.w,
                height: photo.h,
                objectFit: "cover",
                borderRadius: 8,
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                left: `calc(50% + ${exitX}px - ${photo.w / 2}px)`,
                top: `calc(50% + ${exitY}px - ${photo.h / 2}px)`,
                transform: `scale(${entrySpring}) rotate(${rotation}deg)`,
                opacity: entryOpacity * exitOpacity,
                zIndex: i,
              }}
            />
          );
        })}
      </div>

      {/* ---- "Your images." text (Act 2) ---- */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy + 130 * act3Scale + act3OffsetY,
          transform: "translateX(-50%)",
          opacity: act4TextOpacity,
          textAlign: "center",
        }}
      >
        <ClipReveal startFrame={95}>
          <span style={{ ...TEXT.heroHeadline }}>Your images.</span>
        </ClipReveal>
      </div>

      {/* ---- "Stay yours." text (Act 2) ---- */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy + 200 * act3Scale + act3OffsetY,
          transform: "translateX(-50%)",
          opacity: act4TextOpacity,
          textAlign: "center",
        }}
      >
        <ClipReveal startFrame={130}>
          <span style={{ ...TEXT.heroHeadline }}>Stay yours.</span>
        </ClipReveal>
      </div>

      {/* ---- Subtext lines (Act 3) ---- */}
      {frame >= 160 && (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy + 160,
            transform: "translateX(-50%)",
            opacity: act4TextOpacity,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <ClipReveal startFrame={180}>
            <span style={{ ...TEXT.heroSub, opacity: 0.8 }}>No uploads to the cloud. Ever.</span>
          </ClipReveal>
          <ClipReveal startFrame={184}>
            <span style={{ ...TEXT.heroSub, opacity: 0.8 }}>100% local processing.</span>
          </ClipReveal>
          <ClipReveal startFrame={188}>
            <span style={{ ...TEXT.heroSub, opacity: 0.8 }}>Free. Forever.</span>
          </ClipReveal>
        </div>
      )}

      <GrainOverlay />
    </AbsoluteFill>
  );
};
