"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Briefcase, MapPin, Search } from "lucide-react";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = results.find((r) => r.job.id === selectedId) ?? results[0];

  const toggleSave = (id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <input aria-label="Search jobs" placeholder="Title, company or skill" value={filter.query ?? ""} onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))} className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm" />
        </div>
        <select aria-label="Workplace" value={filter.workplace ?? ""} onChange={(e) => setFilter((f) => ({ ...f, workplace: (e.target.value || undefined) as Job["workplace"] }))} className="rounded-md border bg-background px-2 py-2 text-sm">
          <option value="">Any workplace</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
        </select>
        <select aria-label="Job type" value={filter.type ?? ""} onChange={(e) => setFilter((f) => ({ ...f, type: (e.target.value || undefined) as Job["type"] }))} className="rounded-md border bg-background px-2 py-2 text-sm">
          <option value="">Any type</option><option value="internship">Internship</option><option value="full-time">Full-time</option><option value="contract">Contract</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={(filter.minMatch ?? 0) >= 50} onChange={(e) => setFilter((f) => ({ ...f, minMatch: e.target.checked ? 50 : 0 }))} /> 50%+ match</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> Saved ({saved.length})</label>
      </div>
      <p className="text-xs text-muted-foreground">Sample listings from fictional companies while job feeds are being connected. Match % comes from the skills your profile has evidence for.</p>

      {results.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No roles match these filters. Try removing the 50% filter, or <Link href="/learn" className="text-primary hover:underline">grow the skills</Link> these roles ask for.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <ul className="overflow-hidden rounded-xl border bg-card">
            {results.map(({ job, match }) => (
              <li key={job.id}>
                <button onClick={() => setSelectedId(job.id)} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted", current?.job.id === job.id && "border-l-4 border-l-primary bg-muted")}>
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
            <article className="rounded-xl border bg-card p-5">
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
                <Button disabled title="Sample listing: applying opens when real job feeds are connected">Apply</Button>
                <Button variant="outline" onClick={() => toggleSave(current.job.id)} aria-pressed={saved.includes(current.job.id)}>
                  {saved.includes(current.job.id) ? <BookmarkCheck /> : <Bookmark />} {saved.includes(current.job.id) ? "Saved" : "Save"}
                </Button>
              </div>
              <section className="mb-4 rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-semibold">How you match</h3>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {current.match.have.map((s) => <span key={s} className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ {s}</span>)}
                  {current.match.partial.map((s) => <span key={s} className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">◐ {s}</span>)}
                  {current.match.gaps.map((s) => <span key={s} className="rounded-md bg-rose-100 px-2 py-0.5 text-rose-800 dark:bg-rose-950 dark:text-rose-300">✕ {s}</span>)}
                </div>
                {current.match.gaps.length > 0 ? (
                  <p className="mt-3 text-sm">To close the gap: <Link href="/learn" className="text-primary hover:underline">add {current.match.gaps[0]} to your roadmap</Link> or <Link href="/practice" className="text-primary hover:underline">practise</Link>, then re-import your profile.</p>
                ) : (
                  <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">You have evidence for every required skill.</p>
                )}
              </section>
              <h3 className="mb-1 text-sm font-semibold">About the role</h3>
              <p className="text-sm text-muted-foreground">{current.job.about}</p>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
