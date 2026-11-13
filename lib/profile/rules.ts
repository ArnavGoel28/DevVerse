import type {
  DeveloperProfile,
  Evidence,
  GitHubSnapshot,
  GitHubStats,
  ProfileSkill,
  ProfileStruggle,
  Recommendation,
} from "@/lib/types";
import { languageSkill, parentName, skillMeta } from "@/lib/profile/skills";

// Rules-based Developer Profile (DI-01…DI-09, GH-09).
// Always works (no AI key needed) and is deterministic, so it is unit-tested.
// Gemini (lib/gemini/profile.ts) rewrites the text fields on top of this when a key is configured.

const MAX_SKILLS = 20;

/** More evidence → higher confidence, with diminishing returns. Never 100 %. */
export function confidenceFromScore(score: number): number {
  return Math.min(0.95, Math.round((1 - Math.exp(-score / 3)) * 100) / 100);
}

function scoreSkills(evidence: Evidence[], untilYear?: number) {
  const map = new Map<string, { score: number; count: number; details: string[]; refs: Set<string> }>();
  for (const e of evidence) {
    if (e.outcome === "struggle" || !e.skills.length) continue;
    if (untilYear !== undefined && new Date(e.createdAt).getUTCFullYear() > untilYear) continue;
    for (const id of e.skills) {
      const s = map.get(id) ?? { score: 0, count: 0, details: [], refs: new Set<string>() };
      s.score += e.weight;
      s.count += 1;
      if (e.detail) s.details.push(e.detail);
      if (e.ref) s.refs.add(e.ref);
      map.set(id, s);
    }
  }
  return map;
}

/** `names` keeps GitHub's own spelling for languages we don't have in the catalogue (e.g. "OpenSCAD"). */
export function buildSkills(evidence: Evidence[], names: Map<string, string> = new Map()): ProfileSkill[] {
  return [...scoreSkills(evidence).entries()]
    .map(([id, s]) => {
      const known = id === "open-source" ? { id, name: "Open source", parent: "tools" } : skillMeta(id);
      const meta = { ...known, name: names.get(id) ?? known.name };
      const examples = s.details.slice(0, 3).join("; ");
      return {
        id,
        name: meta.name,
        parent: meta.parent,
        confidence: confidenceFromScore(s.score),
        evidenceCount: s.count,
        why: `${s.count} piece${s.count === 1 ? "" : "s"} of evidence across ${s.refs.size} project${s.refs.size === 1 ? "" : "s"}, for example ${examples}.`,
      };
    })
    .sort((a, b) => b.confidence - a.confidence || b.evidenceCount - a.evidenceCount)
    .slice(0, MAX_SKILLS);
}

/** DI-04: back-fill confidence per year for the top skills. */
export function buildGrowth(evidence: Evidence[], skills: ProfileSkill[], nowYear: number): DeveloperProfile["growth"] {
  const top = skills.slice(0, 5).map((s) => s.id);
  const years = evidence.filter((e) => e.skills.length).map((e) => new Date(e.createdAt).getUTCFullYear());
  if (!years.length || !top.length) return [];
  const first = Math.max(Math.min(...years), nowYear - 9); // at most 10 years
  const out: DeveloperProfile["growth"] = [];
  for (let y = first; y <= nowYear; y++) {
    const scored = scoreSkills(evidence, y);
    out.push({
      period: String(y),
      skills: Object.fromEntries(top.map((id) => [id, confidenceFromScore(scored.get(id)?.score ?? 0)])),
    });
  }
  return out;
}

export function buildStats(s: GitHubSnapshot): GitHubStats {
  const langBytes = new Map<string, number>();
  for (const r of s.repos) {
    if (r.isFork) continue;
    for (const [lang, bytes] of Object.entries(r.languages)) langBytes.set(lang, (langBytes.get(lang) ?? 0) + bytes);
  }
  const totalBytes = [...langBytes.values()].reduce((a, b) => a + b, 0) || 1;
  const own = s.repos.filter((r) => r.isOwn && !r.isFork);
  return {
    login: s.account.login,
    avatarUrl: s.account.avatarUrl,
    memberSince: s.account.createdAt,
    source: s.source,
    totals: {
      repos: own.length,
      stars: own.reduce((a, r) => a + r.stars, 0),
      commits: s.contributionsByYear.reduce((a, y) => a + y.commits, 0),
      pullRequests: s.contributionsByYear.reduce((a, y) => a + y.pullRequests, 0),
      mergedExternalPRs: s.externalContributions.reduce((a, c) => a + c.merged, 0),
    },
    contributionsByYear: s.contributionsByYear,
    topLanguages: [...langBytes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, bytes]) => ({ name, share: Math.round((bytes / totalBytes) * 1000) / 1000 })),
    topRepos: [...own]
      .sort((a, b) => b.stars - a.stars || +new Date(b.pushedAt) - +new Date(a.pushedAt))
      .slice(0, 6)
      .map((r) => ({ name: r.name, owner: r.owner, stars: r.stars, language: r.primaryLanguage, pushedAt: r.pushedAt, description: r.description })),
    externalContributions: s.externalContributions.slice(0, 10),
  };
}

