import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GrainOverlay } from "@/components/GrainOverlay";
import { COLOR } from "@/lib/colors";
import { FONT } from "@/lib/fonts";

const RINGS = [
  {
    formats: ["CR2", "NEF", "ARW", "RAF", "DNG"],
    radius: 120,
    color: "#f59e0b",
    direction: 1,
  },
  {
    formats: ["AVIF", "JXL", "HEIC", "WebP", "QOI"],
    radius: 195,
    color: "#14b8a6",
    direction: -1,
  },
  {
    formats: ["JPEG", "PNG", "TIFF", "BMP", "GIF", "PSD"],
    radius: 270,
    color: "#3b82f6",
    direction: 1,
  },
];

const DURATION = 180;
const SPEED = (2 * Math.PI) / DURATION;

const Badge: React.FC<{
  label: string;
  color: string;
  angle: number;
  radius: number;
}> = ({ label, color, angle, radius }) => {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.55;
  const z = Math.sin(angle);
  const scale = interpolate(z, [-1, 1], [0.75, 1.0]);
  const opacity = interpolate(z, [-1, 1], [0.4, 1.0]);
  const zIndex = Math.round(interpolate(z, [-1, 1], [0, 10]));

  return (
    <div
      style={{
        position: "absolute",
        left: 400 + x,
        top: 280 + y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        zIndex,
        padding: "6px 14px",
        borderRadius: 8,
        backgroundColor: `${color}26`,
        border: `1px solid ${color}66`,
        boxShadow: `0 0 12px ${color}33`,
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: 14,
        color,
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </div>
  );
};

/** Trail badge - renders a badge at a past frame's position with reduced opacity */
const TrailBadge: React.FC<{
  label: string;
  color: string;
  angle: number;
  radius: number;
  trailOpacity: number;
}> = ({ label, color, angle, radius, trailOpacity }) => {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.55;
  const z = Math.sin(angle);
  const scale = interpolate(z, [-1, 1], [0.75, 1.0]);
  const zIndex = Math.round(interpolate(z, [-1, 1], [0, 10]));

  return (
    <div
      style={{
        position: "absolute",
        left: 400 + x,
        top: 280 + y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: trailOpacity,
        zIndex,
        padding: "6px 14px",
        borderRadius: 8,
        backgroundColor: `${color}26`,
        border: `1px solid ${color}44`,
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: 14,
        color,
        whiteSpace: "nowrap" as const,
        pointerEvents: "none" as const,
      }}
    >
      {label}
    </div>
  );
};

export const FormatUniverse: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = Math.sin(frame * 0.06) * 0.05 + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark, overflow: "hidden" }}>
      {/* Orbit ring lines (faint elliptical paths behind each ring) */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        width={800}
        height={600}
        role="img"
        aria-label="Orbit rings"
      >
        {RINGS.map((ring) => (
          <ellipse
            key={`orbit-${ring.radius}`}
            cx={400}
            cy={280}
            rx={ring.radius}
            ry={ring.radius * 0.55}
            fill="none"
            stroke={ring.color}
            strokeWidth={0.5}
            opacity={0.05}
          />
        ))}
      </svg>

      {/* Opacity trail: render each badge at frame-1 and frame-2 positions */}
      {RINGS.map((ring) =>
        ring.formats.map((fmt, fi) => {
          const angleOffset = (fi / ring.formats.length) * Math.PI * 2;
          const trail1Angle = angleOffset + (frame - 1) * SPEED * ring.direction;
          const trail2Angle = angleOffset + (frame - 2) * SPEED * ring.direction;
          return [
            <TrailBadge
              key={`trail2-${ring.radius}-${fmt}`}
              label={fmt}
              color={ring.color}
              angle={trail2Angle}
              radius={ring.radius}
              trailOpacity={0.1}
            />,
            <TrailBadge
              key={`trail1-${ring.radius}-${fmt}`}
              label={fmt}
              color={ring.color}
              angle={trail1Angle}
              radius={ring.radius}
              trailOpacity={0.3}
            />,
          ];
        }),
      )}

      {/* Main badges at current frame */}
      {RINGS.map((ring) =>
        ring.formats.map((fmt, fi) => {
          const angleOffset = (fi / ring.formats.length) * Math.PI * 2;
          const angle = angleOffset + frame * SPEED * ring.direction;
          return (
            <Badge
              key={`badge-${ring.radius}-${fmt}`}
              label={fmt}
              color={ring.color}
              angle={angle}
              radius={ring.radius}
            />
          );
        }),
      )}

      <Img
        src={staticFile("logo.png")}
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          left: 400 - 40,
          top: 280 - 40,
          transform: `scale(${logoScale})`,
          zIndex: 11,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 40,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: 18,
          color: "rgba(255, 255, 255, 0.7)",
          zIndex: 12,
        }}
      >
        55+ formats. Every camera. Every device.
      </div>

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
