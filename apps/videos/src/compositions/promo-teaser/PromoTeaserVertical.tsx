import type React from "react";
import { AbsoluteFill, Series } from "remotion";
import { GradientBlob } from "@/components/GradientBlob";
import { GrainOverlay } from "@/components/GrainOverlay";
import { COLOR } from "@/lib/colors";
import { AmbientOpenScene } from "./scenes/AmbientOpenScene";
import { CTAScene } from "./scenes/CTAScene";
import { LogoRevealScene } from "./scenes/LogoRevealScene";
import { NumberPunchScene } from "./scenes/NumberPunchScene";
import { TaglineCascadeScene } from "./scenes/TaglineCascadeScene";

const BG_BLOBS = [
  {
    color: "#f59e0b",
    radius: 250,
    cx: 540,
    cy: 600,
    a: 1,
    b: 2,
    phaseX: 0,
    phaseY: 0,
    amplitudeX: 80,
    amplitudeY: 100,
  },
  {
    color: "#f97316",
    radius: 200,
    cx: 300,
    cy: 1200,
    a: 2,
    b: 1,
    phaseX: 1.2,
    phaseY: 0.8,
    amplitudeX: 60,
    amplitudeY: 120,
  },
  {
    color: "#d97706",
    radius: 220,
    cx: 700,
    cy: 1600,
    a: 1,
    b: 1,
    phaseX: 2.4,
    phaseY: 1.6,
    amplitudeX: 90,
    amplitudeY: 80,
  },
];

export const PromoTeaserVertical: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.dark }}>
      {BG_BLOBS.map((blob, i) => (
        <GradientBlob key={`bg-v-${i}`} config={blob} duration={600} />
      ))}

      <Series>
        <Series.Sequence durationInFrames={90}>
          <AmbientOpenScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <NumberPunchScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <TaglineCascadeScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <LogoRevealScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <CTAScene />
        </Series.Sequence>
      </Series>

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
