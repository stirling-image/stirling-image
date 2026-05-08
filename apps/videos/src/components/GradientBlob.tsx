import type React from "react";
import { useCurrentFrame } from "remotion";

interface BlobConfig {
  color: string;
  radius: number;
  cx: number;
  cy: number;
  a: number;
  b: number;
  phaseX: number;
  phaseY: number;
  amplitudeX: number;
  amplitudeY: number;
}

export const GradientBlob: React.FC<{
  config: BlobConfig;
  duration: number;
}> = ({ config, duration }) => {
  const frame = useCurrentFrame();
  const t = (frame / duration) * Math.PI * 2;
  const x = config.cx + config.amplitudeX * Math.sin(config.a * t + config.phaseX);
  const y = config.cy + config.amplitudeY * Math.sin(config.b * t + config.phaseY);

  return (
    <div
      style={{
        position: "absolute",
        width: config.radius * 2,
        height: config.radius * 2,
        left: x - config.radius,
        top: y - config.radius,
        background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
        filter: "blur(60px)",
        opacity: 0.5,
        mixBlendMode: "screen",
      }}
    />
  );
};
