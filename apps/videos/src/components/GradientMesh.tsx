import type React from "react";
import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GradientBlob } from "@/components/GradientBlob";

interface BlobDef {
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

export const GradientMesh: React.FC<{
  blobs: BlobDef[];
  duration: number;
  baseOpacity?: number;
  opacityRange?: [number, number];
  opacityFrameRange?: [number, number];
  style?: CSSProperties;
}> = ({ blobs, duration, baseOpacity, opacityRange, opacityFrameRange, style }) => {
  const frame = useCurrentFrame();
  let containerOpacity = baseOpacity ?? 1;

  if (opacityRange && opacityFrameRange) {
    containerOpacity = interpolate(frame, opacityFrameRange, opacityRange, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill style={{ opacity: containerOpacity, ...style }}>
      {blobs.map((blob, i) => (
        <GradientBlob key={`mesh-blob-${i}`} config={blob} duration={duration} />
      ))}
    </AbsoluteFill>
  );
};
