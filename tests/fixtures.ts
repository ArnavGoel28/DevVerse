import type { GitHubSnapshot } from "@/lib/types";

export const NOW = new Date("2026-11-13T00:00:00Z");

export function makeSnapshot(over: Partial<GitHubSnapshot> = {}): GitHubSnapshot {
  return {
    fetchedAt: NOW.toISOString(),
    source: "graphql",
    account: { login: "riya", name: "Riya", createdAt: "2021-03-01T00:00:00Z", followers: 4, publicRepos: 6 },
    contributionsByYear: [
      { year: 2022, commits: 120, pullRequests: 4, issues: 2, reviews: 0 },
      { year: 2023, commits: 300, pullRequests: 10, issues: 5, reviews: 3 },
      { year: 2024, commits: 400, pullRequests: 12, issues: 3, reviews: 6 },
      { year: 2025, commits: 90, pullRequests: 2, issues: 0, reviews: 0 },
    ],
    repos: [
      {
        name: "notes-api",
        owner: "riya",
        isFork: false,
        isOwn: true,
        stars: 12,
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 9000, JavaScript: 800, Dockerfile: 100 },
        topics: ["express", "nodejs", "rest-api"],
        hasReadme: true,
        description: "Notes REST API",
        createdAt: "2023-02-01T00:00:00Z",
        pushedAt: "2025-06-01T00:00:00Z",
        commitCount: 80,
      },
      {
        name: "portfolio",
        owner: "riya",
        isFork: false,
        isOwn: true,
        stars: 1,
        primaryLanguage: "TypeScript",
        languages: { TypeScript: 5000, CSS: 2000 },
        topics: ["react", "nextjs"],
        hasReadme: false,
        createdAt: "2024-01-10T00:00:00Z",
        pushedAt: "2025-01-01T00:00:00Z",
        commitCount: 30,
      },
      {
        name: "ml-homework",
        owner: "riya",
        isFork: false,
        isOwn: true,
        stars: 0,
        primaryLanguage: "Python",
        languages: { Python: 4000 },
        topics: [],
        hasReadme: false,
        createdAt: "2022-05-01T00:00:00Z",
        pushedAt: "2022-06-01T00:00:00Z",
        commitCount: 3,
      },
      {
        name: "react",
        owner: "facebook",
        isFork: true,
        isOwn: false,
        stars: 0,
        primaryLanguage: "JavaScript",
        languages: { JavaScript: 999999 },
        topics: [],
        hasReadme: true,
        createdAt: "2023-01-01T00:00:00Z",
        pushedAt: "2023-01-01T00:00:00Z",
      },
    ],
    externalContributions: [{ repo: "vercel/next.js", pullRequests: 2, merged: 1 }],
    failedWorkflowRuns: [
      { repo: "riya/notes-api", runId: 1, name: "CI", createdAt: "2026-11-01T00:00:00Z" },
      { repo: "riya/notes-api", runId: 2, name: "CI", createdAt: "2026-11-05T00:00:00Z" },
    ],
    ...over,
  };
}

/** A real Response, for mocked fetch calls. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => handler(String(url), init)) as typeof fetch;
}
