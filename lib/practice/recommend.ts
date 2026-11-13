// PR-05: recommend problems from the user's level and what they haven't solved yet.
import type { DeveloperProfile } from "@/lib/types";

import { type Difficulty, type PracticeProblem, TOPIC_NAMES } from "./catalog";

const TARGET: Record<DeveloperProfile["level"], Difficulty[]> = {
  beginner: ["easy"],
  intermediate: ["easy", "medium"],
  advanced: ["medium", "hard"],
};

export type Recommendation = { problem: PracticeProblem; reason: string };

export function recommend(
  problems: PracticeProblem[],
  profile: Pick<DeveloperProfile, "level">,
  solved: ReadonlySet<string>,
  count = 3,
): Recommendation[] {
  const solvedTopics = new Set(problems.filter((q) => solved.has(q.id)).flatMap((q) => q.topics));
  const target = TARGET[profile.level] ?? ["easy"];
  const scored = problems
    .filter((q) => !solved.has(q.id))
    .map((q, order) => {
      const fresh = q.topics.filter((t) => !solvedTopics.has(t));
      const score = (target.includes(q.difficulty) ? 10 : 0) + fresh.length * 3 - order * 0.01;
      return { q, fresh, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return scored.map(({ q, fresh }) => {
    const topic = TOPIC_NAMES[(fresh[0] ?? q.topics[0]) as string] ?? q.topics[0];
    const level = target.includes(q.difficulty) ? `fits your ${profile.level} level` : `a stretch at ${q.difficulty}`;
    const why = fresh.length ? `${topic}, a topic you haven't solved yet` : `more practice on ${topic}`;
    return { problem: q, reason: `${capitalise(why)}; ${level}.` };
  });
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
