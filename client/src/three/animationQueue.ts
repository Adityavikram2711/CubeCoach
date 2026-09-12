import type { Move } from "@cube-coach/cube-engine";

/**
 * A small FIFO queue of pending moves for the 3D renderer, so e.g. "R U R' U'" plays
 * as 4 sequential animations instead of 4 conflicting simultaneous ones. Pure and
 * framework-independent so it's unit-testable without a WebGL context.
 */
export class MoveQueue {
  private moves: Move[] = [];

  enqueue(...moves: Move[]): void {
    this.moves.push(...moves);
  }

  /** Removes and returns the next move, or undefined if the queue is empty. */
  dequeue(): Move | undefined {
    return this.moves.shift();
  }

  peek(): Move | undefined {
    return this.moves[0];
  }

  clear(): void {
    this.moves = [];
  }

  get length(): number {
    return this.moves.length;
  }

  get isEmpty(): boolean {
    return this.moves.length === 0;
  }

  toArray(): Move[] {
    return this.moves.slice();
  }
}
