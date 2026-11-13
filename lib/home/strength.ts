// Profile strength (docs/12-todo.md §1): endowed progress (Nunes & Drèze, 2006) — GitHub import already counts —
// and goal-gradient (Kivetz et al., 2006) — show the few steps to the next level. Every point is earned from real
// evidence; nothing is inflated.
import type { DeveloperProfile } from "@/lib/types";

export type StrengthStep = { id: string; label: string; points: number; done: boolean; href: string };
export type Strength = { score: number; level: "Starter" | "Rising" | "Strong" | "All-star"; next: StrengthStep[]; nextLevelAt: number | null; steps: StrengthStep[] };

const LEVELS: { at: number; name: Strength["level"] }[] = [
  { at: 0, name: "Starter" },
  { at: 40, name: "Rising" },
  { at: 70, name: "Strong" },
  { at: 90, name: "All-star" },
];

export function profileStrength(
  profile: Pick<DeveloperProfile, "skills" | "githubInsights" | "githubStats">,
  activity: { solved: number; posts: number },
): Strength {
  const strongSkills = profile.skills.filter((s) => s.confidence >= 0.6 && s.userFeedback !== "wrong" && s.userFeedback !== "hidden").length;
  const steps: StrengthStep[] = [
    { id: "import", label: "Import your GitHub history", points: 30, done: true, href: "/profile" },
    { id: "skills", label: "Prove 3 strong skills", points: 15, done: strongSkills >= 3, href: "/profile" },
    { id: "solve1", label: "Solve your first practice problem", points: 15, done: activity.solved >= 1, href: "/practice" },
    { id: "solve5", label: "Solve 5 practice problems", points: 10, done: activity.solved >= 5, href: "/practice" },
    { id: "post", label: "Ask, answer or share in Community", points: 10, done: activity.posts >= 1, href: "/community" },
    { id: "gaps", label: "Fix your GitHub gaps (READMEs, descriptions)", points: 10, done: profile.githubInsights.gaps.length === 0, href: "/github" },
    { id: "oss", label: "Get an open-source PR merged", points: 10, done: (profile.githubStats.totals?.mergedExternalPRs ?? 0) > 0, href: "/github" },
  ];
  const score = steps.reduce((s, x) => s + (x.done ? x.points : 0), 0);
  const level = [...LEVELS].reverse().find((l) => score >= l.at)!.name;
  const nextLevel = LEVELS.find((l) => l.at > score);
  return { score, level, steps, next: steps.filter((s) => !s.done).slice(0, 3), nextLevelAt: nextLevel?.at ?? null };
}

export function greeting(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
