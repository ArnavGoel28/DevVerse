"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/community/parts";
import { Bot } from "@/components/icons";
import { readLocal } from "@/components/use-local";
import { githubAvatar } from "@/lib/avatar";
import { feed, type Post } from "@/lib/community/model";
import { seedPosts } from "@/lib/community/seed";
import { filterJobs, SAMPLE_JOBS } from "@/lib/jobs/model";
import { greeting, profileStrength } from "@/lib/home/strength";
import { getModule } from "@/lib/modules";
import { PROBLEMS } from "@/lib/practice/catalog";
import { recommend } from "@/lib/practice/recommend";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Action = { slug: string; title: string; detail: string; href: string; cta: string };

const AGENTS: { name: string; tool: string; status: "now" | "next" | "later" }[] = [
  { name: "Profile Analyst", tool: "Developer Profile", status: "now" },
  { name: "Mentor", tool: "AI Mentor", status: "now" },
  { name: "Learning Path", tool: "Learn", status: "now" },
  { name: "Practice Coach", tool: "Practice", status: "now" },
  { name: "Code Reviewer", tool: "Code", status: "now" },
  { name: "DevOps & Debug", tool: "Ship", status: "now" },
  { name: "Career", tool: "Jobs", status: "next" },
  { name: "Interview", tool: "Practice", status: "later" },
  { name: "Codebase", tool: "Teams", status: "later" },
];
const STATUS = { now: ["Active", "bg-success"], next: ["Preview", "bg-highlight"], later: ["Coming", "bg-muted-foreground/40"] } as const;

/** DI-09 across all tools: one next best action per tool, from the profile. */
export function buildActions(profile: DeveloperProfile, posts: Post[], solved: Set<string>, now: number): Action[] {
  const actions: Action[] = [];
  const topStruggle = profile.struggles[0]?.topic;
  actions.push({ slug: "mentor", title: topStruggle ? `Ask about "${topStruggle}"` : "Ask your mentor anything", detail: "Your mentor answers using your own history.", href: "/mentor", cta: "Open mentor" });
  const learn = profile.recommendations.find((r) => r.type === "learn");
  actions.push({ slug: "learn", title: learn?.title ?? "Build your personal roadmap", detail: learn?.reason ?? "Pick a goal; steps tick off from your real work.", href: "/learn", cta: "Open Learn" });
  const rec = recommend(PROBLEMS, profile, solved, 1)[0];
  if (rec) actions.push({ slug: "practice", title: `Solve "${rec.problem.title}"`, detail: rec.reason, href: `/practice?problem=${rec.problem.id}`, cta: "Practise" });
  const repo = profile.githubStats.topRepos[0];
  actions.push({ slug: "workspace", title: repo ? `Explore ${repo.name} with the Code Reviewer` : "Open a repo in the editor", detail: "Select any code and get it explained at your level.", href: "/workspace", cta: "Open Code" });
  const q = feed(posts, "unanswered", profile, {}, now).find((p) => p.tags.some((t) => profile.skills.some((s) => s.id === t)));
  actions.push({ slug: "community", title: q ? `Answer: "${q.title}"` : "Share what you built", detail: q ? "An open question that matches your skills." : "Showcases and articles build your reputation.", href: q ? `/community/${q.id}` : "/community/new", cta: q ? "Answer" : "Write" });
  const gap = profile.githubInsights.gaps[0];
  actions.push({ slug: "github", title: gap ?? "Find a good first issue", detail: gap ? "Recruiters notice this. Fix it next." : "Open-source issues matched to your skills.", href: "/github", cta: "Grow GitHub" });
  const job = filterJobs(SAMPLE_JOBS, profile, {})[0];
  if (job) actions.push({ slug: "jobs", title: `${job.match.percent}% match: ${job.job.title}`, detail: job.match.gaps.length ? `Gap: ${job.match.gaps.slice(0, 2).join(", ")}` : "You have every required skill.", href: "/jobs", cta: "See jobs" });
  const ci = profile.struggles.find((s) => /ci|build/i.test(s.topic));
  actions.push({ slug: "deploy", title: ci ? "Find out why your CI keeps failing" : "Check your latest CI runs", detail: "The DevOps agent explains failures in plain words.", href: "/deploy", cta: "Open Ship" });
  return actions;
}

