/**
 * The cubie-level cube state: which physical corner/edge piece occupies each of the 8
 * corner / 12 edge slots, and how it's twisted/flipped there.
 *
 * Corner orientation (co, 0-2): 0 means this slot's U/D-facing sticker shows this
 * piece's own U/D-type color; 1 means its L/R-type color is there instead; 2 means its
 * F/B-type color is there. Edge orientation (eo, 0-1): 0 means the slot's primary-axis
 * sticker (U/D-facing, or F/B-facing for the 4 equator edges) shows the piece's own
 * primary-type color; 1 means it doesn't.
 *
 * This numbering is an internal convention (see conversions.ts) -- what matters is that
 * it round-trips exactly with the facelet model and that the standard physical
 * invariants (corner-orientation sum = 0 mod 3, edge-orientation sum = 0 mod 2) hold,
 * both of which are covered by tests.
 */
export interface CubieCube {
  /** cp[slot] = index of the corner piece (into CORNER_NAMES) occupying that slot. */
  cp: number[];
  /** co[slot] = orientation (0-2) of the piece occupying that slot. */
  co: number[];
  /** ep[slot] = index of the edge piece (into EDGE_NAMES) occupying that slot. */
  ep: number[];
  /** eo[slot] = orientation (0-1) of the piece occupying that slot. */
  eo: number[];
}

export function createSolvedCubieCube(): CubieCube {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

export function isCubieSolved(cube: CubieCube): boolean {
  return (
    cube.cp.every((c, i) => c === i) &&
    cube.co.every((o) => o === 0) &&
    cube.ep.every((e, i) => e === i) &&
    cube.eo.every((o) => o === 0)
  );
}
