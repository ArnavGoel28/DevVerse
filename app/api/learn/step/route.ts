import { errorResponse, HttpError, readJson, requireUser } from "@/lib/server/http";
import { setStep } from "@/lib/server/learn-service";

// LN-02: the user marks a step done / not done (null = let evidence decide again).
export async function PATCH(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const body = await readJson<{ stepId?: unknown; done?: unknown }>(request);
    if (typeof body.stepId !== "string" || !body.stepId) throw new HttpError(400, "Missing stepId.");
    if (body.done !== true && body.done !== false && body.done !== null) throw new HttpError(400, "done must be true, false or null.");
    return Response.json({ roadmap: await setStep(uid, body.stepId, body.done) });
  } catch (e) {
    return errorResponse(e);
  }
}
