import "server-only";

import { generateText, isGeminiConfigured } from "@/lib/gemini/client";
import { buildRoadmapPrompt, curatedRoadmap, markProgress, parseAiRoadmap, setStepManual } from "@/lib/learn/roadmap";
import { consumeAiQuota, type RequestContext } from "@/lib/server/context";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError } from "@/lib/server/http";
import type { DeveloperProfile, Roadmap } from "@/lib/types";

// LN-01 / LN-02. Roadmaps live at users/{uid}/roadmaps/current (docs/08-data-model.md).

const roadmapRef = (uid: string) => adminDb().collection("users").doc(uid).collection("roadmaps").doc("current");
const profileOf = async (uid: string) =>
  (await adminDb().collection("users").doc(uid).collection("profile").doc("current").get()).data() as DeveloperProfile;

export async function generateRoadmap(ctx: RequestContext, goal: string): Promise<{ roadmap: Roadmap; mode: string }> {
  const base = curatedRoadmap(goal, ctx.profile);
  let roadmap = base;
  let mode = "curated";
  if (isGeminiConfigured()) {
    try {
      await consumeAiQuota(ctx);
      const text = await generateText({ prompt: buildRoadmapPrompt(goal, ctx.profile, base), search: true });
      const ai = parseAiRoadmap(text, goal, base.trackId);
      if (ai) {
        roadmap = markProgress(ai, ctx.profile);
        mode = "gemini";
      } else mode = "curated (AI reply unusable)";
    } catch (e) {
      if (e instanceof HttpError && e.status === 429) mode = "curated (daily AI limit reached)";
      else console.error("Gemini roadmap failed; curated roadmap.", e);
    }
  }
  if (ctx.uid) await roadmapRef(ctx.uid).set(roadmap);
  return { roadmap, mode };
}

export async function getRoadmap(uid: string): Promise<Roadmap | null> {
  const snap = await roadmapRef(uid).get();
  if (!snap.exists) return null;
  return markProgress(snap.data() as Roadmap, await profileOf(uid)); // progress follows the latest evidence
}

export async function setStep(uid: string, stepId: string, done: boolean | null): Promise<Roadmap> {
  const snap = await roadmapRef(uid).get();
  if (!snap.exists) throw new HttpError(404, "No roadmap yet.");
  let next: Roadmap;
  try {
    next = setStepManual(snap.data() as Roadmap, stepId, done, await profileOf(uid));
  } catch {
    throw new HttpError(404, "Unknown step.");
  }
  await roadmapRef(uid).set(next);
  return next;
}
