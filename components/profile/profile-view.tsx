"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, EyeOff, Minus, TrendingDown, TrendingUp, Undo2, X } from "@/components/icons";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parentName } from "@/lib/profile/skills";
import type { DeveloperProfile, ProfileSkill, SkillFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type Props = {
  profile: DeveloperProfile;
  onFeedback: (skillId: string, feedback: SkillFeedback | null) => void;
};

export function ProfileView({ profile, onFeedback }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SummaryCard profile={profile} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SkillsCard skills={profile.skills} onFeedback={onFeedback} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <StrugglesCard profile={profile} />
          <RecommendationsCard profile={profile} />
        </div>
      </div>
      <GrowthCard profile={profile} />
    </div>
  );
}

function SummaryCard({ profile }: { profile: DeveloperProfile }) {
  const s = profile.githubStats;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {s.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.avatarUrl} alt="" className="size-16 shrink-0 rounded-full border" />
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">@{s.login}</h2>
            <Badge className="capitalize">{profile.level}</Badge>
            {profile.focusAreas.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <Stat label="repos" value={s.totals.repos} />
            {s.source !== "public" && <Stat label="commits" value={s.totals.commits} />}
            <Stat label="pull requests" value={s.totals.pullRequests} />
            <Stat label="stars" value={s.totals.stars} />
            <Stat label="merged OSS PRs" value={s.totals.mergedExternalPRs} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <span>
      <span className="font-semibold text-foreground">{value.toLocaleString()}</span> {label}
      {hint && <span className="ml-1 opacity-70">({hint})</span>}
    </span>
  );
}

function SkillsCard({ skills, onFeedback }: { skills: ProfileSkill[]; onFeedback: Props["onFeedback"] }) {
  const [showHidden, setShowHidden] = useState(false);
  const hiddenCount = skills.filter((s) => s.userFeedback === "hidden").length;
  const visible = skills.filter((s) => showHidden || s.userFeedback !== "hidden");
  const groups = new Map<string, ProfileSkill[]>();
  for (const s of visible) {
    const g = parentName(s.parent);
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          Inferred from evidence in your work. Open a skill to see why, then confirm it or mark it wrong.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!skills.length && <p className="text-sm text-muted-foreground">No skills found yet. Push some code to GitHub and import again.</p>}
        {[...groups.entries()].map(([group, list]) => (
          <div key={group} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</h3>
            {list.map((s) => (
              <SkillRow key={s.id} skill={s} onFeedback={onFeedback} />
            ))}
          </div>
        ))}
        {hiddenCount > 0 && (
          <button className="self-start text-xs text-muted-foreground underline" onClick={() => setShowHidden((v) => !v)}>
            {showHidden ? "Hide" : "Show"} {hiddenCount} hidden skill{hiddenCount > 1 ? "s" : ""}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SkillRow({ skill, onFeedback }: { skill: ProfileSkill; onFeedback: Props["onFeedback"] }) {
  const pct = Math.round(skill.confidence * 100);
  const fb = skill.userFeedback;
  return (
    <details className={cn("group rounded-md border px-3 py-2", fb === "wrong" && "opacity-60", fb === "hidden" && "opacity-40")}>
      <summary className="flex cursor-pointer list-none items-center gap-3">
        <span className={cn("w-32 shrink-0 truncate text-sm font-medium", fb === "wrong" && "line-through")}>{skill.name}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-sm bg-muted" aria-hidden>
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground" aria-label={`confidence ${pct} percent`}>
          {pct}%
        </span>
        {fb === "confirmed" && <Check className="size-4 text-primary" aria-label="confirmed" />}
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-t pt-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Why: </span>
          {skill.why}
        </p>
        <div className="flex flex-wrap gap-2">
          {fb ? (
            <Button size="sm" variant="outline" onClick={() => onFeedback(skill.id, null)}>
              <Undo2 /> Undo “{fb}”
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onFeedback(skill.id, "confirmed")}>
                <Check /> That&apos;s right
              </Button>
              <Button size="sm" variant="outline" onClick={() => onFeedback(skill.id, "wrong")}>
                <X /> I don&apos;t know this
              </Button>
              <Button size="sm" variant="outline" onClick={() => onFeedback(skill.id, "hidden")}>
                <EyeOff /> Hide
              </Button>
            </>
          )}
        </div>
      </div>
    </details>
  );
}

const TREND = {
  rising: { icon: TrendingUp, label: "getting worse" },
  falling: { icon: TrendingDown, label: "improving" },
  steady: { icon: Minus, label: "steady" },
} as const;

function StrugglesCard({ profile }: { profile: DeveloperProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Struggles</CardTitle>
        <CardDescription>Recurring gaps spotted in your history.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!profile.struggles.length && <p className="text-sm text-muted-foreground">Nothing stands out right now.</p>}
        {profile.struggles.map((s) => {
          const T = TREND[s.trend];
          return (
            <div key={s.topic} className="flex flex-col gap-1 rounded-md border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.topic}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground" title={T.label}>
                  <T.icon className="size-3.5" /> {T.label}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-muted" aria-label={`severity ${Math.round(s.severity * 100)} percent`}>
                <div className="h-full bg-destructive/70" style={{ width: `${Math.round(s.severity * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{s.why}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ profile }: { profile: DeveloperProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next steps</CardTitle>
        <CardDescription>Based on your goals and struggles.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {profile.recommendations.map((r) => {
          const inner = (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {r.type}
                </Badge>
                <span className="text-sm font-medium">{r.title}</span>
                {r.href && <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">{r.reason}</p>
            </>
          );
          const cls = "flex flex-col gap-1 rounded-md border px-3 py-2";
          if (!r.href) return <div key={r.title} className={cls}>{inner}</div>;
          return r.href.startsWith("/") ? (
            <Link key={r.title} href={r.href} className={cn(cls, "hover:bg-muted/60")}>
              {inner}
            </Link>
          ) : (
            <a key={r.title} href={r.href} target="_blank" rel="noreferrer" className={cn(cls, "hover:bg-muted/60")}>
              {inner}
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}

function GrowthCard({ profile }: { profile: DeveloperProfile }) {
  const ids = profile.skills.slice(0, 5).map((s) => s.id);
  const names = Object.fromEntries(profile.skills.map((s) => [s.id, s.name]));
  const data = profile.growth.map((g) => ({
    period: g.period,
    ...Object.fromEntries(ids.map((id) => [id, Math.round((g.skills[id] ?? 0) * 100)])),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth</CardTitle>
        <CardDescription>Confidence in your top skills over time, rebuilt from your GitHub history.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <p className="text-sm text-muted-foreground">Not enough history yet. This chart fills in as you keep building.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v, k) => [`${v}%`, names[String(k)] ?? String(k)]}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend formatter={(k) => names[String(k)] ?? String(k)} wrapperStyle={{ fontSize: 12 }} />
                {ids.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
