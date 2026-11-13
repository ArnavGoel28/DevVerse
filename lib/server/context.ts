import "server-only";

import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError, requireUser } from "@/lib/server/http";
import type { DeveloperProfile } from "@/lib/types";

// Who is asking, and which profile do we personalise with?
// - Signed in (Authorization header): the profile is loaded from Firestore — never trusted from the browser.
// - Demo (no header): the browser sends its demo profile (built from public data, D-18). It only affects
//   that visitor's own answers, so it is size-checked and accepted.

export type RequestContext = { uid: string | null; ipKey: string; profile: DeveloperProfile };

const MAX_DEMO_PROFILE_BYTES = 60_000;

export function looksLikeProfile(p: unknown): p is DeveloperProfile {
  const o = p as DeveloperProfile;
  return (
    !!o &&
    typeof o.summary === "string" &&
    Array.isArray(o.skills) &&
    Array.isArray(o.struggles) &&
    Array.isArray(o.recommendations) &&
    !!o.githubStats &&
    typeof o.githubStats.login === "string"
  );
}

export async function resolveContext(request: Request, body: { profile?: unknown }): Promise<RequestContext> {
  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (request.headers.get("authorization")) {
    const { uid } = await requireUser(request);
    const snap = await adminDb().collection("users").doc(uid).collection("profile").doc("current").get();
    if (!snap.exists) throw new HttpError(409, "Build your profile first (Profile page).");
    return { uid, ipKey, profile: snap.data() as DeveloperProfile };
  }
  if (!looksLikeProfile(body.profile) || JSON.stringify(body.profile).length > MAX_DEMO_PROFILE_BYTES)
    throw new HttpError(400, "Build a profile first (Profile page).");
  return { uid: null, ipKey, profile: body.profile };
}

// ---------- AI usage caps (AI-11, NFR-AI-05) ----------

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 40;
export const AI_DEMO_DAILY_LIMIT = Number(process.env.AI_DEMO_DAILY_LIMIT) || 15;

const demoUsage = new Map<string, { date: string; requests: number }>();
const today = () => new Date().toISOString().slice(0, 10);

/** Counts one AI request. Throws 429 at the cap. Returns how many are left today. */
export async function consumeAiQuota(ctx: RequestContext): Promise<number> {
  const date = today();
  if (!ctx.uid) {
    const u = demoUsage.get(ctx.ipKey);
    const used = u?.date === date ? u.requests : 0;
    if (used >= AI_DEMO_DAILY_LIMIT) throw new HttpError(429, "Daily AI limit reached for the demo. Sign in for more.");
    demoUsage.set(ctx.ipKey, { date, requests: used + 1 });
    if (demoUsage.size > 5000) demoUsage.clear();
    return AI_DEMO_DAILY_LIMIT - used - 1;
  }
  const ref = adminDb().collection("users").doc(ctx.uid);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const u = snap.get("aiUsage") as { date?: string; requests?: number } | undefined;
    const used = u?.date === date ? (u.requests ?? 0) : 0;
    if (used >= AI_DAILY_LIMIT) throw new HttpError(429, "You've reached today's AI limit. It resets at midnight UTC.");
    tx.set(ref, { aiUsage: { date, requests: used + 1 } }, { merge: true });
    return AI_DAILY_LIMIT - used - 1;
  });
}

/** DI-02: record that the user got AI help on some skills (a fact, not the chat text). */
export async function recordAiHelpEvidence(uid: string, skills: string[], topic: string) {
  if (!skills.length) return;
  await adminDb()
    .collection("users")
    .doc(uid)
    .collection("evidence")
    .add({
      source: "mentor",
      kind: "ai_help",
      skills,
      outcome: "neutral",
      weight: 0.5,
      detail: `Asked the mentor about ${topic}`,
      createdAt: new Date().toISOString(),
    });
}
