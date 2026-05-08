import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ClipReveal } from "@/components/ClipReveal";
import { COLOR } from "@/lib/colors";
import { TEXT } from "@/lib/fonts";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const glowOpacity = Math.sin(frame * 0.08) * 0.03 + 0.08;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${COLOR.accent} 0%, transparent 70%)`,
          opacity: glowOpacity,
          filter: "blur(60px)",
        }}
      />

      <div style={{ textAlign: "center" }}>
        <ClipReveal startFrame={10} duration={20}>
          <span style={{ ...TEXT.heroHeadline }}>Your images.</span>
        </ClipReveal>
        <div style={{ height: 12 }} />
        <ClipReveal startFrame={40} duration={20}>
          <span style={{ ...TEXT.heroHeadline }}>Stay yours.</span>
        </ClipReveal>
      </div>
    </AbsoluteFill>
  );
};
