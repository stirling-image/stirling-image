import "./style.css";
import type React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { ClipReveal } from "./components/ClipReveal";
import { Counter } from "./components/Counter";
import { GradientBlob } from "./components/GradientBlob";
import { GrainOverlay } from "./components/GrainOverlay";
import { PhotoPlaceholder } from "./components/PhotoPlaceholder";
import { ToolPill } from "./components/ToolPill";
import { BrandGradient } from "./compositions/ambient/BrandGradient";
import { FloatingTools } from "./compositions/ambient/FloatingTools";
import { AiMagicReel } from "./compositions/features/AiMagicReel";
import { FormatUniverse } from "./compositions/features/FormatUniverse";
import { PipelineFlow } from "./compositions/features/PipelineFlow";
import { TEXT } from "./lib/fonts";

const ComponentTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0c0a09" }}>
    <div style={{ position: "absolute", top: 40, left: 40 }}>
      <ClipReveal startFrame={0}>
        <span style={{ ...TEXT.heroHeadline }}>Hello SnapOtter</span>
      </ClipReveal>
    </div>
    <div style={{ position: "absolute", top: 150, left: 40 }}>
      <ToolPill name="Resize" category="essentials" />
    </div>
    <div style={{ position: "absolute", top: 200, left: 40 }}>
      <Counter from={0} to={48} startFrame={0} duration={60} style={TEXT.counter} />
    </div>
    <PhotoPlaceholder
      width={200}
      height={150}
      style={{ position: "absolute", top: 300, left: 40 }}
    />
    <GradientBlob
      config={{
        color: "#f59e0b",
        radius: 100,
        cx: 600,
        cy: 300,
        a: 2,
        b: 3,
        phaseX: 0,
        phaseY: 0,
        amplitudeX: 50,
        amplitudeY: 40,
      }}
      duration={90}
    />
    <GrainOverlay />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ComponentTest"
      component={ComponentTest}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="FloatingTools"
      component={FloatingTools}
      durationInFrames={120}
      fps={30}
      width={800}
      height={600}
    />
    <Composition
      id="BrandGradient"
      component={BrandGradient}
      durationInFrames={150}
      fps={30}
      width={800}
      height={600}
    />
    <Composition
      id="FormatUniverse"
      component={FormatUniverse}
      durationInFrames={180}
      fps={30}
      width={800}
      height={600}
    />
    <Composition
      id="AiMagicReel"
      component={AiMagicReel}
      durationInFrames={480}
      fps={30}
      width={800}
      height={600}
    />
    <Composition
      id="PipelineFlow"
      component={PipelineFlow}
      durationInFrames={390}
      fps={30}
      width={800}
      height={600}
    />
  </>
);
