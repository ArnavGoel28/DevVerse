import { errorResponse, requireUser } from "@/lib/server/http";
import { getProfile } from "@/lib/server/profile-service";

// DI-05 / DI-08: the signed-in user's Developer Profile.
export async function GET(request: Request) {
  try {
    const { uid } = await requireUser(request);
    return Response.json(await getProfile(uid));
  } catch (e) {
    return errorResponse(e);
  }
}
