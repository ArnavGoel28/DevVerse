import { errorResponse, readJson, requireUser } from "@/lib/server/http";
import { parseSubmission, recordSubmission } from "@/lib/server/practice-service";

// PR-03: save a judged submission + evidence for signed-in users. Demo visitors keep progress in the browser only (D-18).
export async function POST(request: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const submission = parseSubmission(body);
    if (!request.headers.get("authorization")) return Response.json({ saved: false });
    const { uid } = await requireUser(request);
    await recordSubmission(uid, submission);
    return Response.json({ saved: true });
  } catch (e) {
    return errorResponse(e);
  }
}
