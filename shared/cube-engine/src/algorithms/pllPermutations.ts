/**
 * Enumerates candidate PLL permutation patterns (corner permutation x edge permutation
 * of the 4 last-layer pieces, restricted to overall-even so the state is physically
 * reachable), deduplicated by AUF-equivalence.
 *
 * AUF-equivalence for a *permutation* means "the same physical cube, viewed after a
 * whole-cube y rotation." Hand-deriving that as an abstract permutation-composition
 * formula turned out to be error-prone to get the direction right (see git history --
 * two plausible conjugation directions, both wrong on first try). Instead this just
 * *is* the real operation: apply an actual "y" move via the facelet engine and re-read
 * cp/ep with the center-aware faceletToCubie -- correct by construction, reusing
 * already-proven conversions instead of a second, independently-fallible derivation.
 */
import { applyMove } from "../moves/apply.js";
import { cubieToFacelet, faceletToCubie } from "../cube/conversions.js";
import { createSolvedCubieCube } from "../cube/cubie.js";

export function conjugateByU(cp4: readonly number[], ep4: readonly number[]): { cp: number[]; ep: number[] } {
  const cubie = createSolvedCubieCube();
  cubie.cp = [...cp4, 4, 5, 6, 7];
  cubie.ep = [...ep4, 4, 5, 6, 7, 8, 9, 10, 11];
  const rotated = faceletToCubie(applyMove(cubieToFacelet(cubie), "y"));
  return { cp: rotated.cp.slice(0, 4), ep: rotated.ep.slice(0, 4) };
}

export function permutationsOf4(): number[][] {
  const perms: number[][] = [];
  const base = [0, 1, 2, 3];
  function permute(arr: number[], k: number) {
    if (k === arr.length) {
      perms.push([...arr]);
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
    }
  }
  permute(base, 0);
  return perms;
}

export function permutationParity(perm: readonly number[]): 0 | 1 {
  const visited = new Array(perm.length).fill(false);
  let transpositions = 0;
  for (let i = 0; i < perm.length; i++) {
    if (visited[i]) continue;
    let len = 0,
      j = i;
    while (!visited[j]) {
      visited[j] = true;
      j = perm[j]!;
      len++;
    }
    transpositions += len - 1;
  }
  return (transpositions % 2) as 0 | 1;
}

export interface PllPattern {
  cp: number[];
  ep: number[];
}

function pairKey(cp: readonly number[], ep: readonly number[]): string {
  return `${cp.join(",")}|${ep.join(",")}`;
}

export function isSameAufOrbit(a: PllPattern, b: PllPattern): boolean {
  let current = a;
  for (let i = 0; i < 4; i++) {
    if (pairKey(current.cp, current.ep) === pairKey(b.cp, b.ep)) return true;
    current = conjugateByU(current.cp, current.ep);
  }
  return false;
}

/** Every valid (matching-parity, non-solved) last-layer permutation pair, one per AUF orbit. */
export function enumeratePllPatterns(): PllPattern[] {
  const perms = permutationsOf4();
  const seen = new Set<string>();
  const representatives: PllPattern[] = [];

  for (const cp of perms) {
    for (const ep of perms) {
      if (permutationParity(cp) !== permutationParity(ep)) continue;
      const isSolved = cp.every((v, i) => v === i) && ep.every((v, i) => v === i);
      if (isSolved) continue;

      const key0 = pairKey(cp, ep);
      if (seen.has(key0)) continue;

      let current = { cp, ep };
      for (let i = 0; i < 4; i++) {
        seen.add(pairKey(current.cp, current.ep));
        current = conjugateByU(current.cp, current.ep);
      }
      representatives.push({ cp, ep });
    }
  }
  return representatives;
}
