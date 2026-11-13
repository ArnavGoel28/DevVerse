import { SKILL_FEEDBACK } from "@/lib/profile/build";
import { errorResponse, HttpError, readJson, requireUser } from "@/lib/server/http";
import { setSkillFeedback } from "@/lib/server/profile-service";
import type { SkillFeedback } from "@/lib/types";

// DI-06: confirm, correct ("wrong") or hide a skill; feedback = null undoes it.
export async function PATCH(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const body = await readJson<{ skillId?: unknown; feedback?: unknown }>(request);
    if (typeof body.skillId !== "string" || !body.skillId) throw new HttpError(400, "Missing skillId.");
    if (body.feedback !== null && !SKILL_FEEDBACK.includes(body.feedback as SkillFeedback))
      throw new HttpError(400, "feedback must be confirmed, wrong, hidden or null.");
    const profile = await setSkillFeedback(uid, body.skillId, body.feedback as SkillFeedback | null);
    return Response.json({ profile });
  } catch (e) {
    return errorResponse(e);
  }
}
