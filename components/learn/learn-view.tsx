"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, ExternalLink, Loader2, Sparkles, Swords } from "lucide-react";

import { apiJson, readSession, writeSession, type ApiAuth } from "@/components/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPacks, markProgress, setStepManual, suggestGoal } from "@/lib/learn/roadmap";
import type { DeveloperProfile, Roadmap } from "@/lib/types";
import { cn } from "@/lib/utils";

// LN-01 roadmap, LN-02 progress from evidence, LN-03 learning packs (journey J3).

const KEY = "devverse.demoRoadmap";

export function LearnView({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [goal, setGoal] = useState(() => suggestGoal(profile));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r =
          auth.mode === "account"
            ? (await apiJson<{ roadmap: Roadmap | null }>("/api/learn/roadmap", auth)).roadmap
            : (() => {
                const saved = readSession<Roadmap>(KEY);
                return saved ? markProgress(saved, profile) : null;
              })();
        if (cancelled) return;
        setRoadmap(r);
        if (r) setGoal(r.goal);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // load once per signed-in user / demo profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.mode, auth.user, profile.updatedAt]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiJson<{ roadmap: Roadmap; mode: string }>("/api/learn/roadmap", auth, { body: { goal } });
      setRoadmap(r.roadmap);
      setMode(r.mode);
      if (auth.mode === "demo") writeSession(KEY, r.roadmap);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(stepId: string, done: boolean | null) {
    if (!roadmap) return;
    const before = roadmap;
    const next = setStepManual(roadmap, stepId, done, profile);
    setRoadmap(next);
    if (auth.mode === "demo") return writeSession(KEY, next);
    try {
      await apiJson("/api/learn/step", auth, { method: "PATCH", body: { stepId, done } });
    } catch (e) {
      setRoadmap(before);
      setError((e as Error).message);
    }
  }

  const packs = buildPacks(profile);
  const doneCount = roadmap?.steps.filter((s) => s.status === "done").length ?? 0;
  const nextId = roadmap?.steps.find((s) => s.status !== "done")?.id;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Your goal</CardTitle>
          <CardDescription>
            Gemini plans the steps for your profile and finds free resources on the web. Steps tick themselves off when
            your work shows the skill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void generate();
            }}
          >
            <input
              aria-label="Your goal"
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={goal}
              maxLength={100}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Backend developer internship"
            />
            <Button type="submit" disabled={busy || goal.trim().length < 3}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {busy ? "Planning…" : roadmap ? "Rebuild roadmap" : "Build my roadmap"}
            </Button>
          </form>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your roadmap…
        </div>
      ) : (
        roadmap && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Roadmap: {roadmap.goal}</CardTitle>
                <Badge variant="secondary">
                  {doneCount}/{roadmap.steps.length} done
                </Badge>
                <Badge variant="outline">{roadmap.source === "ai" ? "Personalised by Gemini" : "Curated"}</Badge>
              </div>
              {mode && mode !== "gemini" && roadmap.source !== "ai" && (
                <CardDescription>Showing the curated roadmap ({mode.replace("curated", "").replace(/[()]/g, "").trim() || "AI not configured"}).</CardDescription>
              )}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${(doneCount / roadmap.steps.length) * 100}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {roadmap.steps.map((s, i) => (
                  <li
                    key={s.id}
                    className={cn("flex gap-3 rounded-md border px-3 py-3", s.id === nextId && "border-primary/60 bg-primary/5")}
                  >
                    <button
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
                      aria-label={s.status === "done" ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}
                      onClick={() => void toggle(s.id, s.status !== "done")}
                    >
                      {s.status === "done" ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5" />}
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-sm font-medium", s.status === "done" && "text-muted-foreground line-through")}>
                          {i + 1}. {s.title}
                        </span>
                        {s.id === nextId && <Badge>Next</Badge>}
                        {s.doneBy === "evidence" && <Badge variant="secondary">Shown in your work</Badge>}
                        {s.manual && (
                          <button className="text-xs text-muted-foreground underline" onClick={() => void toggle(s.id, null)}>
                            let my activity decide
                          </button>
                        )}
                      </div>
                      {s.why && <p className="text-xs text-muted-foreground">{s.why}</p>}
                      {s.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {s.resources.map((r) => (
                            <a
                              key={r.url}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                            >
                              <BookOpen className="size-3" /> {r.title} <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Learning packs for your struggles</h2>
        {!packs.length && <p className="text-sm text-muted-foreground">No struggles detected — nothing to fix right now.</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <Card key={p.topic}>
              <CardHeader>
                <CardTitle className="text-base">{p.topic}</CardTitle>
                <CardDescription>{p.why}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm">{p.explainer}</p>
                <div className="flex flex-col gap-1.5">
                  {p.resources.map((r) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <BookOpen className="size-3.5" /> {r.title}
                    </a>
                  ))}
                  <Link href={p.practiceHref} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Swords className="size-3.5" /> Practice problems
                  </Link>
                  <Link href={`/mentor`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Sparkles className="size-3.5" /> Ask the mentor to explain it
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
