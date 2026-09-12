import { faceForNormal, faceletIndex, faceletIndexAt } from "./faceGrid.js";
import { FACE_COLOR } from "./facelet.js";
import { FACES, type Color, type Face, type FaceletCube } from "./types.js";
import { CORNER_NAMES, CORNER_POSITIONS, EDGE_NAMES, EDGE_POSITIONS, cornerCycle, edgeAxes } from "./cubieGeometry.js";
import type { CubieCube } from "./cubie.js";

interface CornerHome {
  ud: Color;
  second: Color;
  third: Color;
}
interface EdgeHome {
  primary: Color;
  secondary: Color;
}

/**
 * Builds the "home color" reference tables from a face->color mapping. faceletToCubie
 * uses the CURRENT cube's own center colors here (not the fixed canonical scheme), so
 * that a physically-solved-but-rotated cube (after a net x/y/z) still round-trips
 * correctly: corner/edge identity and orientation are read relative to whatever each
 * face's center currently shows, exactly like a person reading the cube would.
 */
function buildCornerHome(faceColor: Record<Face, Color>): CornerHome[] {
  return CORNER_POSITIONS.map((position) => {
    const cycle = cornerCycle(position);
    return {
      ud: faceColor[faceForNormal(cycle.ud)],
      second: faceColor[faceForNormal(cycle.second)],
      third: faceColor[faceForNormal(cycle.third)],
    };
  });
}

function buildEdgeHome(faceColor: Record<Face, Color>): EdgeHome[] {
  return EDGE_POSITIONS.map((position) => {
    const axes = edgeAxes(position);
    return {
      primary: faceColor[faceForNormal(axes.primary)],
      secondary: faceColor[faceForNormal(axes.secondary)],
    };
  });
}

function colorSetKey(colors: Color[]): string {
  return colors.slice().sort().join(",");
}

function cornerIdByColorSet(home: CornerHome[]): Map<string, number> {
  return new Map(home.map((h, i) => [colorSetKey([h.ud, h.second, h.third]), i]));
}

function edgeIdByColorSet(home: EdgeHome[]): Map<string, number> {
  return new Map(home.map((h, i) => [colorSetKey([h.primary, h.secondary]), i]));
}

// Canonical (fixed-color-scheme) tables, used by cubieToFacelet -- a CubieCube carries
// no memory of overall cube orientation, so it always reconstructs into this canonical
// frame (centers at their standard FACE_COLOR).
const CANONICAL_CORNER_HOME = buildCornerHome(FACE_COLOR);
const CANONICAL_EDGE_HOME = buildEdgeHome(FACE_COLOR);

export function faceletToCubie(cube: FaceletCube): CubieCube {
  const currentFaceColor = Object.fromEntries(
    FACES.map((face) => [face, cube[faceletIndex(face, 1, 1)]!]),
  ) as Record<Face, Color>;
  const cornerHome = buildCornerHome(currentFaceColor);
  const edgeHome = buildEdgeHome(currentFaceColor);
  const cornerIds = cornerIdByColorSet(cornerHome);
  const edgeIds = edgeIdByColorSet(edgeHome);

  const cp: number[] = [];
  const co: number[] = [];
  for (let slot = 0; slot < 8; slot++) {
    const position = CORNER_POSITIONS[slot]!;
    const cycle = cornerCycle(position);
    const udColor = cube[faceletIndexAt(position, cycle.ud)]!;
    const secondColor = cube[faceletIndexAt(position, cycle.second)]!;
    const thirdColor = cube[faceletIndexAt(position, cycle.third)]!;

    const id = cornerIds.get(colorSetKey([udColor, secondColor, thirdColor]));
    if (id === undefined) {
      throw new Error(`Corner slot ${slot} has an impossible color combination: ${udColor}/${secondColor}/${thirdColor}.`);
    }
    const home = cornerHome[id]!;
    const orientation = udColor === home.ud ? 0 : udColor === home.second ? 1 : 2;
    cp.push(id);
    co.push(orientation);
  }

  const ep: number[] = [];
  const eo: number[] = [];
  for (let slot = 0; slot < 12; slot++) {
    const position = EDGE_POSITIONS[slot]!;
    const axes = edgeAxes(position);
    const primaryColor = cube[faceletIndexAt(position, axes.primary)]!;
    const secondaryColor = cube[faceletIndexAt(position, axes.secondary)]!;

    const id = edgeIds.get(colorSetKey([primaryColor, secondaryColor]));
    if (id === undefined) {
      throw new Error(`Edge slot ${slot} has an impossible color combination: ${primaryColor}/${secondaryColor}.`);
    }
    const home = edgeHome[id]!;
    const orientation = primaryColor === home.primary ? 0 : 1;
    ep.push(id);
    eo.push(orientation);
  }

  return { cp, co, ep, eo };
}

export function cubieToFacelet(cubie: CubieCube): FaceletCube {
  const cube: Color[] = new Array(54);

  for (const face of FACES) {
    cube[faceletIndex(face, 1, 1)] = FACE_COLOR[face];
  }

  for (let slot = 0; slot < 8; slot++) {
    const position = CORNER_POSITIONS[slot]!;
    const cycle = cornerCycle(position);
    const home = CANONICAL_CORNER_HOME[cubie.cp[slot]!]!;
    const [udColor, secondColor, thirdColor]: [Color, Color, Color] =
      cubie.co[slot] === 0
        ? [home.ud, home.second, home.third]
        : cubie.co[slot] === 1
          ? [home.second, home.third, home.ud]
          : [home.third, home.ud, home.second];
    cube[faceletIndexAt(position, cycle.ud)] = udColor;
    cube[faceletIndexAt(position, cycle.second)] = secondColor;
    cube[faceletIndexAt(position, cycle.third)] = thirdColor;
  }

  for (let slot = 0; slot < 12; slot++) {
    const position = EDGE_POSITIONS[slot]!;
    const axes = edgeAxes(position);
    const home = CANONICAL_EDGE_HOME[cubie.ep[slot]!]!;
    const [primary, secondary]: [Color, Color] =
      cubie.eo[slot] === 0 ? [home.primary, home.secondary] : [home.secondary, home.primary];
    cube[faceletIndexAt(position, axes.primary)] = primary;
    cube[faceletIndexAt(position, axes.secondary)] = secondary;
  }

  return cube;
}

export { CORNER_NAMES, EDGE_NAMES };
