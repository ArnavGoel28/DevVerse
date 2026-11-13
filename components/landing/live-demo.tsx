"use client";

import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { githubAvatar } from "@/lib/avatar";
import type { DeveloperProfile } from "@/lib/types";

const EXAMPLES = ["octocat", "gaearon", "sindresorhus"];

type State = { status: "idle" } | { status: "loading"; login: string } | { status: "error"; message: string } | { status: "ready"; profile: DeveloperProfile };

/** V18: the real profile builder, run on any public GitHub account. Nothing is stored. */
export function LiveDemo() {
  const [login, setLogin] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function build(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (!clean) {
      setState({ status: "error", message: "Type a GitHub username first, for example octocat." });
      return;
    }
    setLogin(clean);
    setState({ status: "loading", login: clean });
    try {
      const res = await fetch("/api/profile/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: clean }) });
      const data = (await res.json().catch(() => ({}))) as { profile?: DeveloperProfile; error?: string };
      if (!res.ok || !data.profile) throw new Error(data.error ?? `The demo failed (${res.status}). Try again in a minute.`);
      setState({ status: "ready", profile: data.profile });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Couldn't reach DevVerse. Check your connection and try again." });
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <form
        className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void build(login);
        }}
      >
        <label htmlFor="demo-login" className="font-mono text-xs text-muted-foreground sm:w-28">github.com/</label>
        <input
          id="demo-login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="any public username"
          autoComplete="off"
          spellCheck={false}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" disabled={state.status === "loading"}>{state.status === "loading" ? "Reading history…" : "Build profile"}</Button>
      </form>
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
        Try:
        {EXAMPLES.map((x) => (
          <button key={x} type="button" onClick={() => void build(x)} disabled={state.status === "loading"} className="rounded-sm border px-1.5 py-px font-mono hover:border-primary/50 hover:text-primary disabled:opacity-50">
            {x}
          </button>
        ))}
      </div>

      <div className="p-4" aria-live="polite">
        {state.status === "idle" && (
          <p className="text-sm text-muted-foreground">
            DevVerse reads the account&apos;s public repositories, languages, commits and pull requests, then writes a profile with the evidence behind each skill. It takes about ten seconds and nothing is saved.
          </p>
        )}
        {state.status === "loading" && <DemoSkeleton login={state.login} />}
        {state.status === "error" && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{state.message}</p>}
        {state.status === "ready" && <DemoResult profile={state.profile} />}
      </div>
    </div>
  );
}

function DemoSkeleton({ login }: { login: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <p className="text-xs text-muted-foreground">Reading github.com/{login}…</p>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
      </div>
      <Skeleton className="h-12 w-full" />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
    </div>
  );
}

function DemoResult({ profile }: { profile: DeveloperProfile }) {
  const s = profile.githubStats;
  const skills = profile.skills.slice(0, 5);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {s.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={githubAvatar(s.avatarUrl, 80)} alt="" width={40} height={40} loading="lazy" className="size-10 rounded-full border" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{s.login}</p>
          <p className="font-mono text-xs text-muted-foreground">{s.totals.repos} repos · {s.totals.commits} commits · {s.totals.pullRequests} PRs</p>
        </div>
      </div>
      <p className="text-sm">{profile.summary}</p>
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Skills, with the evidence</p>
        <ul className="flex flex-col gap-2.5">
          {skills.map((k) => (
            <li key={k.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{k.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{Math.round(k.confidence * 100)}%</span>
              </div>
              <div className="my-1 h-1 rounded-sm bg-muted"><div className="h-1 rounded-sm bg-primary" style={{ width: `${Math.round(k.confidence * 100)}%` }} /></div>
              <p className="text-xs text-muted-foreground">{k.why}</p>
            </li>
          ))}
        </ul>
      </div>
      {profile.githubInsights.gaps.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">What a recruiter would flag</p>
          <ul className="list-disc pl-4 text-sm marker:text-muted-foreground">{profile.githubInsights.gaps.slice(0, 3).map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
