import { buildExplainPrompt, buildExplainSystem, MAX_EXPLAIN_CHARS, offlineExplain } from "@/lib/code/explain";
import { languageOf } from "@/lib/code/repo";
import { callAgent } from "@/lib/server/agent-call";
import { resolveContext } from "@/lib/server/context";
import { errorResponse, HttpError, readJson } from "@/lib/server/http";

// AI-03 / WS-01: Code Reviewer agent explains selected code (or the whole file) at the user's level.
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await readJson<{ path?: unknown; code?: unknown; profile?: unknown }>(request);
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
    const code = typeof body.code === "string" ? body.code.slice(0, MAX_EXPLAIN_CHARS) : "";
    if (!path || !code.trim()) throw new HttpError(400, "Open a file (and optionally select code) first.");
    const ctx = await resolveContext(request, body);
    const answer = await callAgent(ctx, {
      system: buildExplainSystem(ctx.profile),
      prompt: buildExplainPrompt(path, code),
      offline: () => offlineExplain(path, code, languageOf(path)),
    });
    return Response.json(answer);
  } catch (e) {
    return errorResponse(e);
  }
}
