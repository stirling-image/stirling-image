import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "@/lib/motion";

export const ClipReveal: React.FC<{
  children: React.ReactNode;
  startFrame: number;
  duration?: number;
  direction?: "up" | "down";
}> = ({ children, startFrame, duration = 15, direction = "up" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.enter,
  });
  const translateY =
    direction === "up"
      ? interpolate(progress, [0, 1], [40, 0])
      : interpolate(progress, [0, 1], [-40, 0]);

  return (
    <div style={{ overflow: "hidden", display: "inline-block" }}>
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          opacity: interpolate(progress, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        {children}
      </div>
    </div>
  );
};
