import { BlurFacesControls } from "./blur-faces-settings";
import { BorderControls } from "./border-settings";
import { ColorControls } from "./color-settings";
import { CompressControls } from "./compress-settings";
import { ConvertControls } from "./convert-settings";
import { CropControls } from "./crop-settings";
import { GifToolsControls } from "./gif-tools-settings";
import { RemoveBgControls } from "./remove-bg-settings";
import { ReplaceColorControls } from "./replace-color-settings";
import { ResizeControls } from "./resize-settings";
import { RotateControls } from "./rotate-settings";
import { SmartCropControls } from "./smart-crop-settings";
import { StripMetadataControls } from "./strip-metadata-settings";
import { TextOverlayControls } from "./text-overlay-settings";
import { UpscaleControls } from "./upscale-settings";
import { WatermarkTextControls } from "./watermark-text-settings";

const COLOR_TOOL_IDS = new Set(["adjust-colors"]);

interface PipelineStepSettingsProps {
  toolId: string;
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

export function PipelineStepSettings({ toolId, settings, onChange }: PipelineStepSettingsProps) {
  if (toolId === "resize") return <ResizeControls onChange={onChange} />;
  if (toolId === "crop") return <CropControls onChange={onChange} />;
  if (toolId === "rotate") return <RotateControls onChange={onChange} />;
  if (toolId === "convert") return <ConvertControls onChange={onChange} />;
  if (toolId === "compress") return <CompressControls onChange={onChange} />;
  if (toolId === "strip-metadata") return <StripMetadataControls onChange={onChange} />;
  if (toolId === "border") return <BorderControls onChange={onChange} />;
  if (toolId === "watermark-text") return <WatermarkTextControls onChange={onChange} />;
  if (toolId === "text-overlay") return <TextOverlayControls onChange={onChange} />;
  if (toolId === "replace-color") return <ReplaceColorControls onChange={onChange} />;
  if (toolId === "smart-crop") return <SmartCropControls onChange={onChange} />;
  if (toolId === "gif-tools") return <GifToolsControls onChange={onChange} />;
  if (toolId === "upscale") return <UpscaleControls onChange={onChange} />;
  if (toolId === "blur-faces") return <BlurFacesControls onChange={onChange} />;
  if (toolId === "remove-background")
    return <RemoveBgControls settings={settings} onChange={onChange} />;
  if (COLOR_TOOL_IDS.has(toolId)) return <ColorControls toolId={toolId} onChange={onChange} />;

  return (
    <p className="text-xs text-muted-foreground italic">
      No configurable settings. Defaults will be used.
    </p>
  );
}
