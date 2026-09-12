/**
 * Canonical cube types shared across the entire engine.
 * Face order U, R, F, D, L, B is used consistently for facelet indexing (9 stickers each, 54 total).
 */

export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type Face = (typeof FACES)[number];

export const COLORS = ["white", "red", "green", "yellow", "orange", "blue"] as const;
export type Color = (typeof COLORS)[number];

/** 54 facelets, ordered U(0-8) R(9-17) F(18-26) D(27-35) L(36-44) B(45-53), row-major per face. */
export type FaceletCube = Color[];
