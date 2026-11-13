import { describe, expect, it } from "vitest";

import { buildIssueQuery, findIssues, issueLabel, issueLanguages } from "@/lib/github/issues";
import { jsonResponse, makeProfile, mockFetch } from "./fixtures";

const profile = makeProfile();

const item = (repo: string, n: number, extra: Record<string, unknown> = {}) => ({
  title: `Issue ${n} in ${repo}`,
  html_url: `https://github.com/${repo}/issues/${n}`,
  repository_url: `https://api.github.com/repos/${repo}`,
  labels: [{ name: "good first issue" }],
  comments: 1,
  created_at: "2026-11-01T00:00:00Z",
  ...extra,
});

describe("matching rules (GH-10)", () => {
  it("uses the top real programming languages", () => {
    expect(issueLanguages(profile)).toEqual(["TypeScript", "Python"]); // CSS skipped
    expect(issueLanguages(makeProfile({ githubStats: { ...profile.githubStats, topLanguages: [] } }))).toEqual(["JavaScript"]);
  });

  it("picks the label from the level and excludes the user's own repos", () => {
    expect(issueLabel(profile)).toBe("good first issue");
    expect(issueLabel({ ...profile, level: "advanced" })).toBe("help wanted");
    expect(buildIssueQuery("TypeScript", "good first issue", "riya")).toBe(
      'label:"good first issue" language:"TypeScript" state:open is:issue no:assignee archived:false -user:riya',
    );
  });
});

describe("findIssues", () => {
  it("interleaves languages, skips PRs and busy issues, max 2 per repo", async () => {
    const urls: string[] = [];
    const f = mockFetch((u) => {
      urls.push(u);
      if (decodeURIComponent(u).includes('language:"TypeScript"'))
        return jsonResponse({
          items: [
            item("a/ts", 1),
            item("a/ts", 2),
            item("a/ts", 3),
            item("b/ts", 4, { pull_request: {} }),
            item("c/ts", 5, { comments: 40 }),
          ],
        });
      return jsonResponse({ items: [item("p/py", 1, { comments: 0 })] });
    });
    const out = await findIssues(profile, "tok", f);
    expect(urls).toHaveLength(2);
    expect(out.map((i) => i.url)).toEqual([
      "https://github.com/a/ts/issues/1",
      "https://github.com/p/py/issues/1",
      "https://github.com/a/ts/issues/2",
    ]);
    expect(out[1].reason).toMatch(/no one has commented/);
    expect(out[0]).toMatchObject({ repo: "a/ts", language: "TypeScript" });
  });

  it("reports GitHub's search limit clearly", async () => {
    await expect(findIssues(profile, undefined, mockFetch(() => jsonResponse({}, 403)))).rejects.toMatchObject({ status: 429 });
  });
});
