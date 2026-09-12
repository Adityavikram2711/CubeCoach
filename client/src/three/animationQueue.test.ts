import { describe, expect, it } from "vitest";
import { MoveQueue } from "./animationQueue.js";

describe("MoveQueue", () => {
  it("starts empty", () => {
    const q = new MoveQueue();
    expect(q.isEmpty).toBe(true);
    expect(q.length).toBe(0);
    expect(q.dequeue()).toBeUndefined();
  });

  it("enqueues and dequeues in FIFO order", () => {
    const q = new MoveQueue();
    q.enqueue("R", "U", "R'", "U'");
    expect(q.length).toBe(4);
    expect(q.dequeue()).toBe("R");
    expect(q.dequeue()).toBe("U");
    expect(q.dequeue()).toBe("R'");
    expect(q.dequeue()).toBe("U'");
    expect(q.isEmpty).toBe(true);
  });

  it("peek does not remove the move", () => {
    const q = new MoveQueue();
    q.enqueue("R", "U");
    expect(q.peek()).toBe("R");
    expect(q.length).toBe(2);
  });

  it("clear empties the queue", () => {
    const q = new MoveQueue();
    q.enqueue("R", "U", "F");
    q.clear();
    expect(q.isEmpty).toBe(true);
    expect(q.dequeue()).toBeUndefined();
  });

  it("supports enqueueing an entire algorithm as one call", () => {
    const q = new MoveQueue();
    const algorithm = ["F", "R", "U'", "R'", "U'", "R", "U", "R'", "F'"];
    q.enqueue(...algorithm);
    expect(q.toArray()).toEqual(algorithm);
  });

  it("further enqueues append after existing moves", () => {
    const q = new MoveQueue();
    q.enqueue("R");
    q.enqueue("U", "R'");
    expect(q.toArray()).toEqual(["R", "U", "R'"]);
  });
});
