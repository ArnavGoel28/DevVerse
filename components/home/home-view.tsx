"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

import { Avatar } from "@/components/community/parts";
import { readLocal } from "@/components/use-local";
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
const STATUS = { now: ["Active", "bg-emerald-500"], next: ["Preview", "bg-amber-400"], later: ["Coming", "bg-muted-foreground/40"] } as const;

/** DI-09 across all tools: one next best action per tool, from the profile. */
export function buildActions(profile: DeveloperProfile, posts: Post[], solved: Set<string>, now: number): Action[] {
  const actions: Action[] = [];
  const topStruggle = profile.struggles[0]?.topic;
  actions.push({ slug: "mentor", title: topStruggle ? `Ask about "${topStruggle}"` : "Ask your mentor anything", detail: "Your mentor answers using your own history.", href: "/mentor", cta: "Open mentor" });
  const learn = profile.recommendations.find((r) => r.type === "learn");
  actions.push({ slug: "learn", title: learn?.title ?? "Build your personal roadmap", detail: learn?.reason ?? "Pick a goal; steps tick off from your real work.", href: "/learn", cta: "Open Learn" });
  const rec = recommend(PROBLEMS, profile, solved, 1)[0];
  if (rec) actions.push({ slug: "practice", title: `Solve "${rec.problem.title}"`, detail: rec.reason, href: "/practice", cta: "Practise" });
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
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">{greeting(new Date(now).getHours())},</p>
            <h2 className="text-2xl font-bold sm:text-3xl">{s.login} 👋</h2>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              Your profile is <b>{strength.level}</b>.{" "}
              {strength.nextLevelAt ? `${strength.nextLevelAt - strength.score} points to the next level. Here's how:` : "You've maxed it out. Keep it fresh."}
            </p>
            {strength.next.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {strength.next.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-white/25">
                      +{n.points} · {n.label} <ArrowRight className="size-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <StrengthRing score={strength.score} />
        </div>
      </section>
    <div className="grid gap-6 lg:grid-cols-[250px_1fr] 2xl:grid-cols-[260px_1fr_280px]">
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            {s.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.avatarUrl} alt="" className="size-12 rounded-full" />
            ) : (
              <Avatar name={s.login} size={12} />
            )}
            <div>
              <p className="font-semibold">{s.login}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.level} · {profile.focusAreas.slice(0, 2).join(", ") || "Developer"}</p>
            </div>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{profile.summary}</p>
          <div className="flex flex-col gap-2">
            {skills.map((k) => (
              <div key={k.id}>
                <div className="flex justify-between text-xs"><span>{k.name}</span><span className="text-muted-foreground">{Math.round(k.confidence * 100)}%</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.round(k.confidence * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          <Link href="/profile" className="mt-3 inline-block text-sm text-primary hover:underline">Full Developer Profile →</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Repos", s.totals.repos], ["Commits", s.totals.commits], ["PRs", s.totals.pullRequests]].map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-card p-2"><p className="text-lg font-semibold">{v}</p><p className="text-[11px] text-muted-foreground">{k}</p></div>
          ))}
        </div>
      </aside>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your next best moves</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {actions.map((a, i) => {
            const mod = getModule(a.slug);
            const Icon = mod?.icon;
            const top = i === 0; // Von Restorff: one clearly highlighted "Top pick"
            return (
              <li key={a.slug} className={cn("animate-fade-up", top && "md:col-span-2")} style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={a.href} className={cn("card-lift group flex h-full flex-col rounded-2xl border bg-card p-4", top && "ring-brand shadow-lg shadow-primary/10")}>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className={cn("flex size-7 items-center justify-center rounded-lg", top ? "bg-brand text-white" : "bg-primary/10 text-primary")}>{Icon && <Icon className="size-4" />}</span>
                    {mod?.name}
                    {top && <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">TOP PICK</span>}
                  </p>
                  <p className="mb-1 font-semibold">{a.title}</p>
                  <p className="mb-3 flex-1 text-sm text-muted-foreground">{a.detail}</p>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">{a.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="grid gap-4 sm:grid-cols-2 lg:col-span-2 2xl:col-span-1 2xl:flex 2xl:flex-col">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Bot className="size-4 text-primary" /> Your AI agent team</h2>
          <p className="mb-3 text-xs text-muted-foreground">Specialist agents that share your profile as memory.</p>
          <ul className="flex flex-col gap-2 text-sm">
            {AGENTS.map((a) => (
              <li key={a.name} className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", STATUS[a.status][1])} aria-hidden />
                <span className="flex-1">{a.name}<span className="block text-[11px] text-muted-foreground">{a.tool}</span></span>
                <span className="text-[11px] text-muted-foreground">{STATUS[a.status][0]}</span>
              </li>
            ))}
          </ul>
        </div>
        {profile.struggles.length > 0 && (
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Working on</h2>
            <ul className="flex flex-col gap-1 text-sm">{profile.struggles.slice(0, 4).map((x) => <li key={x.topic}>• {x.topic}</li>)}</ul>
          </div>
        )}
      </aside>
    </div>
    </div>
  );
}

/** Goal-gradient ring: progress you already have counts (endowed progress), so the next level feels close. */
function StrengthRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 shrink-0" role="img" aria-label={`Profile strength ${score} out of 100`}>
      <svg viewBox="0 0 110 110" className="size-32 -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-[11px] text-white/80">profile strength</span>
      </div>
    </div>
  );
}
