import type { FaceletCube } from "../cube/types.js";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface BaseAlgorithmCase {
  id: string;
  number: number;
  name: string;
  recognition: string;
  algorithm: string;
  alternatives: string[];
  fingerTricks: string;
  notes: string;
  difficulty: Difficulty;
  videoUrl?: string;
  /** The verified case state (54 facelet colors) before the algorithm is applied -- lets a UI show/play the case without re-deriving it. */
  scrambledState: FaceletCube;
}

export interface OLLCase extends BaseAlgorithmCase {
  category: string;
}

export interface PLLCase extends BaseAlgorithmCase {}

export interface F2LCase extends BaseAlgorithmCase {
  category: string;
  setup?: string;
}
