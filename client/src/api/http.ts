export const API_BASE = import.meta.env.VITE_API_URL;

export async function parseJsonOrThrow(res: Response): Promise<any> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  if (body === null) {
    throw new Error("The server returned a response that wasn't valid JSON -- check VITE_API_URL and that the API server is running.");
  }
  return body;
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
