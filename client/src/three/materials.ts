import type { Color } from "@cube-coach/cube-engine";

/** Sticker colors for the 6 engine Color values, tuned to read clearly under the cube's lighting. */
export const STICKER_COLOR: Record<Color, string> = {
  white: "#f5f5f0",
  yellow: "#ffd500",
  red: "#c8102e",
  orange: "#ff6f1f",
  blue: "#0051ba",
  green: "#00a651",
};

/** Dark plastic body color for the cubies themselves. */
export const CUBIE_BODY_COLOR = "#141414";
export const CORE_COLOR = "#050505";

export const CUBIE_SIZE = 0.94;
export const CUBIE_GAP = 1;
export const STICKER_SIZE = CUBIE_SIZE * 0.82;
export const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.005;
export const STICKER_THICKNESS = 0.02;
