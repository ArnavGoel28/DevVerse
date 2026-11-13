import { errorResponse, requireUser } from "@/lib/server/http";
import { runImport } from "@/lib/server/profile-service";

// GH-08: import the user's entire GitHub history and rebuild the profile.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request);
    return Response.json({ profile: await runImport(uid) });
  } catch (e) {
    return errorResponse(e);
  }
}
