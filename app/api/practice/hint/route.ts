import { resolveContext } from "@/lib/server/context";
import { errorResponse, HttpError, readJson } from "@/lib/server/http";
import { getHint } from "@/lib/server/practice-service";

// PR-06: Practice Coach hint (Gemini, with an authored offline fallback).
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await readJson<{ problemId?: unknown; code?: unknown; level?: unknown; profile?: unknown }>(request);
    const level = body.level === 1 || body.level === 2 || body.level === 3 ? body.level : null;
    if (!level || typeof body.problemId !== "string") throw new HttpError(400, "Pick a problem and a hint level (1–3).");
    const ctx = await resolveContext(request, body);
    return Response.json(await getHint(ctx, body.problemId, typeof body.code === "string" ? body.code : "", level));
  } catch (e) {
    return errorResponse(e);
  }
}
