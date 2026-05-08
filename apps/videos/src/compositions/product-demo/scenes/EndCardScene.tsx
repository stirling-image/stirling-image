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
import { COLOR } from "@/lib/colors";
import { FONT, TEXT } from "@/lib/fonts";
import { SPRING } from "@/lib/motion";

export const EndCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: SPRING.natural });
  const fadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        opacity: fadeOut,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 80,
          height: 80,
          opacity: logoSpring,
          transform: `scale(${0.8 + logoSpring * 0.2})`,
        }}
      />

      <div style={{ height: 16 }} />

      <ClipReveal startFrame={10}>
        <span style={{ ...TEXT.sectionTitle, fontSize: 36, color: "#0a0a0a" }}>
          Self-hosted image processing.
        </span>
      </ClipReveal>

      <div style={{ height: 12 }} />

      <ClipReveal startFrame={25}>
        <span style={{ fontFamily: FONT.body, fontSize: 18, color: COLOR.accent }}>
          snapotter.com
        </span>
      </ClipReveal>
    </AbsoluteFill>
  );
};
