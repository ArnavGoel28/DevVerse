"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { SampleBadge } from "@/components/community/parts";
import { Bookmark, BookmarkCheck, Briefcase, Buildings, CheckCircle2, CircleHalf, ListChecks, MapPin, Search, XCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLocal } from "@/components/use-local";
import { filterJobs, type Job, type JobFilter, type JobMatch, SAMPLE_JOBS } from "@/lib/jobs/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const WORKPLACE: Record<Job["workplace"], string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };
const TYPE: Record<Job["type"], string> = { internship: "Internship", "full-time": "Full-time", contract: "Contract" };

function posted(hours: number): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  return hours < 24 ? rtf.format(-hours, "hour") : rtf.format(-Math.round(hours / 24), "day");
}

function skillsLine(m: JobMatch) {
  const total = m.have.length + m.partial.length + m.gaps.length;
  return `${m.have.length} of ${total} skills match your profile`;
}

/** Company "logo": the initial on a neutral tile (no real logos, D-33). */
function CompanyMark({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-md border bg-secondary font-semibold text-secondary-foreground", size === "md" ? "size-12 text-lg" : "size-8 text-sm")}>
      {name.charAt(0)}
    </span>
  );
}

// JB-01: the LinkedIn Jobs layout (search + filter chips, list beside detail) ranked by proven skills (Career agent, D-28).
// Filters and the open job live in the URL so a search can be shared (web interface guidelines).
export function JobsView({ profile }: { profile: DeveloperProfile }) {
  const params = useSearchParams();
  const router = useRouter();
  const [saved, setSaved] = useLocal<string[]>("devverse.jobs.saved.v1", () => []);
  const filter: JobFilter = {
    query: params.get("q") ?? undefined,
    workplace: (params.get("workplace") as Job["workplace"]) || undefined,
    type: (params.get("type") as Job["type"]) || undefined,
    minMatch: params.get("min") ? 50 : 0,
  };
  const onlySaved = params.get("saved") === "1";
  const results = useMemo(
    () => filterJobs(SAMPLE_JOBS, profile, filter).filter((r) => !onlySaved || saved.includes(r.job.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, params, saved],
  );
  const current = results.find((r) => r.job.id === params.get("job")) ?? results[0];

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`/jobs${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const toggleSave = (id: string) => {
    const was = saved.includes(id);
    setSaved((s) => (was ? s.filter((x) => x !== id) : [...s, id]));
    toast(was ? "Removed from saved jobs" : "Job saved", { description: was ? undefined : "Find it with the Saved filter." });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <label htmlFor="job-q" className="sr-only">Search jobs</label>
          <input
            id="job-q"
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Search by title, skill or company, e.g. React…"
            defaultValue={filter.query ?? ""}
            onChange={(e) => set({ q: e.target.value || null, job: null })}
            className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filters">
          {(Object.keys(WORKPLACE) as Job["workplace"][]).map((w) => (
            <Chip key={w} pressed={filter.workplace === w} onClick={() => set({ workplace: filter.workplace === w ? null : w, job: null })}>{WORKPLACE[w]}</Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          {(Object.keys(TYPE) as Job["type"][]).map((t) => (
            <Chip key={t} pressed={filter.type === t} onClick={() => set({ type: filter.type === t ? null : t, job: null })}>{TYPE[t]}</Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          <Chip pressed={!!filter.minMatch} onClick={() => set({ min: filter.minMatch ? null : "50", job: null })}>50%+ Match</Chip>
          <Chip pressed={onlySaved} onClick={() => set({ saved: onlySaved ? null : "1", job: null })}>Saved ({saved.length})</Chip>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          No roles match these filters. Remove a filter, or <Link href="/learn" className="text-primary hover:underline">grow the skills</Link> these roles ask for.
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <section aria-label="Job results" className="min-w-0 border-b lg:border-r lg:border-b-0">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Top Job Picks for You</h2>
              <p className="text-xs text-muted-foreground tabular-nums">{results.length} {results.length === 1 ? "result" : "results"} · ranked by the skills your profile has evidence for</p>
            </div>
            <ul>
              {results.map(({ job, match }) => (
                <li key={job.id} className="border-b last:border-b-0">
                  <button type="button" onClick={() => set({ job: job.id })} aria-current={current?.job.id === job.id ? "true" : undefined} className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50", current?.job.id === job.id && "bg-accent")}>
                    <CompanyMark name={job.company} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-primary underline-offset-2 hover:underline">{job.title}</span>
                      <span className="block text-sm">{job.company}</span>
                      <span className="block text-sm text-muted-foreground">{job.location} ({WORKPLACE[job.workplace]})</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><ListChecks className="size-3.5" /> {skillsLine(match)}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {posted(job.postedHoursAgo)}
                        {saved.includes(job.id) && <span className="flex items-center gap-0.5 text-foreground"><BookmarkCheck className="size-3" /> Saved</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-sm font-semibold tabular-nums">{match.percent}%</span>
                      <span className="block text-[10px] text-muted-foreground uppercase">match</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {current && <JobDetail key={current.job.id} job={current.job} match={current.match} saved={saved.includes(current.job.id)} onSave={() => toggleSave(current.job.id)} />}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Sample listings from fictional companies while real job feeds are connected.</p>
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        pressed ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-input bg-background hover:border-foreground/40 hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function JobDetail({ job, match, saved, onSave }: { job: Job; match: JobMatch; saved: boolean; onSave: () => void }) {
  const required = new Set(job.skills.filter((s) => s.required).map((s) => s.id));
  const rows = [
    ...match.have.map((s) => ({ s, state: "have" as const })),
    ...match.partial.map((s) => ({ s, state: "partial" as const })),
    ...match.gaps.map((s) => ({ s, state: "gap" as const })),
  ];
  return (
    <article className="min-w-0 p-5 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <CompanyMark name={job.company} size="sm" />
        <span className="font-medium">{job.company}</span>
        <SampleBadge />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-balance">{job.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{job.location} · {posted(job.postedHoursAgo)}</p>

      <ul className="mt-4 flex flex-col gap-1.5 text-sm">
        <li className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" /> <span className="rounded-sm bg-muted px-1.5">{WORKPLACE[job.workplace]}</span> <span className="rounded-sm bg-muted px-1.5">{TYPE[job.type]}</span> <span className="rounded-sm bg-muted px-1.5">{job.salary}</span></li>
        <li className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {job.location}</li>
        <li className="flex items-center gap-2"><ListChecks className="size-4 text-muted-foreground" /> {skillsLine(match)}</li>
      </ul>

      <div className="mt-4 flex gap-2">
        <Button variant={saved ? "outline" : "default"} onClick={onSave} aria-pressed={saved}>
          {saved ? <BookmarkCheck /> : <Bookmark />} {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <section className="mt-6 rounded-md border p-4">
        <h3 className="font-semibold">How You Match</h3>
        <p className="mb-3 text-sm text-muted-foreground"><b className="font-mono text-foreground tabular-nums">{match.percent}%</b> match, based on the evidence in your Developer Profile.</p>
        <ul className="divide-y">
          {rows.map(({ s, state }) => (
            <li key={s} className="flex items-center gap-2 py-2 text-sm">
              {state === "have" ? <CheckCircle2 className="size-4 text-success" weight="fill" aria-label="Proven" /> : state === "partial" ? <CircleHalf className="size-4 text-highlight" weight="fill" aria-label="Partly proven" /> : <XCircle className="size-4 text-destructive" aria-label="Missing" />}
              <span className="flex-1" translate="no">{s}</span>
              {required.has(s) && <span className="text-xs text-muted-foreground">Required</span>}
              <span className="w-24 text-right text-xs text-muted-foreground">{state === "have" ? "Proven" : state === "partial" ? "Some evidence" : "No evidence yet"}</span>
            </li>
          ))}
        </ul>
        {match.gaps.length > 0 ? (
          <p className="mt-3 text-sm">To close the gap, <Link href="/learn" className="text-primary hover:underline">add {match.gaps[0]} to your roadmap</Link> or <Link href="/practice" className="text-primary hover:underline">practise</Link>, then re-import your profile.</p>
        ) : (
          <p className="mt-3 text-sm text-success">You have evidence for every skill this role asks for.</p>
        )}
      </section>

      <section className="mt-6">
        <h3 className="mb-1 font-semibold">About the Job</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Buildings className="size-3.5" /> {job.company} · fictional sample company</p>
        <p className="mt-2 text-sm leading-relaxed">{job.about}</p>
      </section>
    </article>
  );
}
