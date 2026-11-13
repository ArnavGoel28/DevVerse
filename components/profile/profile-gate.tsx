"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "@/components/icons";

import { GitHubIcon } from "@/components/github-icon";
import type { useProfile } from "@/components/profile/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { DeveloperProfile } from "@/lib/types";

type ProfileState = ReturnType<typeof useProfile>;

/** Shows loading / import / demo states, and renders `children` once a profile exists. */
export function ProfileGate({
  state,
  children,
}: {
  state: ProfileState;
  children: (profile: DeveloperProfile) => React.ReactNode;
}) {
  const { mode, profile, status, error } = state;

  if (status === "loading") return <PageSkeleton />;

  if (status === "importing" && !profile)
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <p className="text-sm text-muted-foreground">Reading your GitHub history and building your profile. This takes up to a minute…</p>
        <PageSkeleton />
      </div>
    );

  if (profile) {
    return (
      <div className="flex flex-col gap-4">
        {error && <ErrorNote>{error}</ErrorNote>}
        <SourceBar state={state} profile={profile} />
        {children(profile)}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-8">
      {error && <ErrorNote>{error}</ErrorNote>}
      {mode === "account" ? <ImportCard state={state} /> : <DemoCard state={state} />}
    </div>
  );
}

function ImportCard({ state }: { state: ProfileState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Your Developer Profile</CardTitle>
        <CardDescription>
          We read your whole GitHub history: repositories, languages, commits, pull requests and open-source work,
          and turn it into skills, struggles and growth you can check and correct.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => void state.importNow()} disabled={state.status === "importing"}>
          <GitHubIcon className="size-4" /> Import My GitHub History
        </Button>
      </CardContent>
    </Card>
  );
}

export function DemoForm({ state, compact = false }: { state: ProfileState; compact?: boolean }) {
  const [login, setLogin] = useState("");
  const busy = state.status === "importing";
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (login.trim()) void state.runDemo(login.trim());
      }}
    >
      <input
        aria-label="GitHub username"
        className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        name="login" autoComplete="off" spellCheck={false} placeholder="GitHub username, e.g. octocat…"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        maxLength={39}
      />
      <Button type="submit" size={compact ? "sm" : "default"} disabled={busy || !login.trim()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon className="size-4" />}
        {busy ? "Building…" : "Build profile"}
      </Button>
    </form>
  );
}

function DemoCard({ state }: { state: ProfileState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Try It with Any GitHub Username</CardTitle>
        <CardDescription>
          See the Developer Profile DevVerse builds from public GitHub activity. Nothing is saved. Sign in with GitHub
          to import your full history, including contribution counts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DemoForm state={state} />
      </CardContent>
    </Card>
  );
}

function SourceBar({ state, profile }: { state: ProfileState; profile: DeveloperProfile }) {
  const updated = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(profile.updatedAt));
  const busy = state.status === "importing";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <span>
        {state.mode === "demo" ? "Demo from public data" : "From your GitHub"} · @{profile.githubStats.login} · updated{" "}
        {updated} · {profile.generatedBy === "gemini" ? "written with Gemini" : "rules-based (no AI key)"}
        {profile.githubStats.source === "public" && " · public data only"}
      </span>
      {state.mode === "account" ? (
        <Button size="sm" variant="outline" onClick={() => void state.importNow()} disabled={busy}>
          <RefreshCw className={busy ? "size-3.5 animate-spin" : "size-3.5"} /> Re-import
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={state.clearDemo} disabled={busy}>
          Try Another Username
        </Button>
      )}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}
