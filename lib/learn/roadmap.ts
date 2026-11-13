import { STRUGGLE_PACKS, TRACKS, type Track } from "@/lib/learn/catalog";
import { profileContext } from "@/lib/mentor/mentor";
import type { DeveloperProfile, LearningPack, LearningResource, Roadmap } from "@/lib/types";

// LN-01…LN-03. Pure functions; the route adds Gemini + storage.

/** Confidence at which evidence counts a roadmap step as done (LN-02). */
export const DONE_CONFIDENCE = 0.5;

export function pickTrack(goal: string, profile?: DeveloperProfile): Track {
  const g = goal.toLowerCase();
  if (/full[\s-]?stack/.test(g)) return fullstack();
  const byGoal = TRACKS.find((t) => t.keywords.some((k) => g.includes(k)));
  if (byGoal) return byGoal;
  const focus = (profile?.focusAreas[0] ?? "").toLowerCase();
  const byFocus = TRACKS.find((t) =>
    focus.includes("data") ? t.id === "data" : focus.includes("devops") || focus.includes("cloud") ? t.id === "devops" : t.keywords.some((k) => focus.includes(k)),
  );
  return byFocus ?? TRACKS.find((t) => t.id === "backend")!;
}

function fullstack(): Track {
  const fe = TRACKS.find((t) => t.id === "frontend")!;
  const be = TRACKS.find((t) => t.id === "backend")!;
  const steps = [...fe.steps.slice(0, 5), ...be.steps.filter((s) => s.id !== "git" && s.id !== "language")];
  return { id: "fullstack", name: "Full-stack developer", keywords: [], steps };
}

export function suggestGoal(profile: DeveloperProfile): string {
  return `${pickTrack("", profile).name} internship`;
}

export function curatedRoadmap(goal: string, profile: DeveloperProfile, now = new Date()): Roadmap {
  const track = pickTrack(goal, profile);
  return markProgress(
    {
      goal,
      trackId: track.id,
      source: "curated",
      steps: track.steps.map((s) => ({ ...s, status: "todo" as const })),
      createdAt: now.toISOString(),
    },
    profile,
  );
}

/** LN-02: steps are done when the profile shows the skill; the user's own choice always wins. */
export function markProgress(roadmap: Roadmap, profile: DeveloperProfile): Roadmap {
  const known = new Map(
    profile.skills.filter((s) => s.userFeedback !== "wrong").map((s) => [s.id, s.confidence] as const),
  );
  return {
    ...roadmap,
    steps: roadmap.steps.map((s) => {
      const { doneBy: _d, ...rest } = s;
      void _d;
      if (s.manual) return { ...rest, status: s.manual, ...(s.manual === "done" ? { doneBy: "user" as const } : {}) };
      const proven = s.skillIds.some((id) => (known.get(id) ?? 0) >= DONE_CONFIDENCE);
      return proven ? { ...rest, status: "done" as const, doneBy: "evidence" as const } : { ...rest, status: "todo" as const };
    }),
  };
}

export function setStepManual(roadmap: Roadmap, stepId: string, done: boolean | null, profile: DeveloperProfile): Roadmap {
  if (!roadmap.steps.some((s) => s.id === stepId)) throw new Error("Unknown step");
  return markProgress(
    {
      ...roadmap,
      steps: roadmap.steps.map((s) => {
        if (s.id !== stepId) return s;
        const { manual: _m, ...rest } = s;
        void _m;
        return done === null ? rest : { ...rest, manual: done ? ("done" as const) : ("todo" as const) };
      }),
    },
    profile,
  );
}

/** LN-03: one pack per top struggle (max 3). */
export function buildPacks(profile: DeveloperProfile): LearningPack[] {
  return profile.struggles.slice(0, 3).map((s) => {
    const pack = STRUGGLE_PACKS[s.topic];
    return {
      topic: s.topic,
      why: s.why,
      explainer: pack?.explainer ?? `A focused look at ${s.topic.toLowerCase()}. Ask the mentor for a tailored explanation.`,
      resources: pack?.resources ?? [],
      practiceHref: `/practice?topic=${encodeURIComponent(s.topic)}`,
    };
  });
}

// ---------- Gemini personalisation (D-16: generated steps + real links via Google Search) ----------

export function buildRoadmapPrompt(goal: string, profile: DeveloperProfile, base: Roadmap): string {
  return [
    "You are DevVerse's learning planner. Build a personal roadmap for this developer's goal.",
    `GOAL: ${goal}`,
    "PROFILE:",
    profileContext(profile),
    "A generic starting roadmap (adapt it: skip what they clearly know, add what their goal and struggles need):",
    JSON.stringify(base.steps.map((s) => ({ title: s.title, skillIds: s.skillIds }))),
    "",
    "Use Google Search to find 1-3 real, free, current resources per step (official docs, MDN, freeCodeCamp, YouTube courses).",
    "Reply with ONLY a JSON array (no prose, no code fence) of 5-8 steps, in order:",
    '[{"title": string, "why": "one sentence, personal to this user", "skillIds": ["lowercase-ids like react, sql, docker"],',
    '  "resources": [{"title": string, "url": "https://...", "kind": "docs|article|video|course|problem"}]}]',
  ].join("\n");
}

const KINDS = new Set<LearningResource["kind"]>(["article", "video", "docs", "problem", "course"]);

/** Parses Gemini's roadmap. Returns null when unusable, so the caller keeps the curated one. */
export function parseAiRoadmap(text: string, goal: string, trackId: string, now = new Date()): Roadmap | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;
  const steps: Roadmap["steps"] = [];
  for (const [i, s] of raw.slice(0, 10).entries()) {
    const o = s as { title?: unknown; why?: unknown; skillIds?: unknown; resources?: unknown };
    if (typeof o?.title !== "string" || !o.title.trim()) continue;
    const resources = (Array.isArray(o.resources) ? o.resources : [])
      .map((x) => x as LearningResource)
      .filter((x) => typeof x?.title === "string" && typeof x?.url === "string" && /^https:\/\/[^\s]+$/.test(x.url))
      .slice(0, 3)
      .map((x) => ({ title: x.title.slice(0, 120), url: x.url, kind: KINDS.has(x.kind) ? x.kind : ("article" as const) }));
    steps.push({
      id: `step-${i + 1}`,
      title: o.title.trim().slice(0, 120),
      why: typeof o.why === "string" ? o.why.slice(0, 300) : undefined,
      skillIds: (Array.isArray(o.skillIds) ? o.skillIds : [])
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.toLowerCase().replace(/[^a-z0-9+#-]+/g, "-"))
        .slice(0, 5),
      status: "todo",
      resources,
    });
  }
  if (steps.length < 3) return null;
  return { goal, trackId, source: "ai", steps, createdAt: now.toISOString() };
}
