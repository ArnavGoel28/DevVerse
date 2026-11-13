import "server-only";

import { GitHubError } from "@/lib/github/history";
import { adminAuth, isAdminConfigured } from "@/lib/server/firebase-admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Verifies the Firebase ID token sent as `Authorization: Bearer <token>`. */
export async function requireUser(request: Request): Promise<{ uid: string }> {
  if (!isAdminConfigured()) throw new HttpError(503, "Sign-in is not configured on the server yet.");
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Please sign in.");
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }
}

/** Turns any thrown error into a JSON response without leaking internals. */
export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof GitHubError)
    return Response.json({ error: e.message }, { status: e.status >= 400 && e.status < 600 ? e.status : 502 });
  console.error(e);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}
