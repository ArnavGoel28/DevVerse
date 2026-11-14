"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { type ApiAuth, apiJson } from "@/components/api";
import { ArrowLeft, Calendar, CheckCircle2, CircleDashed, ExternalLink, GitBranch, Loader2, Timer, XCircle } from "@/components/icons";
import { timeAgoShort } from "@/components/ship/time";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseRepo } from "@/lib/code/repo";
import { failedSteps, fetchJobs, fetchRuns, formatDuration, type Job, type Run } from "@/lib/ship/ci";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusIcon({ status, conclusion, className }: { status: string; conclusion: string | null; className?: string }) {
  if (status !== "completed") return <CircleDashed className={cn("size-4 shrink-0 animate-spin text-highlight", className)} aria-label="In progress" />;
  if (conclusion === "success") return <CheckCircle2 className={cn("size-4 shrink-0 text-success", className)} weight="fill" aria-label="Succeeded" />;
  if (conclusion === "failure" || conclusion === "timed_out") return <XCircle className={cn("size-4 shrink-0 text-destructive", className)} weight="fill" aria-label="Failed" />;
  return <CircleDashed className={cn("size-4 shrink-0 text-muted-foreground", className)} aria-label={conclusion ?? "Unknown"} />;
}

const EVENT: Record<string, string> = { push: "Commit", pull_request: "Pull request", pull_request_target: "Pull request", schedule: "Scheduled", workflow_dispatch: "Manually run", workflow_run: "After another workflow", release: "Release" };

