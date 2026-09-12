/**
 * A portable stand-in for the `performance` global. This package has no dependency on
 * "dom" lib types or @types/node (it must stay usable, and type-checkable, from both a
 * browser bundle and a plain Node process) -- so the bare identifier `performance` isn't
 * a known type here, even though the object exists at runtime in both environments.
 * Reading it off `globalThis` with a local, minimal type sidesteps that without pulling
 * in either environment's full global type surface. Date.now() is only a fallback for an
 * environment that somehow lacks it (e.g. an older JS engine), not the primary clock.
 */
interface Clock {
  now(): number;
}

const globalPerformance = (globalThis as { performance?: Clock }).performance;

export const clock: Clock = globalPerformance ?? { now: () => Date.now() };
