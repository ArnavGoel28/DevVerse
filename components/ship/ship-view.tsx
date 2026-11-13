"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, ExternalLink, GitBranch, Loader2, XCircle } from "@/components/icons";

import { type ApiAuth, apiJson } from "@/components/api";
import { timeAgoShort } from "@/components/ship/time";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { parseRepo, type RepoRef } from "@/lib/code/repo";
import { failedSteps, fetchJobs, fetchRuns, type Job, type Run } from "@/lib/ship/ci";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusIcon({ status, conclusion, className }: { status: string; conclusion: string | null; className?: string }) {
  if (status !== "completed") return <CircleDashed className={cn("size-4 animate-spin text-highlight", className)} aria-label="In progress" />;
  if (conclusion === "success") return <CheckCircle2 className={cn("size-4 text-success", className)} aria-label="Succeeded" />;
  if (conclusion === "failure" || conclusion === "timed_out") return <XCircle className={cn("size-4 text-destructive", className)} aria-label="Failed" />;
  return <CircleDashed className={cn("size-4 text-muted-foreground", className)} aria-label={conclusion ?? "Unknown"} />;
}

// DP-05 (+ DP-01 preview): GitHub Actions-style runs with the DevOps & Debug agent.
export function ShipView({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  const suggestions = profile.githubStats.topRepos.slice(0, 6).map((r) => `${r.owner}/${r.name}`);
  const [input, setInput] = useState(suggestions[0] ?? "");
  const [ref, setRef] = useState<RepoRef | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [selected, setSelected] = useState<Run | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState<"runs" | "jobs" | "explain" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explain, setExplain] = useState<{ text: string; mode: string } | null>(null);
  const [now] = useState(() => Date.now());

  const load = async (value = input) => {
    const parsed = parseRepo(value);
    if (!parsed) return setError("Enter a repository like owner/name.");
    setLoading("runs");
    setError(null);
    setSelected(null);
    setJobs(null);
    setExplain(null);
    try {
      setRuns(await fetchRuns(parsed));
      setRef(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load workflow runs.");
      setRuns(null);
    }
    setLoading(null);
  };

  const openRun = async (r: Run) => {
    if (!ref) return;
    setSelected(r);
    setJobs(null);
    setExplain(null);
    setLoading("jobs");
    try {
      setJobs(await fetchJobs(ref, r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the run's jobs.");
    }
    setLoading(null);
  };

  const runExplain = async () => {
    if (!ref || !selected || !jobs) return;
    setLoading("explain");
    try {
      setExplain(await apiJson<{ text: string; mode: string }>("/api/ship/explain", auth, { body: { repo: `${ref.owner}/${ref.repo}`, workflow: selected.name, steps: failedSteps(jobs) } }));
    } catch (e) {
      setExplain({ text: e instanceof Error ? e.message : "Couldn't explain this run.", mode: "error" });
    }
    setLoading(null);
  };

  const failed = runs?.filter((r) => r.conclusion === "failure").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="flex flex-col gap-2 rounded-md border bg-card p-4">
          <label className="text-sm font-semibold" htmlFor="ship-repo">Repository</label>
          <div className="flex gap-2">
            <input id="ship-repo" value={input} onChange={(e) => setInput(e.target.value)} name="repo" autoComplete="off" spellCheck={false} placeholder="owner/repo, e.g. vercel/next.js…" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
            <Button type="submit" disabled={loading === "runs"}>{loading === "runs" && <Loader2 className="animate-spin" />} Load Runs</Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {suggestions.map((s) => <button type="button" key={s} onClick={() => { setInput(s); void load(s); }} className="rounded-md border px-2 py-0.5 hover:bg-muted">{s}</button>)}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>

      {runs && (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-md border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
              <span className="font-semibold">Workflow runs</span>
              <span className="text-xs text-muted-foreground">{runs.length} recent · {failed} failed</span>
            </div>
            {runs.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No GitHub Actions runs in this repo. Add a workflow in <code>.github/workflows/</code> to get CI checks on every push.</p>
            ) : (
              <ul>
                {runs.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => void openRun(r)} className={cn("flex w-full items-center gap-3 border-b px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted", selected?.id === r.id && "bg-muted")}>
                      <StatusIcon status={r.status} conclusion={r.conclusion} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground"><GitBranch className="size-3" />{r.branch} · {r.event} · {r.sha}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgoShort(r.createdAt, now)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="rounded-md border bg-card p-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a run to see its jobs and steps.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <StatusIcon status={selected.status} conclusion={selected.conclusion} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{selected.name}</p>
                    <a href={selected.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View on GitHub <ExternalLink className="size-3" /></a>
                  </div>
                </div>
                {loading === "jobs" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading jobs…</p>}
                {jobs?.map((j) => (
                  <div key={j.id} className="rounded-md border">
                    <p className="flex items-center gap-2 border-b px-3 py-1.5 text-sm font-medium"><StatusIcon status={j.status} conclusion={j.conclusion} /> {j.name}</p>
                    <ol className="px-3 py-1.5 text-xs">
                      {j.steps.map((s) => (
                        <li key={s.number} className={cn("flex items-center gap-2 py-0.5", s.conclusion === "failure" && "font-medium text-destructive")}>
                          <StatusIcon status={s.status} conclusion={s.conclusion} className="size-3.5" /> {s.name}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                {jobs && selected.conclusion === "failure" && (
                  <Button onClick={runExplain} disabled={loading === "explain"}>
                    {loading === "explain" ? <Loader2 className="animate-spin" /> : null} Explain This Failure
                  </Button>
                )}
                {jobs && selected.conclusion === "success" && <p className="text-sm text-success">All green. Nothing to fix here.</p>}
                {explain && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">DevOps & Debug agent</p>
                    <Markdown>{explain.text}</Markdown>
                    {explain.mode !== "gemini" && explain.mode !== "error" && <p className="mt-2 text-xs text-muted-foreground">(offline rules; AI explanations need the Gemini key)</p>}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
