import { errorResponse, HttpError, readJson, requireUser } from "@/lib/server/http";
import { saveGitHubToken } from "@/lib/server/profile-service";

// GH-01 / NFR-SE-03: receives the GitHub token once, right after sign-in, and stores it encrypted.
export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const body = await readJson<{ token?: unknown }>(request);
    if (typeof body.token !== "string" || body.token.length < 10 || body.token.length > 500)
      throw new HttpError(400, "Missing GitHub token.");
    return Response.json(await saveGitHubToken(uid, body.token));
  } catch (e) {
    return errorResponse(e);
  }
}
