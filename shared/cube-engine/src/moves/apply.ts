import { rotateFacelets } from "../cube/faceGrid.js";
import type { FaceletCube } from "../cube/types.js";
import { MOVE_DEFINITIONS } from "./definitions.js";
import { type Move, parseMoveToken } from "./types.js";

export function applyMove(cube: FaceletCube, move: Move): FaceletCube {
  const parsed = parseMoveToken(move);
  if (!parsed) {
    throw new Error(`Invalid move: "${move}" is not a recognized move token.`);
  }
  const { rotate, inLayer } = MOVE_DEFINITIONS[parsed.base];
  return rotateFacelets(cube, rotate, inLayer, parsed.turns);
}

export function applyMoves(cube: FaceletCube, moves: readonly Move[]): FaceletCube {
  return moves.reduce((current, move) => applyMove(current, move), cube);
}
