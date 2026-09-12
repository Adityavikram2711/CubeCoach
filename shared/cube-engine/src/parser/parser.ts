import { applyMoves } from "../moves/apply.js";
import type { FaceletCube } from "../cube/types.js";
import { isValidMove, type Move } from "../moves/types.js";

export class AlgorithmParseError extends Error {
  constructor(
    message: string,
    public position: number,
  ) {
    super(message);
    this.name = "AlgorithmParseError";
  }
}

interface Token {
  text: string;
  position: number;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\(|\)|[A-Za-z]+['2]?|\d+|\S/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    tokens.push({ text: match[0], position: match.index });
  }
  return tokens;
}

/**
 * Parses standard cubing notation into a flat list of moves, expanding parenthesized
 * groups and their repeat counts, e.g. "(R U R' U')2" -> ["R","U","R'","U'","R","U","R'","U'"].
 * Throws a descriptive AlgorithmParseError (with the offending character position) on
 * anything malformed, rather than silently accepting garbage.
 */
export function parseAlgorithm(source: string): Move[] {
  const tokens = tokenize(source);
  let cursor = 0;

  function parseSequence(insideParens: boolean): Move[] {
    const moves: Move[] = [];
    while (cursor < tokens.length) {
      const token = tokens[cursor]!;
      if (token.text === ")") {
        if (!insideParens) {
          throw new AlgorithmParseError(`Unexpected ")" at position ${token.position}.`, token.position);
        }
        return moves;
      }
      if (token.text === "(") {
        cursor++;
        const group = parseSequence(true);
        const closeToken = tokens[cursor];
        if (!closeToken || closeToken.text !== ")") {
          throw new AlgorithmParseError(`Missing closing ")" for group opened near position ${token.position}.`, token.position);
        }
        cursor++;
        let repeat = 1;
        const repeatToken = tokens[cursor];
        if (repeatToken && /^\d+$/.test(repeatToken.text)) {
          repeat = Number(repeatToken.text);
          cursor++;
        }
        for (let i = 0; i < repeat; i++) moves.push(...group);
        continue;
      }
      if (!isValidMove(token.text)) {
        throw new AlgorithmParseError(
          `Invalid algorithm: unrecognized move "${token.text}" at position ${token.position}.`,
          token.position,
        );
      }
      moves.push(token.text);
      cursor++;
    }
    if (insideParens) {
      throw new AlgorithmParseError("Missing closing \")\" before the end of the algorithm.", source.length);
    }
    return moves;
  }

  const moves = parseSequence(false);
  if (moves.length === 0 && tokens.length === 0 && source.trim().length > 0) {
    throw new AlgorithmParseError(`Invalid algorithm: could not parse "${source}".`, 0);
  }
  return moves;
}

/** Parses cubing notation and applies it directly to a cube in one step. */
export function applyAlgorithm(cube: FaceletCube, source: string): FaceletCube {
  return applyMoves(cube, parseAlgorithm(source));
}
