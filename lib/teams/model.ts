// TM-01 / TM-02: team skill matrix, single points of failure and onboarding paths.
// Sample teammates are fictional until the Teams backend exists (docs/10-backend-plan.md).
import type { DeveloperProfile } from "@/lib/types";

export type Member = { id: string; name: string; role: string; you?: boolean; skills: Record<string, number> };
export type Team = { name: string; members: Member[]; sample: boolean };

export function memberFromProfile(profile: Pick<DeveloperProfile, "skills" | "githubStats">): Member {
  const skills: Record<string, number> = {};
  for (const s of profile.skills) if (s.userFeedback !== "wrong" && s.userFeedback !== "hidden") skills[s.id] = s.confidence;
  return { id: "you", name: profile.githubStats.login, role: "You", you: true, skills };
}

export function sampleTeam(you: Member): Team {
  return {
    name: "Product Squad",
    sample: true,
    members: [
      you,
      { id: "m1", name: "priya.s", role: "Tech lead", skills: { typescript: 0.9, react: 0.85, nodejs: 0.8, gcp: 0.7, postgresql: 0.6, docker: 0.6 } },
      { id: "m2", name: "omar.dev", role: "Backend", skills: { nodejs: 0.85, postgresql: 0.8, docker: 0.75, "ci-cd": 0.7, typescript: 0.6 } },
      { id: "m3", name: "lena.ui", role: "Frontend", skills: { react: 0.9, css: 0.85, typescript: 0.7, nextjs: 0.65 } },
      { id: "m4", name: "kabir.new", role: "New joiner", skills: { javascript: 0.5, react: 0.3, css: 0.4 } },
    ],
  };
}

/** The team's stack: skills ranked by how much the team relies on them (sum of confidence). */
export function teamStack(team: Team, limit = 8): string[] {
  const sum = new Map<string, number>();
  for (const m of team.members) for (const [k, v] of Object.entries(m.skills)) sum.set(k, (sum.get(k) ?? 0) + v);
  return [...sum.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k]) => k);
}

/** Skills only one person is strong in: a bus-factor risk. */
export function singlePoints(team: Team, stack = teamStack(team)): { skill: string; owner: string }[] {
  return stack.flatMap((skill) => {
    const strong = team.members.filter((m) => (m.skills[skill] ?? 0) >= 0.6);
    return strong.length === 1 ? [{ skill, owner: strong[0].name }] : [];
  });
}

/** TM-02: what a member should learn first to work on this team's stack. */
export function onboardingPath(team: Team, member: Member, stack = teamStack(team)): { skill: string; current: number; teamAvg: number }[] {
  const others = team.members.filter((m) => m.id !== member.id);
  return stack
    .map((skill) => ({ skill, current: member.skills[skill] ?? 0, teamAvg: others.reduce((s, m) => s + (m.skills[skill] ?? 0), 0) / Math.max(others.length, 1) }))
    .filter((x) => x.current < 0.5)
    .sort((a, b) => b.teamAvg - b.current - (a.teamAvg - a.current))
    .slice(0, 5);
}
