// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type {
  CanvasObject,
  EllipseAttrs,
  LineAttrs,
  RectAttrs,
  TextAttrs,
  ToolType,
} from "@/types/editor";

describe("CanvasObject discriminated union", () => {
  it("narrows to line type with LineAttrs", () => {
    const obj: CanvasObject = {
      id: "l1",
      type: "line",
      layerId: "layer-1",
      attrs: {
        points: [0, 0, 100, 100],
        stroke: "#000",
        strokeWidth: 2,
        tension: 0,
        lineCap: "round",
        lineJoin: "round",
        opacity: 1,
        globalCompositeOperation: "source-over",
      },
    };
    if (obj.type === "line") {
      const attrs: LineAttrs = obj.attrs;
      expect(attrs.points).toEqual([0, 0, 100, 100]);
      expect(attrs.stroke).toBe("#000");
      expect(attrs.strokeWidth).toBe(2);
    } else {
      expect.unreachable("should have narrowed to line");
    }
  });

  it("narrows to rect type with RectAttrs", () => {
    const obj: CanvasObject = {
      id: "r1",
      type: "rect",
      layerId: "layer-1",
      attrs: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fill: "#ff0000",
        stroke: "#000",
        strokeWidth: 1,
        cornerRadius: 5,
        rotation: 0,
        opacity: 1,
      },
    };
    if (obj.type === "rect") {
      const attrs: RectAttrs = obj.attrs;
      expect(attrs.x).toBe(10);
      expect(attrs.y).toBe(20);
      expect(attrs.cornerRadius).toBe(5);
    } else {
      expect.unreachable("should have narrowed to rect");
    }
  });

  it("narrows to text type with TextAttrs", () => {
    const obj: CanvasObject = {
      id: "t1",
      type: "text",
      layerId: "layer-1",
      attrs: {
        x: 50,
        y: 60,
        text: "Hello",
        fontFamily: "Arial",
        fontSize: 16,
        fontStyle: "normal",
        fontVariant: "normal",
        textDecoration: "",
        align: "left",
        fill: "#000",
        lineHeight: 1.2,
        letterSpacing: 0,
        rotation: 0,
        opacity: 1,
      },
    };
    if (obj.type === "text") {
      const attrs: TextAttrs = obj.attrs;
      expect(attrs.text).toBe("Hello");
      expect(attrs.fontFamily).toBe("Arial");
      expect(attrs.fontSize).toBe(16);
    } else {
      expect.unreachable("should have narrowed to text");
    }
  });

  it("narrows to ellipse type with EllipseAttrs", () => {
    const obj: CanvasObject = {
      id: "e1",
      type: "ellipse",
      layerId: "layer-1",
      attrs: {
        x: 100,
        y: 100,
        radiusX: 50,
        radiusY: 30,
        fill: "#00ff00",
        stroke: "#000",
        strokeWidth: 1,
        rotation: 0,
        opacity: 1,
      },
    };
    if (obj.type === "ellipse") {
      const attrs: EllipseAttrs = obj.attrs;
      expect(attrs.radiusX).toBe(50);
      expect(attrs.radiusY).toBe(30);
    } else {
      expect.unreachable("should have narrowed to ellipse");
    }
  });
});

describe("ToolType", () => {
  it("includes expected tool variants", () => {
    const tools: ToolType[] = [
      "move",
      "marquee-rect",
      "marquee-ellipse",
      "lasso-free",
      "lasso-poly",
      "magic-wand",
      "crop",
      "eyedropper",
      "brush",
      "eraser",
      "pencil",
      "clone-stamp",
      "dodge",
      "burn",
      "sponge",
      "blur-brush",
      "sharpen-brush",
      "smudge",
      "fill",
      "gradient",
      "shape-rect",
      "shape-ellipse",
      "shape-line",
      "shape-arrow",
      "shape-polygon",
      "shape-star",
      "text",
      "hand",
      "zoom",
      "transform",
    ];
    // If this compiles without error, the union accepts all these values
    expect(tools).toHaveLength(30);
  });

  it("each variant is a string", () => {
    const tool: ToolType = "brush";
    expect(typeof tool).toBe("string");
  });
});
