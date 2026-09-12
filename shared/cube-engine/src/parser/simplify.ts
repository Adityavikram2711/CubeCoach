import { parseMoveToken, type Move } from "../moves/types.js";
import type { BaseMoveName } from "../moves/definitions.js";

function stringifyMove(base: BaseMoveName, turns: number): Move {
  const n = ((turns % 4) + 4) % 4;
  return n === 1 ? base : n === 2 ? `${base}2` : `${base}'`;
}

/**
 * Cancels adjacent moves on the same face/layer (R R' -> nothing, R R -> R2, R2 R2 ->
 * nothing) using a single left-to-right pass. This deliberately doesn't reorder moves
 * to find cancellations across independent axes (e.g. commuting a U past an R to meet
 * another U) -- that's a much deeper search problem, and simple adjacent cancellation
 * is what "simplify this algorithm" means in everyday cubing use.
 */
export function simplifyMoves(moves: readonly Move[]): Move[] {
  const stack: { base: BaseMoveName; turns: number }[] = [];
  for (const move of moves) {
    const parsed = parseMoveToken(move);
    if (!parsed) {
      throw new Error(`Invalid move: "${move}" is not a recognized move token.`);
    }
    const top = stack[stack.length - 1];
    if (top && top.base === parsed.base) {
      const combined = (top.turns + parsed.turns) % 4;
      if (combined === 0) {
        stack.pop();
      } else {
        top.turns = combined;
      }
    } else {
      stack.push({ base: parsed.base, turns: parsed.turns });
    }
  }
  return stack.map(({ base, turns }) => stringifyMove(base, turns));
}
