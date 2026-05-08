import { evolvePath } from "@remotion/paths";
import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "@/lib/motion";

const SHIELD_PATH = "M50 5 L90 25 L90 55 C90 80 70 95 50 100 C30 95 10 80 10 55 L10 25 Z";

export const ShieldIcon: React.FC<{
  size: number;
  startFrame: number;
  duration?: number;
  fillOpacity?: number;
  style?: React.CSSProperties;
}> = ({ size, startFrame, duration = 35, fillOpacity = 0, style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });

  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, SHIELD_PATH);

  return (
    <svg
      viewBox="0 0 100 105"
      width={size}
      height={size * 1.05}
      style={style}
      role="img"
      aria-label="Shield"
    >
      <path
        d={SHIELD_PATH}
        stroke="white"
        strokeWidth={4}
        fill="none"
        opacity={0.3}
        filter="blur(4px)"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />

      <defs>
        <linearGradient id="shield-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>
      <path
        d={SHIELD_PATH}
        stroke="white"
        strokeWidth={3.5}
        fill={fillOpacity > 0 ? "url(#shield-fill-grad)" : "none"}
        fillOpacity={fillOpacity > 0 ? fillOpacity * 12 : 0}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
