import type { GitHubSnapshot } from "@/lib/types";

// GH-08: import a developer's entire GitHub history.
// - With a token: GitHub GraphQL — contributions for every year, repos, languages, PRs, failed workflow runs.
// - Without a token: public REST data only (used for the no-sign-in demo).
// `fetchImpl` is injectable so the logic can be unit-tested without the network.

type FetchLike = typeof fetch;

const API = "https://api.github.com";
const LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function isValidLogin(login: string): boolean {
  return LOGIN_RE.test(login);
}

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "devverse-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function rest<T>(path: string, token: string | undefined, fetchImpl: FetchLike): Promise<T> {
  const res = await fetchImpl(`${API}${path}`, { headers: headers(token) });
  if (!res.ok) {
    if (res.status === 404) throw new GitHubError("GitHub user not found.", 404);
    if (res.status === 403 || res.status === 429)
      throw new GitHubError("GitHub rate limit reached. Please try again in a few minutes.", 429);
    throw new GitHubError(`GitHub request failed (${res.status}).`, res.status);
  }
  return (await res.json()) as T;
}

async function graphql<T>(query: string, variables: Record<string, unknown>, token: string, fetchImpl: FetchLike): Promise<T> {
  const res = await fetchImpl(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new GitHubError("GitHub access expired. Please sign in again.", 401);
  if (!res.ok) throw new GitHubError(`GitHub request failed (${res.status}).`, res.status);
  const json = (await res.json()) as { data?: T; errors?: { message: string; type?: string }[] };
  if (json.errors?.length) {
    const notFound = json.errors.some((e) => e.type === "NOT_FOUND");
    throw new GitHubError(notFound ? "GitHub user not found." : json.errors[0].message, notFound ? 404 : 502);
  }
  if (!json.data) throw new GitHubError("Empty response from GitHub.", 502);
  return json.data;
}

// ---------- GraphQL (full history) ----------

const PROFILE_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl
      createdAt
      followers { totalCount }
      contributionsCollection { contributionYears }
      repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR], orderBy: { field: PUSHED_AT, direction: DESC }) {
        totalCount
        nodes {
          name
          owner { login }
          isFork
          isPrivate
          stargazerCount
          description
          createdAt
          pushedAt
          primaryLanguage { name }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
          repositoryTopics(first: 10) { nodes { topic { name } } }
          readmeUpper: object(expression: "HEAD:README.md") { id }
          readmeLower: object(expression: "HEAD:readme.md") { id }
          defaultBranchRef { target { ... on Commit { history { totalCount } } } }
        }
      }
      pullRequests(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes { merged repository { nameWithOwner owner { login } isPrivate } }
      }
    }
  }
`;

type GqlRepo = {
  name: string;
  owner: { login: string };
  isFork: boolean;
  isPrivate: boolean;
  stargazerCount: number;
  description: string | null;
  createdAt: string;
  pushedAt: string | null;
  primaryLanguage: { name: string } | null;
  languages: { edges: { size: number; node: { name: string } }[] };
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  readmeUpper: { id: string } | null;
  readmeLower: { id: string } | null;
  defaultBranchRef: { target: { history?: { totalCount: number } } | null } | null;
};

type GqlProfile = {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    createdAt: string;
    followers: { totalCount: number };
    contributionsCollection: { contributionYears: number[] };
    repositories: { totalCount: number; nodes: GqlRepo[] };
    pullRequests: {
      nodes: { merged: boolean; repository: { nameWithOwner: string; owner: { login: string }; isPrivate: boolean } }[];
    };
  } | null;
};

type GqlYear = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
};

/** Builds one query that fetches contribution totals for every year (GraphQL allows max 1 year per range). */
export function buildYearsQuery(years: number[]): string {
  const parts = years.map(
    (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions restrictedContributionsCount }`,
  );
  return `query ($login: String!) { user(login: $login) { ${parts.join("\n")} } }`;
}

