import type { Evidence, GitHubSnapshot } from "@/lib/types";
import { languageSkill, topicSkill } from "@/lib/profile/skills";

// DI-02: turn a GitHub import into evidence facts. Pure function — easy to test.
// Repo evidence is dated by repo creation, so the growth timeline (DI-04) can be back-filled.

/** Languages that make up < 5 % of a repo are noise (config files, vendored code). */
const MIN_LANGUAGE_SHARE = 0.05;

export function snapshotToEvidence(s: GitHubSnapshot): Evidence[] {
  const out: Evidence[] = [];

  for (const r of s.repos) {
    if (r.isFork) continue; // forks are other people's code
    const ref = `${r.owner}/${r.name}`;
    const total = Object.values(r.languages).reduce((a, b) => a + b, 0);
    // Repos with more commits count more (1..3).
    const activity = r.commitCount ? Math.min(3, 1 + Math.log10(Math.max(1, r.commitCount))) : 1;

    for (const [lang, bytes] of Object.entries(r.languages)) {
      if (total > 0 && bytes / total < MIN_LANGUAGE_SHARE) continue;
      const skill = languageSkill(lang);
      out.push({
        source: "github",
        kind: "repo_language",
        skills: [skill.id],
        outcome: "success",
        weight: round(activity * (total ? Math.max(0.3, bytes / total) : 1)),
        detail: `${lang} in ${r.name}${r.commitCount ? ` (${r.commitCount} commits)` : ""}`,
        ref,
        createdAt: r.createdAt,
      });
    }

    const frameworks = new Set<string>();
    for (const t of r.topics) {
      const skill = topicSkill(t);
      if (skill && !frameworks.has(skill.id)) {
        frameworks.add(skill.id);
        out.push({
          source: "github",
          kind: "repo_framework",
          skills: [skill.id],
          outcome: "success",
          weight: round(activity),
          detail: `${r.name} is tagged "${t}"`,
          ref,
          createdAt: r.createdAt,
        });
      }
    }
  }

  for (const y of s.contributionsByYear) {
    const total = y.commits + y.pullRequests + y.issues + y.reviews;
    if (!total) continue;
    out.push({
      source: "github",
      kind: "commit_activity",
      skills: [],
      outcome: "neutral",
      weight: round(Math.min(5, total / 100)),
      detail: `${total} contributions in ${y.year}`,
      ref: String(y.year),
      createdAt: `${y.year}-12-31T00:00:00Z`,
    });
  }

  for (const c of s.externalContributions) {
    if (!c.pullRequests) continue;
    out.push({
      source: "github",
      kind: "oss_contribution",
      skills: ["open-source"],
      outcome: c.merged ? "success" : "neutral",
      weight: c.merged ? 2 * c.merged : 0.5,
      detail: `${c.pullRequests} PR(s) to ${c.repo}, ${c.merged} merged`,
      ref: c.repo,
      createdAt: s.fetchedAt,
    });
  }

  for (const f of s.failedWorkflowRuns) {
    out.push({
      source: "github",
      kind: "workflow_failed",
      skills: ["ci-cd"],
      outcome: "struggle",
      weight: 1,
      detail: `Workflow "${f.name}" failed in ${f.repo}`,
      ref: f.repo,
      createdAt: f.createdAt,
    });
  }

  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
