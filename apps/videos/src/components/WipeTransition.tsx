import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "@/lib/motion";

export const WipeTransition: React.FC<{
  children: React.ReactNode;
  startFrame: number;
  duration?: number;
  direction?: "left" | "right";
}> = ({ children, startFrame, duration = 18, direction = "left" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });
  const clipPath =
    direction === "left" ? `inset(0 ${100 - progress}% 0 0)` : `inset(0 0 0 ${100 - progress}%)`;

  return <AbsoluteFill style={{ clipPath }}>{children}</AbsoluteFill>;
};
