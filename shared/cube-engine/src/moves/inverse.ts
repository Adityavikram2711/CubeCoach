import { type Move, parseMoveToken } from "./types.js";

export function invertMove(move: Move): Move {
  const parsed = parseMoveToken(move);
  if (!parsed) {
    throw new Error(`Invalid move: "${move}" is not a recognized move token.`);
  }
  if (parsed.turns === 2) return move; // half turns are self-inverse
  const isPrime = move.endsWith("'");
  return isPrime ? move.slice(0, -1) : `${move}'`;
}

/** Reverses order and inverts each move, so applyMoves(applyMoves(c, alg), invertAlgorithm(alg)) === c. */
export function invertAlgorithm(moves: readonly Move[]): Move[] {
  return moves.slice().reverse().map(invertMove);
}