/** DI-03: struggles we can see in GitHub history. Other modules add more later (practice, deploys…). */
export function buildStruggles(s: GitHubSnapshot, now: Date): ProfileStruggle[] {
  const out: ProfileStruggle[] = [];
  const own = s.repos.filter((r) => r.isOwn && !r.isFork);

  const known = own.filter((r) => r.hasReadme !== undefined);
  const noReadme = known.filter((r) => r.hasReadme === false);
  if (known.length >= 2 && noReadme.length / known.length >= 0.4) {
    out.push({
      topic: "Documenting projects",
      severity: round(noReadme.length / known.length),
      trend: "steady",
      occurrences: noReadme.length,
      why: `${noReadme.length} of ${known.length} of your repositories have no README (e.g. ${noReadme.slice(0, 3).map((r) => r.name).join(", ")}).`,
    });
  }

  if (s.failedWorkflowRuns.length) {
    const monthAgo = now.getTime() - 30 * 24 * 3600 * 1000;
    const recent = s.failedWorkflowRuns.filter((f) => +new Date(f.createdAt) >= monthAgo).length;
    const older = s.failedWorkflowRuns.length - recent;
    out.push({
      topic: "Failing CI builds",
      severity: round(Math.min(1, s.failedWorkflowRuns.length / 10)),
      trend: recent > older ? "rising" : recent < older ? "falling" : "steady",
      occurrences: s.failedWorkflowRuns.length,
      why: `${s.failedWorkflowRuns.length} failed GitHub Actions run(s), e.g. "${s.failedWorkflowRuns[0].name}" in ${s.failedWorkflowRuns[0].repo}.`,
    });
  }

  const counted = own.filter((r) => r.commitCount !== undefined);
  const tiny = counted.filter((r) => (r.commitCount ?? 0) < 5);
  if (counted.length >= 3 && tiny.length / counted.length >= 0.5) {
    out.push({
      topic: "Taking projects past the first few commits",
      severity: round(tiny.length / counted.length),
      trend: "steady",
      occurrences: tiny.length,
      why: `${tiny.length} of ${counted.length} repositories have fewer than 5 commits.`,
    });
  }

  const years = s.contributionsByYear;
  const thisYear = now.getUTCFullYear();
  const last = years.find((y) => y.year === thisYear - 1);
  const prev = years.find((y) => y.year === thisYear - 2);
  const total = (y?: (typeof years)[number]) => (y ? y.commits + y.pullRequests + y.issues + y.reviews : 0);
  if (prev && total(prev) >= 20 && total(last) < total(prev) * 0.5) {
    out.push({
      topic: "Staying consistent",
      severity: round(1 - total(last) / total(prev)),
      trend: "rising",
      occurrences: 1,
      why: `Your GitHub activity dropped from ${total(prev)} contributions in ${thisYear - 2} to ${total(last)} in ${thisYear - 1}.`,
    });
  }

  if (!s.externalContributions.length && own.length >= 1) {
    out.push({
      topic: "Contributing to other projects",
      severity: 0.5,
      trend: "steady",
      occurrences: 0,
      why: "No pull requests to other people's repositories yet. Recruiters look for open-source work.",
    });
  }

  const noDesc = own.filter((r) => !r.description);
  if (own.length >= 3 && noDesc.length / own.length >= 0.5) {
    out.push({
      topic: "Describing your repositories",
      severity: round((noDesc.length / own.length) * 0.6),
      trend: "steady",
      occurrences: noDesc.length,
      why: `${noDesc.length} of ${own.length} repositories have no description.`,
    });
  }

  return out.sort((a, b) => b.severity - a.severity);
}

export function buildLevel(s: GitHubSnapshot, stats: GitHubStats, now: Date): DeveloperProfile["level"] {
  const years = (now.getTime() - +new Date(s.account.createdAt)) / (365.25 * 24 * 3600 * 1000);
  const { repos, stars, mergedExternalPRs } = stats.totals;
  // Strong outside recognition is enough on its own (and is all we can see in public mode).
  if (stars >= 500 || mergedExternalPRs >= 20) return "advanced";
  if (s.source === "public") {
    // No commit counts without a token — judge by repos, recognition and account age.
    if (repos < 3 && stars < 10 && mergedExternalPRs === 0) return "beginner";
    if (years >= 4 && (stars >= 50 || mergedExternalPRs >= 5)) return "advanced";
    return repos >= 5 || stars >= 10 || mergedExternalPRs > 0 ? "intermediate" : "beginner";
  }
  const contributions = stats.totals.commits + stats.totals.pullRequests;
  if (repos < 5 || contributions < 200) return "beginner";
  if (years >= 4 && contributions >= 2000 && (stars >= 50 || mergedExternalPRs >= 5)) return "advanced";
  return "intermediate";
}

