import { findIssues, issueLabel, issueLanguages } from "@/lib/github/issues";
import { resolveContext } from "@/lib/server/context";
import { errorResponse, readJson } from "@/lib/server/http";
import { getUserGitHubToken } from "@/lib/server/profile-service";
import type { OssIssue } from "@/lib/types";

// GH-10: open-source issues matched to the user's languages and level. Cached 15 min per query.
const cache = new Map<string, { at: number; issues: OssIssue[] }>();
const TTL = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await readJson<{ profile?: unknown }>(request);
    const ctx = await resolveContext(request, body);
    const key = [ctx.profile.githubStats.login, issueLabel(ctx.profile), ...issueLanguages(ctx.profile)].join("|").toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return Response.json({ issues: hit.issues, cached: true });

    const token = (ctx.uid ? await getUserGitHubToken(ctx.uid) : null) ?? process.env.GITHUB_DEMO_TOKEN ?? undefined;
    const issues = await findIssues(ctx.profile, token);
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), issues });
    return Response.json({ issues, cached: false });
  } catch (e) {
    return errorResponse(e);
  }
}
