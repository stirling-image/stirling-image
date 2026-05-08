import { Easing } from "remotion";

export const EASE = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  emphasis: Easing.bezier(0.34, 1.56, 0.64, 1),
  smooth: Easing.bezier(0.37, 0, 0.63, 1),
  snap: Easing.bezier(0.22, 1, 0.36, 1),
};

export const SPRING = {
  snappy: { damping: 200, stiffness: 100, mass: 0.5 },
  natural: { damping: 15, stiffness: 80, mass: 1 },
  popIn: { damping: 12, stiffness: 200, mass: 0.6 },
  heavy: { damping: 20, stiffness: 60, mass: 2 },
  settle: { damping: 18, stiffness: 150, mass: 0.8 },
};

export const TIMING = {
  fps: 30,
  staggerFrames: 2,
  holdShort: 30,
  holdMedium: 60,
  holdLong: 90,
  fadeIn: 12,
  fadeOut: 8,
  wipe: 18,
  sectionGap: 12,
  anticipation: 3,
};
