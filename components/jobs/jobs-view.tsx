"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, Briefcase, MapPin, Search } from "@/components/icons";
import { toast } from "sonner";

import { SampleBadge } from "@/components/community/parts";
import { Button } from "@/components/ui/button";
import { useLocal } from "@/components/use-local";
import { filterJobs, type Job, type JobFilter, SAMPLE_JOBS } from "@/lib/jobs/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function MatchRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const color = percent >= 70 ? "#059669" : percent >= 40 ? "#d97706" : "#9ca3af";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${percent}% match`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${(percent / 100) * c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fontSize={size / 4} fontWeight={600} fill="currentColor">{percent}%</text>
    </svg>
  );
}

const ago = (h: number) => (h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`);

// JB-01: LinkedIn Jobs-style list + detail, sorted by how well your proven skills match (Career agent).
export function JobsView({ profile }: { profile: DeveloperProfile }) {
  const [filter, setFilter] = useState<JobFilter>({});
  const [saved, setSaved] = useLocal<string[]>("devverse.jobs.saved.v1", () => []);
  const [onlySaved, setOnlySaved] = useState(false);
  const results = useMemo(() => filterJobs(SAMPLE_JOBS, profile, filter).filter((r) => !onlySaved || saved.includes(r.job.id)), [profile, filter, onlySaved, saved]);
  const params = useSearchParams();
  const router = useRouter();
  const selectedId = params.get("job");
  const setSelectedId = (id: string) => router.replace(`/jobs?job=${id}`, { scroll: false });
  const current = results.find((r) => r.job.id === selectedId) ?? results[0];

  const toggleSave = (id: string) => {
    const was = saved.includes(id);
    setSaved((s) => (was ? s.filter((x) => x !== id) : [...s, id]));
    toast(was ? "Removed from saved jobs" : "Job saved", { description: was ? undefined : "Find it under Saved." });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <input aria-label="Search jobs" type="search" name="q" autoComplete="off" placeholder="Title, company or skill, e.g. React…" value={filter.query ?? ""} onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))} className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm" />
        </div>
        <select aria-label="Workplace" name="workplace" value={filter.workplace ?? ""} onChange={(e) => setFilter((f) => ({ ...f, workplace: (e.target.value || undefined) as Job["workplace"] }))} className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground">
          <option value="">Any workplace</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
        </select>
        <select aria-label="Job type" name="type" value={filter.type ?? ""} onChange={(e) => setFilter((f) => ({ ...f, type: (e.target.value || undefined) as Job["type"] }))} className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground">
          <option value="">Any type</option><option value="internship">Internship</option><option value="full-time">Full-time</option><option value="contract">Contract</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={(filter.minMatch ?? 0) >= 50} onChange={(e) => setFilter((f) => ({ ...f, minMatch: e.target.checked ? 50 : 0 }))} /> 50%+ match</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> Saved ({saved.length})</label>
      </div>
      <p className="text-xs text-muted-foreground">Sample listings from fictional companies while job feeds are being connected. Match % comes from the skills your profile has evidence for.</p>

      {results.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">No roles match these filters. Try removing the 50% filter, or <Link href="/learn" className="text-primary hover:underline">grow the skills</Link> these roles ask for.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <ul className="overflow-hidden rounded-md border bg-card">
            {results.map(({ job, match }) => (
              <li key={job.id}>
                <button onClick={() => setSelectedId(job.id)} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted", current?.job.id === job.id && "bg-accent")}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">{job.company.charAt(0)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-primary">{job.title}</span>
                    <span className="block text-sm">{job.company}</span>
                    <span className="block text-xs text-muted-foreground">{job.location} ({job.workplace}) · {ago(job.postedHoursAgo)}</span>
                  </span>
                  <MatchRing percent={match.percent} />
                </button>
              </li>
            ))}
          </ul>

          {current && (
            <article className="rounded-md border bg-card p-5">
              <div className="mb-3 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2"><SampleBadge /></div>
                  <h2 className="text-xl font-semibold">{current.job.title}</h2>
                  <p className="text-sm">{current.job.company}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="size-3" />{current.job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="size-3" />{current.job.type} · {current.job.workplace}</span>
                    <span>{current.job.salary}</span>
                  </p>
                </div>
                <MatchRing percent={current.match.percent} size={64} />
              </div>
              <div className="mb-4 flex gap-2">
                <Button variant="outline" onClick={() => toggleSave(current.job.id)} aria-pressed={saved.includes(current.job.id)}>
                  {saved.includes(current.job.id) ? <BookmarkCheck /> : <Bookmark />} {saved.includes(current.job.id) ? "Saved" : "Save"}
                </Button>
              </div>
              <section className="mb-4 rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-semibold">How You Match</h3>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {current.match.have.map((s) => <span key={s} className="rounded-md bg-success/10 px-2 py-0.5 text-success">✓ {s}</span>)}
                  {current.match.partial.map((s) => <span key={s} className="rounded-md bg-highlight/15 px-2 py-0.5 text-highlight">◐ {s}</span>)}
                  {current.match.gaps.map((s) => <span key={s} className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">✕ {s}</span>)}
                </div>
                {current.match.gaps.length > 0 ? (
                  <p className="mt-3 text-sm">To close the gap: <Link href="/learn" className="text-primary hover:underline">add {current.match.gaps[0]} to your roadmap</Link> or <Link href="/practice" className="text-primary hover:underline">practise</Link>, then re-import your profile.</p>
                ) : (
                  <p className="mt-3 text-sm text-success">You have evidence for every required skill.</p>
                )}
              </section>
              <h3 className="mb-1 text-sm font-semibold">About the Role</h3>
              <p className="text-sm text-muted-foreground">{current.job.about}</p>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
