import type { Penalty, SolveRecord } from "../features/timer/types.js";
import { API_BASE, authHeaders, parseJsonOrThrow } from "./http.js";

interface ServerSolve {
  _id: string;
  scramble: string;
  rawTimeMs: number;
  penalty: Penalty;
  finalTimeMs: number | null;
  solvedAt: string;
}

function toSolveRecord(s: ServerSolve): SolveRecord {
  return { id: s._id, scramble: s.scramble, rawTimeMs: s.rawTimeMs, penalty: s.penalty, finalTimeMs: s.finalTimeMs, solvedAt: s.solvedAt };
}

export interface CreateSolveInput {
  scramble: string;
  rawTimeMs: number;
  penalty: Penalty;
  solvedAt: string;
}

export async function fetchSolves(token: string, limit = 100): Promise<SolveRecord[]> {
  const res = await fetch(`${API_BASE}/solves?limit=${limit}`, { headers: authHeaders(token) });
  const body = await parseJsonOrThrow(res);
  return (body.solves as ServerSolve[]).map(toSolveRecord);
}

export async function createSolve(token: string, input: CreateSolveInput): Promise<SolveRecord> {
  const res = await fetch(`${API_BASE}/solves`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ puzzleType: "3x3", ...input }),
  });
  const body = await parseJsonOrThrow(res);
  return toSolveRecord(body.solve as ServerSolve);
}

export async function deleteSolve(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/solves/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await parseJsonOrThrow(res);
}
