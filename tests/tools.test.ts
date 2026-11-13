import { describe, expect, it } from "vitest";

import { offlineExplain } from "@/lib/code/explain";
import { buildTree, isPreviewable, languageOf, parseRepo } from "@/lib/code/repo";
import { feed, forYouScore, normaliseTags, type Post, similarQuestions, timeAgo, toggleVote, validateDraft } from "@/lib/community/model";
import { seedPosts } from "@/lib/community/seed";
import { filterJobs, matchJob, SAMPLE_JOBS } from "@/lib/jobs/model";
import { buildCiPrompt, diagnose, formatDiagnosis } from "@/lib/ship/ci";
import { memberFromProfile, onboardingPath, sampleTeam, singlePoints, teamStack } from "@/lib/teams/model";
import type { DeveloperProfile, ProfileSkill } from "@/lib/types";

const NOW = Date.parse("2026-11-13T12:00:00Z");
const skill = (id: string, confidence: number, extra: Partial<ProfileSkill> = {}): ProfileSkill => ({ id, name: id, confidence, evidenceCount: 3, why: "", ...extra });
const profile = {
  level: "intermediate",
  skills: [skill("react", 0.8), skill("typescript", 0.7), skill("nodejs", 0.4), skill("python", 0.1, { userFeedback: "wrong" })],
  struggles: [{ topic: "Failing CI builds", severity: 0.6, trend: "steady", occurrences: 3, why: "" }],
  githubStats: { login: "riya" },
} as unknown as DeveloperProfile;

describe("Community model (CM-04/07/08)", () => {
  const posts = seedPosts(NOW);
  it("ranks For you by the user's skills and struggles", () => {
    const top = feed(posts, "for-you", profile, {}, NOW)[0];
    expect(top.tags.some((t) => ["react", "typescript", "ci-cd"].includes(t))).toBe(true);
    const py = posts.find((p) => p.tags.includes("python"))!;
    const reactPost = posts.find((p) => p.id === "s-env-vars")!;
    expect(forYouScore(reactPost, profile, NOW)).toBeGreaterThan(forYouScore(py, profile, NOW));
  });
  it("ignores skills the user marked wrong", () => {
    const py = posts.find((p) => p.tags.includes("python"))!;
    const trusted = { ...profile, skills: [...profile.skills.filter((s) => s.id !== "python"), skill("python", 0.1)] };
    expect(forYouScore(py, profile, NOW)).toBeLessThan(forYouScore(py, trusted, NOW));
  });
  it("filters unanswered questions and sorts top by score", () => {
    const un = feed(posts, "unanswered", profile, {}, NOW);
    expect(un.length).toBeGreaterThan(0);
    for (const p of un) expect(p.type === "question" && p.answers.length === 0).toBe(true);
    const top = feed(posts, "top", profile, {}, NOW);
    expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
  });
  it("filters by type, tag and search text", () => {
    expect(feed(posts, "newest", profile, { type: "article" }, NOW).every((p) => p.type === "article")).toBe(true);
    expect(feed(posts, "newest", profile, { tag: "docker" }, NOW).every((p) => p.tags.includes("docker"))).toBe(true);
    expect(feed(posts, "newest", profile, { query: "lockfile" }, NOW)).toHaveLength(1);
  });
  it("finds similar questions while writing", () => {
    expect(similarQuestions(posts, "process.env undefined in Next.js client component")[0]?.id).toBe("s-env-vars");
    expect(similarQuestions(posts, "hi")).toEqual([]);
  });
  it("validates drafts and normalises tags", () => {
    expect(validateDraft({ type: "question", title: "short", body: "x", tags: [] })).toMatchObject({ title: expect.any(String), body: expect.any(String), tags: expect.any(String) });
    expect(validateDraft({ type: "showcase", title: "A long enough title", body: "Twenty characters of body text", tags: ["react"], url: "http://x" })).toHaveProperty("url");
    expect(validateDraft({ type: "question", title: "A long enough title", body: "Twenty characters of body text", tags: ["react"] })).toEqual({});
    expect(normaliseTags("React, react  Node.js,<b>,a,b,c,d")).toEqual(["react", "node.js", "b", "a", "c"]);
  });
  it("toggles votes and formats time", () => {
    expect(toggleVote(false)).toEqual({ delta: 1, voted: true });
    expect(toggleVote(true)).toEqual({ delta: -1, voted: false });
    expect(timeAgo(new Date(NOW - 5 * 3600_000).toISOString(), NOW)).toBe("5h ago");
  });
  it("seed posts are labelled samples with valid accepted answers", () => {
    for (const p of posts as Post[]) {
      expect(p.sample).toBe(true);
      if (p.acceptedAnswerId) expect(p.answers.some((a) => a.id === p.acceptedAnswerId)).toBe(true);
    }
  });
});

