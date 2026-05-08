import type React from "react";
import { AbsoluteFill, Series } from "remotion";
import { GrainOverlay } from "@/components/GrainOverlay";
import { AiToolsScene } from "./scenes/AiToolsScene";
import { ApiDocsScene } from "./scenes/ApiDocsScene";
import { BatchProcessingScene } from "./scenes/BatchProcessingScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { EndCardScene } from "./scenes/EndCardScene";
import { ImageEditorScene } from "./scenes/ImageEditorScene";
import { PipelineBuilderScene } from "./scenes/PipelineBuilderScene";
import { SingleToolScene } from "./scenes/SingleToolScene";

export const ProductDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f5f4" }}>
      <Series>
        <Series.Sequence durationInFrames={240}>
          <DashboardScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={360}>
          <SingleToolScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={360}>
          <BatchProcessingScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={390}>
          <PipelineBuilderScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={360}>
          <AiToolsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <ImageEditorScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <ApiDocsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <EndCardScene />
        </Series.Sequence>
      </Series>

      <GrainOverlay opacity={0.02} />
    </AbsoluteFill>
  );
};
