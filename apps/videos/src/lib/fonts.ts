import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";

const { fontFamily: nunito } = loadNunito();
const { fontFamily: inter } = loadInter();
const { fontFamily: mono } = loadJetBrainsMono();

export const FONT = { heading: nunito, body: inter, mono };

export const TEXT = {
  heroHeadline: {
    fontFamily: nunito,
    fontWeight: 800,
    fontSize: 72,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    color: "white",
  },
  heroSub: {
    fontFamily: inter,
    fontWeight: 500,
    fontSize: 28,
    letterSpacing: "0em",
    lineHeight: 1.4,
    color: "white",
  },
  sectionTitle: {
    fontFamily: nunito,
    fontWeight: 700,
    fontSize: 48,
    letterSpacing: "-0.01em",
    color: "white",
  },
  label: {
    fontFamily: inter,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  body: {
    fontFamily: inter,
    fontWeight: 400,
    fontSize: 20,
    lineHeight: 1.5,
  },
  mono: {
    fontFamily: mono,
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 1.6,
  },
  toolPill: {
    fontFamily: inter,
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: "0.01em",
  },
  counter: {
    fontFamily: nunito,
    fontWeight: 800,
    fontSize: 96,
    letterSpacing: "-0.03em",
    color: "white",
  },
} as const;
