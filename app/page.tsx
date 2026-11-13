"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Sparkles, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { GitHubIcon } from "@/components/github-icon";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  {
    icon: UserRound,
    title: "Your Developer Profile",
    text: "Skills, struggles and growth, built from your whole GitHub history.",
  },
  {
    icon: Sparkles,
    title: "A mentor that knows you",
    text: "Ask what to learn next and get an answer based on your own work.",
  },
  {
    icon: GitBranch,
    title: "Grow your GitHub",
    text: "See your GitHub like a recruiter does, and find open-source issues you can solve.",
  },
];

export default function LandingPage() {
  const { user, loading, configured, error, signInWithGitHub } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Built with Gemini and Firebase
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Dev<span className="text-primary">Verse</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn, build, get help, share and ship in one place, guided by an AI mentor that actually
          knows you.
        </p>

        {configured ? (
          <Button size="lg" onClick={signInWithGitHub} disabled={loading || !!user}>
            <GitHubIcon />
            {loading ? "Loading…" : "Continue with GitHub"}
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="max-w-md rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Sign-in isn&apos;t set up yet. Add the Firebase settings to <code>.env.local</code>{" "}
              (see <code>.env.example</code>) and restart the app.
            </p>
            <Button variant="outline" onClick={() => router.push("/home")}>
              Preview the app without signing in
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="size-5 text-primary" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
