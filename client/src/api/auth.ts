import { API_BASE, authHeaders, parseJsonOrThrow } from "./http.js";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function postJson(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(res);
}

export async function registerRequest(email: string, username: string, password: string): Promise<AuthResponse> {
  const body = await postJson("/auth/register", { email, username, password });
  return { token: body.token, user: body.user };
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const body = await postJson("/auth/login", { email, password });
  return { token: body.token, user: body.user };
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) });
  const body = await parseJsonOrThrow(res);
  return body.user as AuthUser;
}