export async function fetchHistoryWithToken(
  login: string,
  token: string,
  fetchImpl: FetchLike = fetch,
): Promise<GitHubSnapshot> {
  const data = await graphql<GqlProfile>(PROFILE_QUERY, { login }, token, fetchImpl);
  const u = data.user;
  if (!u) throw new GitHubError("GitHub user not found.", 404);

  const years = [...u.contributionsCollection.contributionYears].sort((a, b) => a - b);
  let contributionsByYear: GitHubSnapshot["contributionsByYear"] = [];
  if (years.length) {
    const yd = await graphql<{ user: Record<string, GqlYear> }>(buildYearsQuery(years), { login }, token, fetchImpl);
    contributionsByYear = years.map((year) => {
      const c = yd.user[`y${year}`];
      return {
        year,
        // Private contributions are counted as commits without details.
        commits: (c?.totalCommitContributions ?? 0) + (c?.restrictedContributionsCount ?? 0),
        pullRequests: c?.totalPullRequestContributions ?? 0,
        issues: c?.totalIssueContributions ?? 0,
        reviews: c?.totalPullRequestReviewContributions ?? 0,
      };
    });
  }

  const repos: GitHubSnapshot["repos"] = u.repositories.nodes.map((r) => ({
    name: r.name,
    owner: r.owner.login,
    isFork: r.isFork,
    isOwn: r.owner.login.toLowerCase() === u.login.toLowerCase(),
    stars: r.stargazerCount,
    primaryLanguage: r.primaryLanguage?.name,
    languages: Object.fromEntries(r.languages.edges.map((e) => [e.node.name, e.size])),
    topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
    hasReadme: Boolean(r.readmeUpper || r.readmeLower),
    description: r.description ?? undefined,
    createdAt: r.createdAt,
    pushedAt: r.pushedAt ?? r.createdAt,
    commitCount: r.defaultBranchRef?.target?.history?.totalCount,
  }));

  const external = new Map<string, { pullRequests: number; merged: number }>();
  for (const pr of u.pullRequests.nodes) {
    const repo = pr.repository;
    if (!repo || repo.isPrivate || repo.owner.login.toLowerCase() === u.login.toLowerCase()) continue;
    const e = external.get(repo.nameWithOwner) ?? { pullRequests: 0, merged: 0 };
    e.pullRequests += 1;
    if (pr.merged) e.merged += 1;
    external.set(repo.nameWithOwner, e);
  }

  // Failed CI runs on the 5 most recently pushed own repos (feeds DP-05 and the "struggles" list).
  const failedWorkflowRuns: GitHubSnapshot["failedWorkflowRuns"] = [];
  const recentOwn = repos.filter((r) => r.isOwn && !r.isFork).slice(0, 5);
  await Promise.all(
    recentOwn.map(async (r) => {
      try {
        const runs = await rest<{ workflow_runs: { id: number; name: string; created_at: string }[] }>(
          `/repos/${r.owner}/${r.name}/actions/runs?status=failure&per_page=5`,
          token,
          fetchImpl,
        );
        for (const w of runs.workflow_runs ?? [])
          failedWorkflowRuns.push({ repo: `${r.owner}/${r.name}`, runId: w.id, name: w.name, createdAt: w.created_at });
      } catch {
        // Actions may be disabled for the repo — not an error for the import.
      }
    }),
  );

  return {
    fetchedAt: new Date().toISOString(),
    source: "graphql",
    account: {
      login: u.login,
      name: u.name ?? undefined,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      followers: u.followers.totalCount,
      publicRepos: u.repositories.totalCount,
    },
    contributionsByYear,
    repos,
    externalContributions: [...external.entries()]
      .map(([repo, v]) => ({ repo, ...v }))
      .sort((a, b) => b.merged - a.merged || b.pullRequests - a.pullRequests),
    failedWorkflowRuns,
  };
}

// ---------- Public REST (no token; demo mode) ----------

type RestUser = { login: string; name: string | null; avatar_url: string; created_at: string; followers: number; public_repos: number };
type RestRepo = {
  name: string;
  owner: { login: string };
  fork: boolean;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  description: string | null;
  created_at: string;
  pushed_at: string | null;
  size: number;
};
type RestSearch = {
  items: { created_at: string; repository_url: string; pull_request?: { merged_at: string | null } }[];
};

/** Public data only — 3 requests, so it works within GitHub's unauthenticated limit. */
export async function fetchPublicHistory(
  login: string,
  fetchImpl: FetchLike = fetch,
  token?: string,
): Promise<GitHubSnapshot> {
  if (!isValidLogin(login)) throw new GitHubError("That doesn't look like a GitHub username.", 400);
  const user = await rest<RestUser>(`/users/${login}`, token, fetchImpl);
  const [repos, prs] = await Promise.all([
    rest<RestRepo[]>(`/users/${login}/repos?per_page=100&sort=pushed&type=owner`, token, fetchImpl),
    rest<RestSearch>(
      `/search/issues?q=${encodeURIComponent(`author:${login} type:pr`)}&per_page=100&sort=created`,
      token,
      fetchImpl,
    ).catch(() => ({ items: [] }) as RestSearch),
  ]);

  const byYear = new Map<number, { commits: number; pullRequests: number; issues: number; reviews: number }>();
  const bump = (iso: string | null, key: "commits" | "pullRequests") => {
    if (!iso) return;
    const y = new Date(iso).getUTCFullYear();
    const e = byYear.get(y) ?? { commits: 0, pullRequests: 0, issues: 0, reviews: 0 };
    e[key] += 1;
    byYear.set(y, e);
  };
  // Without a token there are no commit counts; a pushed/created repo counts as activity that year.
  for (const r of repos) {
    bump(r.created_at, "commits");
    if (r.pushed_at && new Date(r.pushed_at).getUTCFullYear() !== new Date(r.created_at).getUTCFullYear())
      bump(r.pushed_at, "commits");
  }
  const external = new Map<string, { pullRequests: number; merged: number }>();
  for (const pr of prs.items) {
    bump(pr.created_at, "pullRequests");
    const full = pr.repository_url.replace(`${API}/repos/`, "");
    if (full.split("/")[0].toLowerCase() === user.login.toLowerCase()) continue;
    const e = external.get(full) ?? { pullRequests: 0, merged: 0 };
    e.pullRequests += 1;
    if (pr.pull_request?.merged_at) e.merged += 1;
    external.set(full, e);
  }

  return {
    fetchedAt: new Date().toISOString(),
    source: "public",
    account: {
      login: user.login,
      name: user.name ?? undefined,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      followers: user.followers,
      publicRepos: user.public_repos,
    },
    contributionsByYear: [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, ...v })),
    repos: repos.map((r) => ({
      name: r.name,
      owner: r.owner.login,
      isFork: r.fork,
      isOwn: true,
      stars: r.stargazers_count,
      primaryLanguage: r.language ?? undefined,
      languages: r.language ? { [r.language]: Math.max(r.size, 1) } : {},
      topics: r.topics ?? [],
      description: r.description ?? undefined,
      createdAt: r.created_at,
      pushedAt: r.pushed_at ?? r.created_at,
    })),
    externalContributions: [...external.entries()]
      .map(([repo, v]) => ({ repo, ...v }))
      .sort((a, b) => b.merged - a.merged || b.pullRequests - a.pullRequests),
    failedWorkflowRuns: [],
  };
}
