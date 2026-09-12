import { API_BASE, authHeaders, parseJsonOrThrow } from "./http.js";

export interface UserAlgorithmRecord {
  _id: string;
  userId: string;
  algorithmId: string;
  preferredAlgorithm?: string;
  personalAlternatives: string[];
  notes: string;
  favorite: boolean;
  learned: boolean;
  practiceCount: number;
  successCount: number;
  lastPracticedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserAlgorithmInput {
  /** null clears a previously-saved preferred algorithm, falling back to the official one. */
  preferredAlgorithm?: string | null;
  personalAlternatives?: string[];
  notes?: string;
  favorite?: boolean;
  learned?: boolean;
}

export async function fetchUserAlgorithms(token: string): Promise<UserAlgorithmRecord[]> {
  const res = await fetch(`${API_BASE}/user/algorithms`, { headers: authHeaders(token) });
  const body = await parseJsonOrThrow(res);
  return body.records as UserAlgorithmRecord[];
}

/** Resolves to null if the user has no personalization for this algorithm yet -- the server reports that as a normal 200, not an error. */
export async function fetchUserAlgorithm(token: string, algorithmId: string): Promise<UserAlgorithmRecord | null> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}`, { headers: authHeaders(token) });
  const body = await parseJsonOrThrow(res);
  return body.record as UserAlgorithmRecord | null;
}

export async function upsertUserAlgorithm(token: string, algorithmId: string, input: UpsertUserAlgorithmInput): Promise<UserAlgorithmRecord> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  const body = await parseJsonOrThrow(res);
  return body.record as UserAlgorithmRecord;
}

export async function deleteUserAlgorithm(token: string, algorithmId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await parseJsonOrThrow(res);
}

export async function toggleFavorite(token: string, algorithmId: string): Promise<UserAlgorithmRecord> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}/favorite`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const body = await parseJsonOrThrow(res);
  return body.record as UserAlgorithmRecord;
}

export async function toggleLearned(token: string, algorithmId: string): Promise<UserAlgorithmRecord> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}/learned`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const body = await parseJsonOrThrow(res);
  return body.record as UserAlgorithmRecord;
}

/** Records one completed practice attempt (Phase 9 trainer) -- authenticated users only. */
export async function recordPractice(token: string, algorithmId: string, success: boolean): Promise<UserAlgorithmRecord> {
  const res = await fetch(`${API_BASE}/user/algorithms/${encodeURIComponent(algorithmId)}/practice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ success }),
  });
  const body = await parseJsonOrThrow(res);
  return body.record as UserAlgorithmRecord;
}
