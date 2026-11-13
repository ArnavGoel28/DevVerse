import { GitHubError } from "@/lib/github/history";
import type { DeveloperProfile, OssIssue } from "@/lib/types";

// GH-10: open issues in public projects that match the user's skills and level.
// Uses GitHub issue search — no AI needed, so it always works.

type FetchLike = typeof fetch;

/** Languages that are rarely the "main" language of a good first issue. */
const SKIP = new Set(["HTML", "CSS", "SCSS", "Shell", "Dockerfile", "Makefile", "Jupyter Notebook", "PowerShell", "Batchfile"]);

export function issueLanguages(p: DeveloperProfile): string[] {
  const langs = p.githubStats.topLanguages.map((l) => l.name).filter((l) => !SKIP.has(l));
  return (langs.length ? langs : ["JavaScript"]).slice(0, 2);
}

export function issueLabel(p: DeveloperProfile): string {
  return p.level === "advanced" ? "help wanted" : "good first issue";
}

export function buildIssueQuery(language: string, label: string, login: string): string {
  return `label:"${label}" language:"${language}" state:open is:issue no:assignee archived:false -user:${login}`;
}

type SearchItem = {
  title: string;
  html_url: string;
  repository_url: string;
  labels: { name: string }[];
  comments: number;
  created_at: string;
  pull_request?: unknown;
};

export async function findIssues(p: DeveloperProfile, token: string | undefined, fetchImpl: FetchLike = fetch): Promise<OssIssue[]> {
  const label = issueLabel(p);
  const langs = issueLanguages(p);
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "devverse-app" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const lists = await Promise.all(
    langs.map(async (language) => {
      const q = encodeURIComponent(buildIssueQuery(language, label, p.githubStats.login));
      const res = await fetchImpl(`https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=20`, { headers });
      if (res.status === 403 || res.status === 429) throw new GitHubError("GitHub search limit reached. Try again in a minute.", 429);
      if (!res.ok) throw new GitHubError(`GitHub search failed (${res.status}).`, 502);
      const body = (await res.json()) as { items?: SearchItem[] };
      return (body.items ?? []).map((i) => ({ i, language }));
    }),
  );

  const perRepo = new Map<string, number>();
  const out: OssIssue[] = [];
  // Interleave languages so both show up.
  const max = Math.max(...lists.map((l) => l.length), 0);
  for (let k = 0; k < max; k++) {
    for (const list of lists) {
      const item = list[k];
      if (!item || item.i.pull_request || item.i.comments > 10) continue; // busy issues are probably taken
      const repo = item.i.repository_url.replace("https://api.github.com/repos/", "");
      if ((perRepo.get(repo) ?? 0) >= 2) continue;
      perRepo.set(repo, (perRepo.get(repo) ?? 0) + 1);
      out.push({
        title: item.i.title.slice(0, 200),
        url: item.i.html_url,
        repo,
        labels: item.i.labels.map((l) => l.name).slice(0, 5),
        comments: item.i.comments,
        createdAt: item.i.created_at,
        language: item.language,
        reason:
          `Uses ${item.language}, one of your strongest languages` +
          (label === "good first issue" ? " · labelled beginner-friendly" : " · maintainers want help") +
          (item.i.comments === 0 ? " · no one has commented yet" : ""),
      });
    }
  }
  return out.slice(0, 10);
}
