/**
 * Pruning tables: for a pair of coordinates, the minimum number of moves needed to
 * reach both coordinates' solved value simultaneously, for every combined state. Built
 * once via breadth-first search outward from the solved combined index, using each
 * phase's own move-transition tables (moveTables.ts) -- so a BFS layer here is just
 * cheap array lookups, not cube math.
 *
 * This works as an admissible IDA* heuristic (a true lower bound, never an
 * overestimate) precisely because the move set is closed under inverses (every move's
 * prime variant is also in the set): a forward-BFS distance from solved equals the
 * true distance *to* solved from any state, so it never misleads the search into
 * pruning away a real solution -- see phase1.ts/phase2.ts, which take the max of two
 * such tables (also always admissible, since the true distance is at least as large as
 * either individual lower bound).
 */

/** Uint8Array is enough: even the worst quarter-turn-metric cube distance (God's number, 20) fits in a byte. */
function bfs(size1: number, table1: readonly number[][], size2: number, table2: readonly number[][], solvedA: number, solvedB: number, numMoves: number): Uint8Array {
  const total = size1 * size2;
  const dist = new Uint8Array(total).fill(255);
  const startIndex = solvedA * size2 + solvedB;
  dist[startIndex] = 0;

  let frontier = new Int32Array([startIndex]);
  let depth = 0;
  let visited = 1;

  while (frontier.length > 0 && visited < total) {
    const next: number[] = [];
    for (let f = 0; f < frontier.length; f++) {
      const index = frontier[f]!;
      const a = Math.floor(index / size2);
      const b = index % size2;
      const rowA = table1[a]!;
      const rowB = table2[b]!;
      for (let m = 0; m < numMoves; m++) {
        const newIndex = rowA[m]! * size2 + rowB[m]!;
        if (dist[newIndex] === 255) {
          dist[newIndex] = depth + 1;
          next.push(newIndex);
          visited++;
        }
      }
    }
    frontier = Int32Array.from(next);
    depth++;
  }

  return dist;
}

export function lookupPruning(table: Uint8Array, size2: number, a: number, b: number): number {
  return table[a * size2 + b]!;
}

export { bfs as buildPruningTable };
