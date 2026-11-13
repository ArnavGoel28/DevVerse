import { isValidLogin } from "@/lib/github/history";
import { errorResponse, HttpError, readJson } from "@/lib/server/http";
import { buildDemoProfile } from "@/lib/server/profile-service";

// Demo: build a profile from any public GitHub username without signing in (nothing is stored).
// Lets judges and visitors see the core feature instantly. Rate-limited per IP.
export const maxDuration = 60;

const hits = new Map<string, number[]>();
const LIMIT = 10; // per IP per hour

function rateLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= LIMIT) throw new HttpError(429, "Too many demo profiles. Please try again later.");
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ login?: unknown }>(request);
    const login = typeof body.login === "string" ? body.login.trim().replace(/^@/, "") : "";
    if (!isValidLogin(login)) throw new HttpError(400, "That doesn't look like a GitHub username.");
    rateLimit(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local");
    return Response.json({ profile: await buildDemoProfile(login) });
  } catch (e) {
    return errorResponse(e);
  }
}
