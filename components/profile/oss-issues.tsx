"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleDot, ExternalLink, Loader2, MessageSquare, RefreshCw } from "@/components/icons";

import { apiJson, type ApiAuth } from "@/components/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeveloperProfile, OssIssue } from "@/lib/types";

// GH-10: open issues matched to the user's languages and level.
export function OssIssues({ auth }: { auth: ApiAuth }) {
  const [issues, setIssues] = useState<OssIssue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setIssues((await apiJson<{ issues: OssIssue[] }>("/api/github/issues", auth, { body: {} })).issues);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
    // load once per profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.profile?.updatedAt]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Open-source issues for you</CardTitle>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={busy}>
            <RefreshCw className={busy ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
        <CardDescription>
          Open issues in public projects that use your languages, picked for your level. Comment on the issue before
          you start, then open a small pull request.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && !issues && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching GitHub…
          </p>
        )}
        {issues && !issues.length && <p className="text-sm text-muted-foreground">No matching issues right now. Try again later.</p>}
        {issues?.map((i) => (
          <a
            key={i.url}
            href={i.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col gap-1 rounded-md border px-3 py-2 hover:bg-muted/60"
          >
            <div className="flex items-start gap-2">
              <CircleDot className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-sm font-medium">{i.title}</span>
              <ExternalLink className="ml-auto mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-6 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{i.repo}</span>
              <Badge variant="outline">{i.language}</Badge>
              {i.labels.slice(0, 3).map((l) => (
                <Badge key={l} variant="secondary">
                  {l}
                </Badge>
              ))}
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" /> {i.comments}
              </span>
            </div>
            <p className="pl-6 text-xs text-muted-foreground">{i.reason}</p>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

/** GH-11 (lean): GitHub growth tips from the profile's recommendations. */
export function GitHubTips({ profile }: { profile: DeveloperProfile }) {
  const tips = profile.recommendations.filter((r) => r.type === "github" || r.type === "contribute");
  if (!tips.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tips to grow your GitHub</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tips.map((t) => {
          const inner = (
            <>
              <span className="text-sm font-medium">{t.title}</span>
              <span className="text-xs text-muted-foreground">{t.reason}</span>
            </>
          );
          return t.href && !t.href.startsWith("/github") ? (
            t.href.startsWith("/") ? (
              <Link key={t.title} href={t.href} className="flex flex-col gap-0.5 rounded-md border px-3 py-2 hover:bg-muted/60">
                {inner}
              </Link>
            ) : (
              <a key={t.title} href={t.href} target="_blank" rel="noreferrer" className="flex flex-col gap-0.5 rounded-md border px-3 py-2 hover:bg-muted/60">
                {inner}
              </a>
            )
          ) : (
            <div key={t.title} className="flex flex-col gap-0.5 rounded-md border px-3 py-2">
              {inner}
            </div>
          );
        })}
        <Link href="/mentor" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Ask the mentor how to improve your GitHub <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
