"use client";

import { ExternalLink, GitPullRequest, Star } from "@/components/icons";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_COLORS } from "@/components/profile/profile-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeveloperProfile } from "@/lib/types";

// GH-09: the user's GitHub as a recruiter sees it.

export function GitHubInsights({ profile }: { profile: DeveloperProfile }) {
  const s = profile.githubStats;
  const i = profile.githubInsights;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>What a recruiter sees</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed">{i.recruiterView}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <List title="Strengths" items={i.strengths} tone="good" />
            <List title="Gaps to fix" items={i.gaps} tone="bad" empty="No obvious gaps." />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Contributions by year</CardTitle>
            <CardDescription>
              {s.source === "public"
                ? "Public data only: repositories created/updated and pull requests per year."
                : "Commits, pull requests, issues and reviews across your whole history."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.contributionsByYear.length ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.contributionsByYear} margin={{ left: -12, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="commits" name={s.source === "public" ? "repo activity" : "commits"} stackId="a" fill={CHART_COLORS[0]} />
                    <Bar dataKey="pullRequests" name="pull requests" stackId="a" fill={CHART_COLORS[1]} />
                    {s.source !== "public" && <Bar dataKey="issues" name="issues" stackId="a" fill={CHART_COLORS[2]} />}
                    {s.source !== "public" && (
                      <Bar dataKey="reviews" name="reviews" stackId="a" fill={CHART_COLORS[3]} radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contributions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top languages</CardTitle>
            <CardDescription>Share of code across your own repositories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!s.topLanguages.length && <p className="text-sm text-muted-foreground">No languages detected.</p>}
            {s.topLanguages.map((l, idx) => (
              <div key={l.name} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{l.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{(l.share * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-muted" aria-hidden>
                  <div className="h-full" style={{ width: `${Math.max(2, l.share * 100)}%`, background: CHART_COLORS[idx % 5] }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most notable repositories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!s.topRepos.length && <p className="text-sm text-muted-foreground">No repositories yet.</p>}
            {s.topRepos.map((r) => (
              <a
                key={`${r.owner}/${r.name}`}
                href={`https://github.com/${r.owner}/${r.name}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-0.5 rounded-md border px-3 py-2 hover:bg-muted/60"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{r.name}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3.5" /> {r.stars}
                  </span>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {[r.language, r.description].filter(Boolean).join(" · ") || "No description"}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open-source contributions</CardTitle>
            <CardDescription>Pull requests to other people&apos;s projects.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!s.externalContributions.length && (
              <p className="text-sm text-muted-foreground">
                None yet. Open-source matching (GH-10) will suggest beginner-friendly issues for your skills.
              </p>
            )}
            {s.externalContributions.map((c) => (
              <a
                key={c.repo}
                href={`https://github.com/${c.repo}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
              >
                <GitPullRequest className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{c.repo}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {c.merged}/{c.pullRequests} merged
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function List({ title, items, tone, empty }: { title: string; items: string[]; tone: "good" | "bad"; empty?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {!items.length && empty && <p className="text-sm text-muted-foreground">{empty}</p>}
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm">
            <span className={tone === "good" ? "text-primary" : "text-destructive"}>{tone === "good" ? "✓" : "•"}</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