export function HomeView({ profile }: { profile: DeveloperProfile }) {
  const [now] = useState(() => Date.now());
  const { actions, strength } = useMemo(() => {
    const posts = readLocal<Post[]>("devverse.community.posts.v1", seedPosts(now));
    const solved = new Set(readLocal<string[]>("devverse.practice.solved", []));
    const mine = posts.filter((p) => p.author === profile.githubStats.login || p.answers.some((a) => a.author === profile.githubStats.login)).length;
    return { actions: buildActions(profile, posts, solved, now), strength: profileStrength(profile, { solved: solved.size, posts: mine }) };
  }, [profile, now]);
  const s = profile.githubStats;
  const skills = profile.skills.filter((x) => x.userFeedback !== "hidden" && x.userFeedback !== "wrong").slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-md border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{greeting(new Date(now).getHours())},</p>
            <h2 className="text-2xl font-semibold tracking-tight break-words">{s.login}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Profile strength <b className="text-foreground">{strength.score}/100</b>, level <b className="text-foreground">{strength.level}</b>.{" "}
              {strength.nextLevelAt ? `${strength.nextLevelAt - strength.score} points to the next level.` : "Top level reached. Keep it current."}
            </p>
          </div>
          {strength.next.length > 0 && (
            <ul className="flex w-full flex-col gap-1 text-sm sm:w-auto">
              {strength.next.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="flex gap-2 rounded-md px-2 py-1 hover:bg-accent">
                    <span className="w-8 shrink-0 font-mono text-xs leading-5 text-primary">+{n.points}</span>
                    <span className="underline decoration-border underline-offset-4">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <StrengthMeter score={strength.score} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="moves">
          <h2 id="moves" className="mb-3 text-lg font-semibold">Your Next Best Moves</h2>
          <ol className="divide-y rounded-md border bg-card">
            {actions.map((a, i) => {
              const mod = getModule(a.slug);
              const Icon = mod?.icon;
              return (
                <li key={a.slug}>
                  <Link href={a.href} className="flex gap-4 px-4 py-3.5 transition-colors hover:bg-accent/60">
                    <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-sm text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {Icon && <Icon className="size-3.5" />}
                        {mod?.name}
                        {i === 0 && <span className="rounded-sm bg-highlight/25 px-1.5 font-mono text-[10px] font-medium text-foreground uppercase">Top pick</span>}
                      </span>
                      <span className="block font-medium break-words">{a.title}</span>
                      <span className="block text-sm text-muted-foreground">{a.detail}</span>
                    </span>
                    <span className="hidden shrink-0 self-center text-sm font-medium text-primary sm:block">{a.cta}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-md border bg-card p-4">
            <div className="mb-3 flex items-center gap-3">
              {s.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={githubAvatar(s.avatarUrl, 96)} alt="" width={40} height={40} loading="lazy" className="size-10 rounded-full border" />
              ) : (
                <Avatar name={s.login} size={10} />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.login}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{profile.level} · {profile.focusAreas.slice(0, 2).join(", ") || "Developer"}</p>
              </div>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{profile.summary}</p>
            <div className="flex flex-col gap-2">
              {skills.map((k) => (
                <div key={k.id}>
                  <div className="flex justify-between text-xs"><span>{k.name}</span><span className="font-mono text-muted-foreground">{Math.round(k.confidence * 100)}%</span></div>
                  <div className="h-1 rounded-sm bg-muted"><div className="h-1 rounded-sm bg-primary" style={{ width: `${Math.round(k.confidence * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-3 border-t pt-3 text-center">
              {([["Repos", s.totals.repos], ["Commits", s.totals.commits], ["PRs", s.totals.pullRequests]] as const).map(([k, v]) => (
                <div key={k} className="flex flex-col-reverse"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-mono text-base font-medium">{v}</dd></div>
              ))}
            </dl>
            <Link href="/profile" className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline">Open your Developer Profile</Link>
          </div>

          <div className="rounded-md border bg-card p-4">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Bot className="size-4" aria-hidden /> Your AI Agent Team</h2>
            <p className="mb-3 text-xs text-muted-foreground">Specialist agents that share your profile as memory.</p>
            <ul className="flex flex-col gap-2 text-sm">
              {AGENTS.map((a) => (
                <li key={a.name} className="flex items-center gap-2">
                  <span className={cn("size-1.5 rounded-full", STATUS[a.status][1])} aria-hidden />
                  <span className="flex-1">{a.name}<span className="block text-[11px] text-muted-foreground">{a.tool}</span></span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">{STATUS[a.status][0]}</span>
                </li>
              ))}
            </ul>
          </div>

          {profile.struggles.length > 0 && (
            <div className="rounded-md border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">Working On</h2>
              <ul className="list-disc pl-4 text-sm marker:text-muted-foreground">{profile.struggles.slice(0, 4).map((x) => <li key={x.topic}>{x.topic}</li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const LEVELS = [{ at: 0, name: "Starter" }, { at: 40, name: "Rising" }, { at: 70, name: "Strong" }, { at: 90, name: "All-star" }];

/** Goal-gradient meter: progress you already have counts (endowed progress), with the level marks visible. */
function StrengthMeter({ score }: { score: number }) {
  return (
    <div className="mt-5" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label="Profile strength">
      <div className="relative h-2 overflow-hidden rounded-sm bg-muted">
        <div className="h-2 bg-primary transition-[width] duration-500" style={{ width: `${score}%` }} />
        {LEVELS.slice(1).map((l) => <span key={l.at} className="absolute top-0 h-2 w-0.5 bg-card" style={{ left: `${l.at}%` }} aria-hidden />)}
      </div>
      <div className="mt-1.5 grid grid-cols-[40fr_30fr_20fr_10fr] font-mono text-[10px] text-muted-foreground uppercase">
        {LEVELS.map((l, i) => <span key={l.at} className={cn("whitespace-nowrap", i === LEVELS.length - 1 && "w-max justify-self-end", score >= l.at && "text-foreground")}>{l.name}</span>)}
      </div>
    </div>
  );
}
