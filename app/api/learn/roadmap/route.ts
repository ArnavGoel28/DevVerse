import { resolveContext } from "@/lib/server/context";
import { errorResponse, HttpError, readJson, requireUser } from "@/lib/server/http";
import { generateRoadmap, getRoadmap } from "@/lib/server/learn-service";

// LN-01: a roadmap toward the user's goal, personalised by Gemini with real links (D-16).
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { uid } = await requireUser(request);
    return Response.json({ roadmap: await getRoadmap(uid) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ goal?: unknown; profile?: unknown }>(request);
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (goal.length < 3 || goal.length > 100) throw new HttpError(400, "Describe your goal in 3–100 characters.");
    const ctx = await resolveContext(request, body);
    return Response.json(await generateRoadmap(ctx, goal));
  } catch (e) {
    return errorResponse(e);
  }
}
