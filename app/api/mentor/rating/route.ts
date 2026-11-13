import { adminDb } from "@/lib/server/firebase-admin";
import { errorResponse, HttpError, readJson, requireUser } from "@/lib/server/http";

// AI-10: helpful / not helpful. Stored per user to track answer quality (NFR-AI-02). Demo ratings are not stored.
export async function POST(request: Request) {
  try {
    const body = await readJson<{ rating?: unknown; mode?: unknown }>(request);
    if (body.rating !== "up" && body.rating !== "down") throw new HttpError(400, "rating must be up or down.");
    if (!request.headers.get("authorization")) return Response.json({ stored: false });
    const { uid } = await requireUser(request);
    await adminDb()
      .collection("users")
      .doc(uid)
      .collection("aiRatings")
      .add({ rating: body.rating, mode: typeof body.mode === "string" ? body.mode.slice(0, 20) : "unknown", createdAt: new Date().toISOString() });
    return Response.json({ stored: true });
  } catch (e) {
    return errorResponse(e);
  }
}
