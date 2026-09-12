import { BASE_MOVE_NAMES, type BaseMoveName } from "./definitions.js";

/** e.g. "R", "R'", "R2", "Rw", "Rw'", "Rw2" */
export type Move = string;

const MOVE_TOKEN_PATTERN = new RegExp(`^(${BASE_MOVE_NAMES.join("|")})(2|')?$`);

export function parseMoveToken(token: string): { base: BaseMoveName; turns: 1 | 2 | 3 } | null {
  const match = MOVE_TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const base = match[1] as BaseMoveName;
  const suffix = match[2];
  const turns = suffix === "2" ? 2 : suffix === "'" ? 3 : 1;
  return { base, turns };
}

export function isValidMove(token: string): boolean {
  return parseMoveToken(token) !== null;
}
