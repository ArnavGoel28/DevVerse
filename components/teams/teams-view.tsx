"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Avatar, SampleBadge } from "@/components/community/parts";
import { AlertTriangle, Bot, CheckCircle2, Circle, CircleHalf } from "@/components/icons";
import { type Member, memberFromProfile, onboardingPath, sampleTeam, singlePoints, teamStack } from "@/lib/teams/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function cellColor(v: number): string {
  if (v >= 0.75) return "bg-primary text-primary-foreground";
  if (v >= 0.5) return "bg-primary/65 text-primary-foreground";
  if (v >= 0.25) return "bg-primary/30 text-foreground";
  if (v > 0) return "bg-primary/10 text-foreground";
  return "bg-muted text-muted-foreground";
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "skills", label: "Skills" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const strongIn = (m: Member) => Object.values(m.skills).filter((v) => v >= 0.75).length;

/** Linear-style progress icon: empty, part-filled or done. */
function Progress({ value }: { value: number }) {
  if (value >= 0.75) return <CheckCircle2 className="size-4 text-success" weight="fill" aria-label="Strong" />;
  if (value > 0) return <CircleHalf className="size-4 text-highlight" weight="fill" aria-label="Some experience" />;
  return <Circle className="size-4 text-muted-foreground" aria-label="Not started" />;
}

// TM-01/02/03: the Linear team layout (team key, tabs, dense list rows) with a skill matrix, risks and onboarding (Teams tier).
export function TeamsView({ profile }: { profile: DeveloperProfile }) {
  const params = useSearchParams();
  const router = useRouter();
  const team = useMemo(() => sampleTeam(memberFromProfile(profile)), [profile]);
  const stack = useMemo(() => teamStack(team), [team]);
  const risks = useMemo(() => singlePoints(team, stack), [team, stack]);
  const tab: Tab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview";
  const member = team.members.find((m) => m.id === params.get("member")) ?? team.members.find((m) => m.role === "New joiner") ?? team.members[0];
  const path = onboardingPath(team, member, stack);
  const key = team.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`/teams${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <div className="overflow-hidden rounded-md border bg-card text-[13px]">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-md border bg-secondary font-mono text-xs font-semibold" aria-hidden>{key}</span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">{team.name} {team.sample && <SampleBadge />}</h2>
          <p className="text-xs text-muted-foreground tabular-nums">{team.members.length} members · {stack.length} core skills · {risks.length} {risks.length === 1 ? "risk" : "risks"}</p>
        </div>
      </header>
      <div role="tablist" aria-label="Team views" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => set({ tab: t.id === "overview" ? null : t.id })}
            className={cn("-mb-px border-b-2 px-2.5 py-2 text-sm transition-colors", tab === t.id ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "overview" && (
          <div className="grid lg:grid-cols-2">
            <section className="border-b lg:border-r lg:border-b-0">
              <h3 className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">Risks · Single Points of Failure</h3>
              {risks.length ? (
                <ul>
                  {risks.map((r) => (
                    <li key={r.skill} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
                      <AlertTriangle className="size-4 shrink-0 text-highlight" weight="fill" />
                      <span className="min-w-0 flex-1"><b className="font-medium" translate="no">{r.skill}</b> depends on one person</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Avatar name={r.owner} size={5} /> {r.owner}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-muted-foreground">Every core skill has at least two strong people.</p>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5">
                <h3 className="text-xs font-medium text-muted-foreground">Onboarding Path for</h3>
                <label htmlFor="team-member" className="sr-only">Team member</label>
                <select id="team-member" name="member" value={member.id} onChange={(e) => set({ member: e.target.value })} className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground">
                  {team.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              {path.length ? (
                <ol>
                  {path.map((p, i) => (
                    <li key={p.skill} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
                      <span className="w-4 font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                      <Progress value={p.current} />
                      <span className="min-w-0 flex-1 font-medium" translate="no">{p.skill}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">now {pct(p.current)} · team {pct(p.teamAvg)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-4 py-3 text-muted-foreground">{member.name} already covers the team&apos;s core stack.</p>
              )}
              {member.you && path.length > 0 && <Link href="/learn" className="block border-t px-4 py-2.5 text-primary hover:bg-accent/50">Turn This into Your Roadmap</Link>}
            </section>

            <section className="border-t px-4 py-3 lg:col-span-2">
              <h3 className="flex items-center gap-2 font-medium"><Bot className="size-4" /> Codebase Agent <span className="rounded-sm border px-1.5 text-[11px] font-normal text-muted-foreground">Enterprise</span></h3>
              <p className="mt-1 text-muted-foreground">Answers questions about your team&apos;s private repositories: where things live, why they were built that way, who to ask. Not available yet; it ships with the Enterprise tier (TM-03).</p>
            </section>
          </div>
        )}

        {tab === "members" && (
          <ul>
            {team.members.map((m) => {
              const top = Object.entries(m.skills).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return (
                <li key={m.id} className="border-b last:border-b-0">
                  <button type="button" onClick={() => set({ tab: null, member: m.id })} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50" title={`Show ${m.name}'s onboarding path`}>
                    <Avatar name={m.name} size={7} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{m.name}{m.you && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}</span>
                      <span className="block text-xs text-muted-foreground">{m.role}</span>
                    </span>
                    <span className="hidden gap-1 sm:flex">
                      {top.map(([s, v]) => <span key={s} className="rounded-sm border px-1.5 py-px font-mono text-[11px] text-muted-foreground" translate="no">{s} {pct(v)}</span>)}
                    </span>
                    <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">Strong in {strongIn(m)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "skills" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Team skill matrix: confidence per member and skill</caption>
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2 text-left font-medium">Member</th>
                  {stack.map((s) => <th key={s} scope="col" className="px-2 py-2 text-center font-mono font-medium" translate="no">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.id} className={cn("border-b last:border-b-0", m.id === member.id && "bg-accent/40")}>
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      <span className="flex items-center gap-2"><Avatar name={m.name} size={6} /><span><span className="block font-medium">{m.name}</span><span className="block text-xs text-muted-foreground">{m.role}</span></span></span>
                    </th>
                    {stack.map((s) => {
                      const v = m.skills[s] ?? 0;
                      return (
                        <td key={s} className="px-1 py-1 text-center">
                          <span className={cn("block rounded-sm px-1 py-1 font-mono text-xs tabular-nums", cellColor(v))} title={`${m.name}: ${s} ${pct(v)}`}>{v ? Math.round(v * 100) : "–"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
