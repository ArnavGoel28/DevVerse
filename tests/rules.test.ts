import { describe, expect, it } from "vitest";

import { snapshotToEvidence } from "@/lib/profile/evidence";
import { buildLevel, buildRulesProfile, buildStats, buildStruggles, confidenceFromScore } from "@/lib/profile/rules";
import { makeSnapshot, NOW } from "./fixtures";

describe("confidenceFromScore", () => {
  it("is 0 with no evidence, grows, and never reaches 100%", () => {
    expect(confidenceFromScore(0)).toBe(0);
    expect(confidenceFromScore(1)).toBeLessThan(confidenceFromScore(5));
    expect(confidenceFromScore(1000)).toBe(0.95);
  });
});

describe("buildRulesProfile (DI-01..DI-09, GH-09)", () => {
  const snap = makeSnapshot();
  const p = buildRulesProfile(snap, snapshotToEvidence(snap), NOW);

  it("ranks TypeScript as the top skill and explains why (DI-06)", () => {
    expect(p.skills[0].id).toBe("typescript");
    expect(p.skills[0].why).toMatch(/notes-api|portfolio/);
    for (const s of p.skills) {
      expect(s.confidence).toBeGreaterThan(0);
      expect(s.confidence).toBeLessThanOrEqual(0.95);
    }
  });

  it("builds a growth timeline per year up to now (DI-04)", () => {
    expect(p.growth[0].period).toBe("2022");
    expect(p.growth.at(-1)!.period).toBe("2026");
    const ts = p.growth.map((g) => g.skills.typescript);
    expect(ts[0]).toBe(0); // no TypeScript repo before 2023
    expect(ts.at(-1)!).toBeGreaterThan(ts[1]); // grows over time
  });

  it("computes stats without forks", () => {
    expect(p.githubStats.totals.repos).toBe(3);
    expect(p.githubStats.totals.stars).toBe(13);
    expect(p.githubStats.totals.mergedExternalPRs).toBe(1);
    expect(p.githubStats.topLanguages[0].name).toBe("TypeScript");
    expect(p.githubStats.topLanguages.reduce((a, l) => a + l.share, 0)).toBeCloseTo(1, 1);
  });

  it("keeps GitHub's spelling for unknown languages and never lists Tools as a focus area", () => {
    const base = makeSnapshot();
    const s2 = makeSnapshot({ repos: [{ ...base.repos[2], languages: { OpenSCAD: 100 } }] });
    const p2 = buildRulesProfile(s2, snapshotToEvidence(s2), NOW);
    expect(p2.skills.map((k) => k.name)).toContain("OpenSCAD");
    expect(p.focusAreas).not.toContain("Tools");
    expect(p.focusAreas[0]).toBe("Frontend");
  });

  it("writes a summary, insights and recommendations", () => {
    expect(p.summary).toContain("Riya");
    expect(p.summary).toContain("TypeScript");
    expect(p.githubInsights.recruiterView.length).toBeGreaterThan(20);
    expect(p.recommendations.length).toBeGreaterThan(0);
    expect(p.generatedBy).toBe("rules");
  });
});

describe("buildStruggles (DI-03)", () => {
  it("finds missing READMEs, failing CI and an activity drop", () => {
    const topics = buildStruggles(makeSnapshot(), NOW).map((s) => s.topic);
    expect(topics).toContain("Documenting projects");
    expect(topics).toContain("Failing CI builds");
    expect(topics).toContain("Staying consistent"); // 2024: 421 -> 2025: 92
    expect(topics).not.toContain("Contributing to other projects"); // has an OSS PR
  });

  it("marks recent CI failures as rising", () => {
    const ci = buildStruggles(makeSnapshot(), NOW).find((s) => s.topic === "Failing CI builds")!;
    expect(ci.trend).toBe("rising");
    expect(ci.occurrences).toBe(2);
  });

  it("flags no open-source work when there is none", () => {
    const topics = buildStruggles(makeSnapshot({ externalContributions: [] }), NOW).map((s) => s.topic);
    expect(topics).toContain("Contributing to other projects");
  });

  it("does not guess about READMEs when unknown (public mode)", () => {
    const snap = makeSnapshot();
    snap.repos = snap.repos.map((r) => ({ ...r, hasReadme: undefined }));
    expect(buildStruggles(snap, NOW).map((s) => s.topic)).not.toContain("Documenting projects");
  });
});

describe("buildLevel", () => {
  it("is beginner for a tiny account", () => {
    const snap = makeSnapshot({ repos: makeSnapshot().repos.slice(0, 1) });
    expect(buildLevel(snap, buildStats(snap), NOW)).toBe("beginner");
  });

  it("judges public-only data by recognition, not missing commit counts", () => {
    // Regression: a famous account looked like a "beginner" because public mode has no commits.
    const base = makeSnapshot();
    const famous = makeSnapshot({
      source: "public",
      contributionsByYear: [{ year: 2025, commits: 3, pullRequests: 5, issues: 0, reviews: 0 }],
      repos: base.repos.slice(0, 2).map((r) => ({ ...r, stars: 5000, commitCount: undefined, hasReadme: undefined })),
      externalContributions: [{ repo: "x/y", pullRequests: 80, merged: 70 }],
    });
    expect(buildLevel(famous, buildStats(famous), NOW)).toBe("advanced");
    const newbie = makeSnapshot({ source: "public", repos: [{ ...base.repos[2], stars: 0 }], externalContributions: [] });
    expect(buildLevel(newbie, buildStats(newbie), NOW)).toBe("beginner");
  });

  it("is advanced for a long, busy, recognised account", () => {
    const base = makeSnapshot();
    const snap = makeSnapshot({
      account: { ...base.account, createdAt: "2015-01-01T00:00:00Z" },
      contributionsByYear: [{ year: 2025, commits: 3000, pullRequests: 100, issues: 0, reviews: 0 }],
      repos: Array.from({ length: 6 }, (_, i) => ({ ...base.repos[0], name: `r${i}`, stars: 20 })),
    });
    expect(buildLevel(snap, buildStats(snap), NOW)).toBe("advanced");
  });
});
