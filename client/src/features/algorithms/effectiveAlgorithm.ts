/**
 * The global (Phase 7 verified) algorithm is always authoritative and is never
 * mutated by personalization -- this just decides what to *display/play* for a given
 * viewer: their own preferred algorithm if they've set one, otherwise the global one.
 * Personal alternatives are a separate list entirely and never factor into this.
 */
export function getEffectiveAlgorithm(globalAlgorithm: string, preferredAlgorithm: string | null | undefined): string {
  return preferredAlgorithm && preferredAlgorithm.trim().length > 0 ? preferredAlgorithm : globalAlgorithm;
}