function buildRecommendations(skills: ProfileSkill[], struggles: ProfileStruggle[], s: GitHubSnapshot): Recommendation[] {
  const out: Recommendation[] = [];
  const topics = new Set(struggles.map((x) => x.topic));
  if (topics.has("Contributing to other projects"))
    out.push({
      type: "contribute",
      title: "Make your first open-source pull request",
      reason: "Merged PRs to real projects are one of the strongest signals for recruiters.",
      href: "/github",
    });
  if (topics.has("Documenting projects")) {
    const r = s.repos.find((x) => x.isOwn && !x.isFork && x.hasReadme === false);
    out.push({
      type: "github",
      title: r ? `Add a README to ${r.name}` : "Add READMEs to your repositories",
      reason: "A README explains what the project does and how to run it. It is the first thing a visitor reads.",
      href: r ? `https://github.com/${r.owner}/${r.name}` : undefined,
    });
  }
  if (topics.has("Failing CI builds"))
    out.push({ type: "learn", title: "Learn to debug CI pipelines", reason: "Your recent GitHub Actions runs are failing.", href: "/learn" });
  const top = skills.find((x) => x.parent && x.id !== "open-source");
  if (top)
    out.push({
      type: "practice",
      title: `Practise problems in ${top.name}`,
      reason: `${top.name} is your strongest skill. Sharpen it with interview-style problems.`,
      href: "/practice",
    });
  out.push({
    type: "github",
    title: "Pin your best 6 repositories",
    reason: "Pinned repos are what recruiters see first on your GitHub profile.",
    href: `https://github.com/${s.account.login}`,
  });
  return out.slice(0, 5);
}

export function buildRulesProfile(s: GitHubSnapshot, evidence: Evidence[], now = new Date()): DeveloperProfile {
  const names = new Map<string, string>();
  for (const r of s.repos) for (const lang of Object.keys(r.languages)) names.set(languageSkill(lang).id, languageSkill(lang).name);
  const skills = buildSkills(evidence, names);
  const stats = buildStats(s);
  const struggles = buildStruggles(s, now);
  const level = buildLevel(s, stats, now);

  const primaryLanguages = stats.topLanguages.slice(0, 3).map((l) => l.name);
  const parentScore = new Map<string, number>();
  // Focus areas are technical areas; "Tools" (open source, etc.) is not one.
  for (const sk of skills) if (sk.parent && sk.parent !== "tools") parentScore.set(sk.parent, (parentScore.get(sk.parent) ?? 0) + sk.confidence);
  const focusAreas = [...parentScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => parentName(p));

  const since = new Date(s.account.createdAt).getUTCFullYear();
  const name = s.account.name || s.account.login;
  const summary =
    `${name} is a${level === "intermediate" || level === "advanced" ? "n" : ""} ${level} developer on GitHub since ${since}` +
    (primaryLanguages.length ? `, working mostly in ${list(primaryLanguages)}` : "") +
    (focusAreas.length ? ` (${list(focusAreas)})` : "") +
    `. ${fmt(stats.totals.repos)} own repositories` +
    (stats.totals.mergedExternalPRs ? `, ${fmt(stats.totals.mergedExternalPRs)} merged pull request${stats.totals.mergedExternalPRs === 1 ? "" : "s"} to other projects.` : ".") +
    (struggles[0] ? ` Biggest area to improve: ${struggles[0].topic.toLowerCase()}.` : "");

  const strengths: string[] = [];
  if (primaryLanguages.length) strengths.push(`Hands-on work in ${list(primaryLanguages)}`);
  if (stats.totals.mergedExternalPRs) strengths.push(`${fmt(stats.totals.mergedExternalPRs)} merged open-source pull requests`);
  if (stats.totals.stars >= 10) strengths.push(`${fmt(stats.totals.stars)} stars across your repositories`);
  const activeYears = s.contributionsByYear.filter((y) => y.commits + y.pullRequests > 0).length;
  if (activeYears >= 3) strengths.push(`Active on GitHub for ${activeYears} years`);
  if (!strengths.length) strengths.push("Getting started: every project you push builds your profile");

  return {
    summary,
    level,
    primaryLanguages,
    focusAreas,
    skills,
    struggles,
    growth: buildGrowth(evidence, skills, now.getUTCFullYear()),
    githubInsights: {
      strengths,
      gaps: struggles.map((x) => x.why),
      recruiterView:
        `A recruiter opening ${s.account.login}'s GitHub sees ${fmt(stats.totals.repos)} repositories` +
        (primaryLanguages.length ? ` mainly in ${list(primaryLanguages)}` : "") +
        `, ${fmt(stats.totals.stars)} stars and ${fmt(stats.totals.mergedExternalPRs)} merged contributions to other projects. ` +
        (struggles.length
          ? `The first thing to fix: ${struggles[0].topic.toLowerCase()}.`
          : "The profile looks well kept. Keep shipping and contributing."),
    },
    githubStats: stats,
    recommendations: buildRecommendations(skills, struggles, s),
    generatedBy: "rules",
    updatedAt: now.toISOString(),
  };
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}
