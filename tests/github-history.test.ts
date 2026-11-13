import { describe, expect, it } from "vitest";

import { buildYearsQuery, fetchHistoryWithToken, fetchPublicHistory, GitHubError, isValidLogin } from "@/lib/github/history";
import { jsonResponse, mockFetch } from "./fixtures";

describe("isValidLogin", () => {
  it.each(["octocat", "a", "my-name", "A1-b2"])("accepts %s", (l) => expect(isValidLogin(l)).toBe(true));
  it.each(["", "-bad", "bad-", "a--b", "x".repeat(40), "../etc", "a b"])("rejects %j", (l) =>
    expect(isValidLogin(l)).toBe(false),
  );
});

describe("buildYearsQuery", () => {
  it("asks for one aliased range per year", () => {
    const q = buildYearsQuery([2023, 2024]);
    expect(q).toContain('y2023: contributionsCollection(from: "2023-01-01T00:00:00Z"');
    expect(q).toContain("y2024:");
  });
});

describe("fetchPublicHistory (demo, no token)", () => {
  it("builds a snapshot from 3 public requests", async () => {
    let calls = 0;
    const f = mockFetch((u) => {
      calls++;
      if (u.endsWith("/users/octo"))
        return jsonResponse({ login: "octo", name: "Octo", avatar_url: "a", created_at: "2020-01-01T00:00:00Z", followers: 3, public_repos: 2 });
      if (u.includes("/users/octo/repos"))
        return jsonResponse([
          {
            name: "app",
            owner: { login: "octo" },
            fork: false,
            stargazers_count: 5,
            language: "Go",
            topics: ["docker"],
            description: null,
            created_at: "2022-01-01T00:00:00Z",
            pushed_at: "2024-01-01T00:00:00Z",
            size: 100,
          },
        ]);
      if (u.includes("/search/issues"))
        return jsonResponse({
          items: [
            { created_at: "2024-03-01T00:00:00Z", repository_url: "https://api.github.com/repos/golang/go", pull_request: { merged_at: "2024-03-02T00:00:00Z" } },
            { created_at: "2024-04-01T00:00:00Z", repository_url: "https://api.github.com/repos/octo/app", pull_request: { merged_at: null } },
          ],
        });
      return jsonResponse({}, 404);
    });
    const s = await fetchPublicHistory("octo", f);
    expect(calls).toBe(3);
    expect(s.source).toBe("public");
    expect(s.repos[0].languages).toEqual({ Go: 100 });
    expect(s.repos[0].hasReadme).toBeUndefined();
    expect(s.externalContributions).toEqual([{ repo: "golang/go", pullRequests: 1, merged: 1 }]);
    expect(s.contributionsByYear.find((y) => y.year === 2024)).toMatchObject({ commits: 1, pullRequests: 2 });
  });

  it("reports unknown users and rate limits clearly", async () => {
    await expect(fetchPublicHistory("ghost", mockFetch(() => jsonResponse({}, 404)))).rejects.toMatchObject({ status: 404 });
    await expect(fetchPublicHistory("ghost", mockFetch(() => jsonResponse({}, 403)))).rejects.toMatchObject({ status: 429 });
    await expect(fetchPublicHistory("bad name", mockFetch(() => jsonResponse({})))).rejects.toBeInstanceOf(GitHubError);
  });
});

describe("fetchHistoryWithToken (GH-08, full history)", () => {
  it("combines profile, per-year contributions, OSS PRs and failed runs", async () => {
    const calls: string[] = [];
    const f = mockFetch((u, init) => {
      calls.push(u);
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      if (u.endsWith("/graphql")) {
        const { query } = JSON.parse(String(init!.body)) as { query: string };
        if (query.includes("y2024"))
          return jsonResponse({
            data: {
              user: {
                y2023: { totalCommitContributions: 10, totalPullRequestContributions: 1, totalIssueContributions: 0, totalPullRequestReviewContributions: 0, restrictedContributionsCount: 5 },
                y2024: { totalCommitContributions: 20, totalPullRequestContributions: 2, totalIssueContributions: 1, totalPullRequestReviewContributions: 1, restrictedContributionsCount: 0 },
              },
            },
          });
        return jsonResponse({
          data: {
            user: {
              login: "Riya",
              name: null,
              avatarUrl: "a",
              createdAt: "2021-01-01T00:00:00Z",
              followers: { totalCount: 2 },
              contributionsCollection: { contributionYears: [2024, 2023] },
              repositories: {
                totalCount: 1,
                nodes: [
                  {
                    name: "api",
                    owner: { login: "riya" },
                    isFork: false,
                    isPrivate: false,
                    stargazerCount: 3,
                    description: null,
                    createdAt: "2023-01-01T00:00:00Z",
                    pushedAt: "2024-01-01T00:00:00Z",
                    primaryLanguage: { name: "TypeScript" },
                    languages: { edges: [{ size: 10, node: { name: "TypeScript" } }] },
                    repositoryTopics: { nodes: [{ topic: { name: "express" } }] },
                    readmeUpper: null,
                    readmeLower: { id: "x" },
                    defaultBranchRef: { target: { history: { totalCount: 42 } } },
                  },
                ],
              },
              pullRequests: {
                nodes: [
                  { merged: true, repository: { nameWithOwner: "nodejs/node", owner: { login: "nodejs" }, isPrivate: false } },
                  { merged: false, repository: { nameWithOwner: "nodejs/node", owner: { login: "nodejs" }, isPrivate: false } },
                  { merged: true, repository: { nameWithOwner: "corp/secret", owner: { login: "corp" }, isPrivate: true } },
                  { merged: true, repository: { nameWithOwner: "riya/api", owner: { login: "riya" }, isPrivate: false } },
                ],
              },
            },
          },
        });
      }
      if (u.includes("/actions/runs")) return jsonResponse({ workflow_runs: [{ id: 9, name: "CI", created_at: "2024-02-01T00:00:00Z" }] });
      return jsonResponse({}, 404);
    });

    const s = await fetchHistoryWithToken("riya", "tok", f);
    expect(s.source).toBe("graphql");
    expect(s.contributionsByYear).toEqual([
      { year: 2023, commits: 15, pullRequests: 1, issues: 0, reviews: 0 },
      { year: 2024, commits: 20, pullRequests: 2, issues: 1, reviews: 1 },
    ]);
    expect(s.repos[0]).toMatchObject({ isOwn: true, hasReadme: true, commitCount: 42, topics: ["express"] });
    // private repos and own repos are not open-source contributions
    expect(s.externalContributions).toEqual([{ repo: "nodejs/node", pullRequests: 2, merged: 1 }]);
    expect(s.failedWorkflowRuns).toEqual([{ repo: "riya/api", runId: 9, name: "CI", createdAt: "2024-02-01T00:00:00Z" }]);
    expect(calls.some((c) => c.includes("/repos/riya/api/actions/runs"))).toBe(true);
  });

  it("maps an expired token to 401 and a missing user to 404", async () => {
    await expect(fetchHistoryWithToken("x", "t", mockFetch(() => jsonResponse({}, 401)))).rejects.toMatchObject({ status: 401 });
    await expect(
      fetchHistoryWithToken("x", "t", mockFetch(() => jsonResponse({ errors: [{ type: "NOT_FOUND", message: "nope" }] }))),
    ).rejects.toMatchObject({ status: 404 });
  });
});
