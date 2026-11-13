import type { DeveloperProfile, Evidence, GitHubSnapshot, SkillFeedback } from "@/lib/types";
import { snapshotToEvidence } from "@/lib/profile/evidence";
import { enrichProfile, type GenerateJson } from "@/lib/profile/enrich";
import { buildRulesProfile } from "@/lib/profile/rules";

// The whole pipeline: GitHub snapshot → evidence (DI-02) → rules profile → Gemini text (optional).

export async function buildProfile(
  snapshot: GitHubSnapshot,
  generate: GenerateJson | null,
  now = new Date(),
): Promise<{ evidence: Evidence[]; profile: DeveloperProfile }> {
  const evidence = snapshotToEvidence(snapshot);
  const draft = buildRulesProfile(snapshot, evidence, now);
  const profile = await enrichProfile(snapshot, draft, generate);
  return { evidence, profile };
}

/** DI-06: keep the user's corrections when the profile is rebuilt. */
export function carryOverFeedback(next: DeveloperProfile, previous?: DeveloperProfile | null): DeveloperProfile {
  if (!previous) return next;
  const fb = new Map(previous.skills.filter((s) => s.userFeedback).map((s) => [s.id, s.userFeedback!]));
  return { ...next, skills: next.skills.map((s) => (fb.has(s.id) ? { ...s, userFeedback: fb.get(s.id) } : s)) };
}

/** DI-06: apply a confirm / wrong / hide (or undo with null) to one skill. */
export function applySkillFeedback(
  profile: DeveloperProfile,
  skillId: string,
  feedback: SkillFeedback | null,
): DeveloperProfile {
  if (!profile.skills.some((s) => s.id === skillId)) throw new Error("Unknown skill");
  return {
    ...profile,
    skills: profile.skills.map((s) => {
      if (s.id !== skillId) return s;
      const { userFeedback: _old, ...rest } = s;
      void _old;
      return feedback ? { ...rest, userFeedback: feedback } : rest;
    }),
  };
}

export const SKILL_FEEDBACK: readonly SkillFeedback[] = ["confirmed", "wrong", "hidden"];