describe("Jobs matching (JB-01)", () => {
  it("scores higher where proven skills match and lists gaps", () => {
    const fe = matchJob(SAMPLE_JOBS.find((j) => j.id === "j1")!, profile);
    const ml = matchJob(SAMPLE_JOBS.find((j) => j.id === "j3")!, profile);
    expect(fe.percent).toBeGreaterThan(ml.percent);
    expect(fe.have).toEqual(expect.arrayContaining(["react", "typescript"]));
    expect(ml.gaps).toContain("python"); // marked wrong → treated as not proven
  });
  it("filters and sorts by match", () => {
    const all = filterJobs(SAMPLE_JOBS, profile, {});
    expect(all[0].match.percent).toBeGreaterThanOrEqual(all.at(-1)!.match.percent);
    expect(filterJobs(SAMPLE_JOBS, profile, { workplace: "remote" }).every((r) => r.job.workplace === "remote")).toBe(true);
    expect(filterJobs(SAMPLE_JOBS, profile, { minMatch: 101 })).toEqual([]);
  });
});

describe("Teams (TM-01/02)", () => {
  const team = sampleTeam(memberFromProfile(profile));
  it("builds the stack, risks and onboarding path", () => {
    const stack = teamStack(team);
    expect(stack).toContain("react");
    expect(singlePoints(team, ["gcp"])).toEqual([{ skill: "gcp", owner: "priya.s" }]);
    const newbie = team.members.find((m) => m.role === "New joiner")!;
    const path = onboardingPath(team, newbie, stack);
    expect(path.length).toBeGreaterThan(0);
    for (const p of path) expect(p.current).toBeLessThan(0.5);
  });
  it("excludes skills the user marked wrong from their member card", () => {
    expect(memberFromProfile(profile).skills.python).toBeUndefined();
  });
});

describe("Code tool (WS-01, AI-03)", () => {
  it("parses repo input", () => {
    expect(parseRepo("vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js" });
    expect(parseRepo("https://github.com/octocat/Hello-World.git")).toEqual({ owner: "octocat", repo: "Hello-World" });
    expect(parseRepo("github.com/a/b/tree/main/src")).toEqual({ owner: "a", repo: "b" });
    expect(parseRepo("not a repo")).toBeNull();
  });
  it("builds a folders-first tree", () => {
    const t = buildTree([{ path: "src/b.ts", size: 1 }, { path: "README.md", size: 1 }, { path: "src/a.ts", size: 1 }]);
    expect(t.map((n) => n.name)).toEqual(["src", "README.md"]);
    expect(t[0].children!.map((n) => n.name)).toEqual(["a.ts", "b.ts"]);
  });
  it("detects languages and previewable files", () => {
    expect(languageOf("app/page.tsx")).toBe("typescript");
    expect(languageOf("Dockerfile")).toBe("dockerfile");
    expect(isPreviewable("logo.png", 10)).toBe(false);
    expect(isPreviewable("big.ts", 999_999)).toBe(false);
  });
  it("summarises code offline", () => {
    const s = offlineExplain("src/util.ts", "import x from 'y';\nexport function add(a, b) { return a + b; }\nclass Box {}\n// TODO: tests", "typescript");
    expect(s).toContain("`add`");
    expect(s).toContain("`Box`");
    expect(s).toContain("TODO");
  });
});

describe("Ship CI diagnosis (DP-05)", () => {
  it("maps failed steps to likely causes", () => {
    expect(diagnose([{ job: "build", step: "Run npm ci" }], "CI").cause).toMatch(/dependencies/i);
    expect(diagnose([{ job: "test", step: "Run vitest" }], "CI").cause).toMatch(/Tests failed/);
    expect(diagnose([{ job: "deploy", step: "Deploy to Firebase" }], "Release").struggle).toMatch(/secrets/i);
    expect(diagnose([], "CI").cause).toMatch(/no individual step/);
    expect(diagnose([{ job: "x", step: "Mystery step" }], "Y").cause).toContain("Mystery step");
  });
  it("formats a diagnosis and builds a prompt with steps as data", () => {
    expect(formatDiagnosis(diagnose([{ job: "b", step: "npm ci" }], "CI"))).toMatch(/\*\*How to fix it:\*\*\n1\./);
    expect(buildCiPrompt("a/b", "CI", [{ job: "j", step: "s" }])).toContain('step "s"');
  });
});

describe("Home profile strength (docs/12 §1)", () => {
  it("counts only real progress and shows the next steps", async () => {
    const { profileStrength, greeting } = await import("@/lib/home/strength");
    const p = { ...profile, githubInsights: { strengths: [], gaps: ["No READMEs"], recruiterView: "" }, githubStats: { login: "riya", totals: { mergedExternalPRs: 0 } } } as unknown as DeveloperProfile;
    const fresh = profileStrength(p, { solved: 0, posts: 0 });
    expect(fresh.score).toBe(30); // import only (endowed progress) — 2 strong skills is below the 3 needed
    expect(fresh.level).toBe("Starter");
    expect(fresh.next).toHaveLength(3);
    const busy = profileStrength(p, { solved: 5, posts: 1 });
    expect(busy.score).toBe(65);
    expect(busy.level).toBe("Rising");
    expect(busy.nextLevelAt).toBe(70);
    expect(greeting(9)).toBe("Good morning");
    expect(greeting(20)).toBe("Good evening");
  });
});
