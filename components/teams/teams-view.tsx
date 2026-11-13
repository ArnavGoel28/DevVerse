"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bot, Route } from "@/components/icons";

import { Avatar, SampleBadge } from "@/components/community/parts";
import { memberFromProfile, onboardingPath, sampleTeam, singlePoints, teamStack } from "@/lib/teams/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function cellColor(v: number): string {
  if (v >= 0.75) return "bg-primary text-primary-foreground";
  if (v >= 0.5) return "bg-primary/65 text-primary-foreground";
  if (v >= 0.25) return "bg-primary/30 text-foreground";
  if (v > 0) return "bg-primary/10 text-foreground";
  return "bg-muted text-muted-foreground";
}

// TM-01/02/03: GitHub org + Linear-style team view with a skill matrix, risks and onboarding (Teams tier).
export function TeamsView({ profile }: { profile: DeveloperProfile }) {
  const team = useMemo(() => sampleTeam(memberFromProfile(profile)), [profile]);
  const stack = useMemo(() => teamStack(team), [team]);
  const risks = useMemo(() => singlePoints(team, stack), [team, stack]);
  const [memberId, setMemberId] = useState(team.members.find((m) => m.role === "New joiner")?.id ?? "you");
  const member = team.members.find((m) => m.id === memberId) ?? team.members[0];
  const path = onboardingPath(team, member, stack);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-4">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 font-semibold">{team.name} {team.sample && <SampleBadge />}</h2>
          <p className="text-xs text-muted-foreground">{team.members.length} members · you plus sample teammates until team invites are live</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-md border bg-card">
        <h3 className="border-b px-4 py-2 text-sm font-semibold">Team skill matrix</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Member</th>
              {stack.map((s) => <th key={s} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {team.members.map((m) => (
              <tr key={m.id} className={cn("border-t", m.id === memberId && "bg-primary/5")}>
                <td className="px-4 py-2">
                  <button onClick={() => setMemberId(m.id)} className="flex items-center gap-2 text-left">
                    <Avatar name={m.name} size={6} />
                    <span><span className="block font-medium">{m.name}</span><span className="block text-xs text-muted-foreground">{m.role}</span></span>
                  </button>
                </td>
                {stack.map((s) => {
                  const v = m.skills[s] ?? 0;
                  return (
                    <td key={s} className="px-1 py-1 text-center">
                      <span className={cn("block rounded px-1 py-1 text-xs", cellColor(v))} title={`${m.name}: ${s} ${Math.round(v * 100)}%`}>{v ? Math.round(v * 100) : "–"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-md border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-highlight" /> Single points of failure</h3>
          {risks.length ? (
            <ul className="flex flex-col gap-1 text-sm">{risks.map((r) => <li key={r.skill}><b>{r.skill}</b>: only {r.owner} is strong here</li>)}</ul>
          ) : (
            <p className="text-sm text-muted-foreground">Every core skill has at least two strong people.</p>
          )}
        </section>

        <section className="rounded-md border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Route className="size-4 text-primary" /> Onboarding path for {member.name}</h3>
          {path.length ? (
            <ol className="flex flex-col gap-2 text-sm">
              {path.map((p, i) => (
                <li key={p.skill} className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-sm bg-secondary font-mono text-xs">{i + 1}</span>
                  <span className="flex-1"><b>{p.skill}</b> <span className="text-xs text-muted-foreground">team avg {Math.round(p.teamAvg * 100)}% · now {Math.round(p.current * 100)}%</span></span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">{member.name} already covers the team&apos;s core stack.</p>
          )}
          {member.you && path.length > 0 && <Link href="/learn" className="mt-3 inline-block text-sm text-primary hover:underline">Turn this into your roadmap →</Link>}
        </section>

        <section className="rounded-md border border-dashed bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Bot className="size-4" /> Codebase agent <span className="rounded bg-muted px-1.5 text-[11px] font-normal">Enterprise</span></h3>
          <p className="mb-3 text-sm text-muted-foreground">Ask questions about your team&apos;s private repositories: where things live, why they were built that way, who to ask. Runs on Gemini 4 Carbon or a private Gemma 4.</p>
          <p className="text-xs text-muted-foreground">Not available yet. It ships with the Enterprise tier (TM-03).</p>
        </section>
      </div>
    </div>
  );
}