// DP-05: the GitHub Actions layout (workflows sidebar, run list, run page with jobs and steps) plus the DevOps & Debug agent.
// Repo, workflow, run and job live in the URL so a failing run can be linked (web interface guidelines).
export function ShipView({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  const params = useSearchParams();
  const router = useRouter();
  const suggestions = profile.githubStats.topRepos.slice(0, 6).map((r) => `${r.owner}/${r.name}`);
  const repo = params.get("repo");
  const workflow = params.get("workflow");
  const runId = Number(params.get("run")) || null;
  const [input, setInput] = useState(repo ?? suggestions[0] ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [runsData, setRunsData] = useState<{ repo: string; runs?: Run[]; error?: string } | null>(null);
  const [now] = useState(() => Date.now());

  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/deploy${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    const ref = repo ? parseRepo(repo) : null;
    if (!ref || !repo) return;
    let live = true;
    fetchRuns(ref)
      .then((runs) => live && setRunsData({ repo, runs }))
      .catch((e) => live && setRunsData({ repo, error: e instanceof Error ? e.message : "Couldn't load workflow runs. Try again in a minute." }));
    return () => {
      live = false;
    };
  }, [repo]);

  const submit = (value = input) => {
    const ref = parseRepo(value);
    if (!ref) return setFormError("Enter a repository like owner/name, for example vercel/next.js.");
    setFormError(null);
    router.push(`/deploy?repo=${ref.owner}/${ref.repo}`, { scroll: false });
  };

  const current = runsData?.repo === repo ? runsData : null;
  const loadingRuns = !!repo && !current;
  const runs = current?.runs ?? [];
  const workflows = [...new Set(runs.map((r) => r.name))];
  const shown = workflow ? runs.filter((r) => r.name === workflow) : runs;
  const selected = runId ? runs.find((r) => r.id === runId) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-2 rounded-md border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium" htmlFor="ship-repo">Repository</label>
          <input id="ship-repo" value={input} onChange={(e) => setInput(e.target.value)} name="repo" autoComplete="off" spellCheck={false} placeholder="owner/repo, e.g. vercel/next.js…" className="h-9 min-w-48 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm" />
          <Button type="submit" disabled={loadingRuns}>{loadingRuns && <Loader2 className="animate-spin" />} {loadingRuns ? "Loading…" : "Load Runs"}</Button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {suggestions.map((s) => <button type="button" key={s} onClick={() => { setInput(s); submit(s); }} className="rounded-sm border px-2 py-0.5 font-mono hover:border-primary/50 hover:text-primary">{s}</button>)}
          </div>
        )}
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      </form>

      {loadingRuns && <RunsSkeleton />}
      {current?.error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{current.error}</p>}

      {current?.runs && repo && (
        selected ? (
          <RunPage key={selected.id} auth={auth} repo={repo} run={selected} jobParam={Number(params.get("job")) || null} now={now} onJob={(id) => go({ job: String(id) })} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="Workflows" className="flex flex-col gap-0.5 text-sm">
              <p className="px-2 pb-1 font-semibold">Actions</p>
              <button type="button" onClick={() => go({ workflow: null, run: null, job: null })} aria-current={!workflow ? "page" : undefined} className={cn("rounded-md px-2 py-1.5 text-left hover:bg-accent", !workflow && "bg-accent font-medium")}>All workflows</button>
              {workflows.map((w) => (
                <button key={w} type="button" onClick={() => go({ workflow: w, run: null, job: null })} aria-current={workflow === w ? "page" : undefined} className={cn("truncate rounded-md px-2 py-1.5 text-left hover:bg-accent", workflow === w && "bg-accent font-medium")}>{w}</button>
              ))}
            </nav>

            <section className="min-w-0">
              <h2 className="mb-3 text-xl font-semibold">{workflow ?? "All workflows"}</h2>
              <div className="overflow-hidden rounded-md border bg-card">
                <p className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold tabular-nums">{shown.length} workflow {shown.length === 1 ? "run" : "runs"}</p>
                {shown.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No GitHub Actions runs in this repo. Add a workflow in <code>.github/workflows/</code> to get CI checks on every push.</p>
                ) : (
                  <ul>
                    {shown.map((r) => (
                      <li key={r.id} className="border-b last:border-b-0">
                        <Link href={`/deploy?repo=${repo}${workflow ? `&workflow=${encodeURIComponent(workflow)}` : ""}&run=${r.id}`} scroll={false} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50">
                          <StatusIcon status={r.status} conclusion={r.conclusion} className="mt-0.5" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{r.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              <b className="font-medium text-foreground/80">{r.name}</b> #{r.runNumber}: {EVENT[r.event] ?? r.event} <span translate="no" className="font-mono">{r.sha}</span>{r.actor && <> by {r.actor}</>}
                            </span>
                          </span>
                          <span className="hidden max-w-36 shrink-0 truncate rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:block" translate="no">{r.branch}</span>
                          <span className="flex w-24 shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground tabular-nums">
                            <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {timeAgoShort(r.createdAt, now)} ago</span>
                            {r.durationSec !== null && <span className="flex items-center gap-1"><Timer className="size-3.5" /> {formatDuration(r.durationSec)}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )
      )}
    </div>
  );
}

function RunsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading workflow runs">
      <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-7" />)}</div>
      <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}</div>
    </div>
  );
}

function RunPage({ auth, repo, run, jobParam, now, onJob }: { auth: ApiAuth; repo: string; run: Run; jobParam: number | null; now: number; onJob: (id: number) => void }) {
  const [jobsData, setJobsData] = useState<{ jobs?: Job[]; error?: string } | null>(null);
  const [explain, setExplain] = useState<{ text: string; mode: string } | null>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    const ref = parseRepo(repo);
    if (!ref) return;
    let live = true;
    fetchJobs(ref, run.id)
      .then((jobs) => live && setJobsData({ jobs }))
      .catch((e) => live && setJobsData({ error: e instanceof Error ? e.message : "Couldn't load the run's jobs." }));
    return () => {
      live = false;
    };
  }, [repo, run.id]);

  const jobs = jobsData?.jobs;
  const job = jobs?.find((j) => j.id === jobParam) ?? jobs?.find((j) => j.conclusion === "failure") ?? jobs?.[0];

  const runExplain = async () => {
    if (!jobs) return;
    setExplaining(true);
    try {
      setExplain(await apiJson<{ text: string; mode: string }>("/api/ship/explain", auth, { body: { repo, workflow: run.name, steps: failedSteps(jobs) } }));
    } catch (e) {
      setExplain({ text: e instanceof Error ? `${e.message} Try again in a moment.` : "Couldn't explain this run. Try again in a moment.", mode: "error" });
    }
    setExplaining(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/deploy?repo=${repo}`} scroll={false} className="flex w-fit items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
        <ArrowLeft className="size-4" /> All Workflows
      </Link>

      <header className="flex flex-wrap items-start gap-3">
        <StatusIcon status={run.status} conclusion={run.conclusion} className="mt-1.5 size-5" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-balance break-words">{run.title} <span className="font-normal text-muted-foreground tabular-nums">#{run.runNumber}</span></h2>
          <p className="text-sm text-muted-foreground">
            {run.name} · {EVENT[run.event] ?? run.event} {timeAgoShort(run.createdAt, now)} ago{run.actor && <> by {run.actor}</>} · <span className="font-mono" translate="no">{run.sha}</span> on <span className="rounded-sm bg-muted px-1 font-mono text-xs" translate="no">{run.branch}</span>
          </p>
        </div>
        <a href={run.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">View on GitHub <ExternalLink className="size-3.5" /></a>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border text-sm sm:grid-cols-4">
        {[
          ["Status", run.status === "completed" ? (run.conclusion ?? "completed") : run.status.replace("_", " ")],
          ["Total duration", formatDuration(run.durationSec) || "In progress"],
          ["Jobs", jobs ? String(jobs.length) : "…"],
          ["Failed steps", jobs ? String(failedSteps(jobs).length) : "…"],
        ].map(([k, v]) => (
          <div key={k} className="bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="font-semibold capitalize tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {jobsData?.error && <p role="alert" className="text-sm text-destructive">{jobsData.error}</p>}
      {!jobsData && <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading jobs">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9" />)}</div>}

      {jobs && (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Jobs" className="flex flex-col gap-0.5 text-sm">
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Jobs</p>
            {jobs.map((j) => (
              <button key={j.id} type="button" onClick={() => onJob(j.id)} aria-current={job?.id === j.id ? "true" : undefined} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent", job?.id === j.id && "bg-accent font-medium")}>
                <StatusIcon status={j.status} conclusion={j.conclusion} />
                <span className="min-w-0 flex-1 truncate">{j.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(j.durationSec)}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            {job && (
              <section className="overflow-hidden rounded-md border bg-card">
                <p className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">
                  {job.name}
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {job.conclusion ? `${job.conclusion === "success" ? "succeeded" : job.conclusion}` : job.status} {formatDuration(job.durationSec) && `in ${formatDuration(job.durationSec)}`}
                  </span>
                </p>
                <ol>
                  {job.steps.map((s) => (
                    <li key={s.number} className={cn("flex items-center gap-2 border-b px-4 py-2 font-mono text-[13px] last:border-b-0", s.conclusion === "failure" && "bg-destructive/5 font-semibold text-destructive")}>
                      <StatusIcon status={s.status} conclusion={s.conclusion} className="size-3.5" />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <span className="text-xs font-normal text-muted-foreground tabular-nums">{formatDuration(s.durationSec)}</span>
                    </li>
                  ))}
                  {job.steps.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">This job has no steps to show.</li>}
                </ol>
              </section>
            )}

            {run.conclusion === "failure" && (
              <section className="rounded-md border bg-card p-4" aria-live="polite">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">DevOps &amp; Debug Agent</h3>
                    <p className="text-xs text-muted-foreground">Explains why this run failed, in plain words, using your profile.</p>
                  </div>
                  <Button onClick={runExplain} disabled={explaining}>
                    {explaining && <Loader2 className="animate-spin" />} {explaining ? "Explaining…" : explain ? "Explain Again" : "Explain This Failure"}
                  </Button>
                </div>
                {explain && (
                  <div className={cn("mt-3 border-t pt-3 text-sm", explain.mode === "error" && "text-destructive")}>
                    <Markdown>{explain.text}</Markdown>
                    {explain.mode !== "gemini" && explain.mode !== "error" && <p className="mt-2 text-xs text-muted-foreground">Built-in rules answered this one; the AI agent was unavailable.</p>}
                  </div>
                )}
              </section>
            )}
            {run.conclusion === "success" && <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" weight="fill" /> All green. Nothing to fix here.</p>}
          </div>
        </div>
      )}
      <p className="flex items-center gap-1 text-xs text-muted-foreground"><GitBranch className="size-3.5" /> Read-only: DevVerse never re-runs or changes your workflows.</p>
    </div>
  );
}
