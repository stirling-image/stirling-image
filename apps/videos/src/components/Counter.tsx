import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "@/lib/motion";

export const Counter: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  duration: number;
  style?: React.CSSProperties;
  format?: (n: number) => string;
}> = ({ from, to, startFrame, duration, style, format }) => {
  const frame = useCurrentFrame();
  const raw = interpolate(frame, [startFrame, startFrame + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });
  const value = Math.floor(raw);
  return <span style={style}>{format ? format(value) : String(value)}</span>;
};
