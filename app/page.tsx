"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { GitHubIcon } from "@/components/github-icon";
import { Menu, X } from "@/components/icons";
import { LiveDemo } from "@/components/landing/live-demo";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Connect GitHub", text: "Sign in with GitHub. DevVerse gets read-only access to your public profile and reads your repositories, languages, commits, pull requests and open-source work." },
  { title: "Check your Developer Profile", text: "Each skill comes with the evidence behind it. Mark anything wrong and it stops counting. Struggles and growth update as you work." },
  { title: "Work with agents that know you", text: "The mentor, practice coach, code reviewer and DevOps agent all read the same profile, so their advice starts from what you have actually built." },
];

const NAV = [
  { href: "#demo", label: "Live demo" },
  { href: "#how", label: "How it works" },
  { href: "#tools", label: "Tools" },
];

export default function LandingPage() {
  const { user, loading, configured, error, signInWithGitHub } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  const tools = MODULES.filter((m) => m.slug !== "home");
  const signIn = configured ? (
    <Button onClick={signInWithGitHub} disabled={loading || !!user}>
      <GitHubIcon /> {loading ? "Checking sign-in…" : "Sign in with GitHub"}
    </Button>
  ) : (
    <Button onClick={() => router.push("/home")}>Open the app</Button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((n) => <a key={n.href} href={n.href} className="text-muted-foreground hover:text-foreground">{n.label}</a>)}
            {signIn}
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="landing-menu" aria-label={menu ? "Close menu" : "Open menu"}>
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
        <nav id="landing-menu" aria-label="Main" className={cn("flex-col gap-1 border-t px-4 py-3 md:hidden", menu ? "flex" : "hidden")}>
          {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="rounded-md px-2 py-2 text-sm hover:bg-accent">{n.label}</a>)}
          <div className="pt-2">{signIn}</div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">For students and working developers</p>
            <h1 className="text-[34px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
              Ten developer tools that share one memory of your work.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              DevVerse builds a Developer Profile from your GitHub history. Learning, practice, code review, CI debugging, community and jobs then use that profile, so every suggestion fits what you have built and where you get stuck.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {signIn}
              <a href="#demo" className="text-sm font-medium text-primary underline-offset-4 hover:underline">or try the live demo first</a>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">Read-only GitHub access. Free to use. You can ask us to delete your data at any time.</p>
          </div>
          <div id="demo" className="scroll-mt-20">
            <p className="mb-2 text-sm font-medium">Live demo: build a profile from any public GitHub account</p>
            <LiveDemo />
          </div>
        </section>

        <section id="how" className="scroll-mt-16 border-t bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[240px_minmax(0,1fr)]">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <ol className="flex flex-col divide-y">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                  <div>
                    <p className="mb-1 font-medium">{s.title}</p>
                    <p className="text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="tools" className="scroll-mt-16 border-t">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">The tools</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ten tools on one profile, run by an orchestrator and nine specialist AI agents.</p>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {tools.map(({ slug, name, tagline }) => (
                <div key={slug} className="border-b py-3">
                  <dt className="font-medium">{name}</dt>
                  <dd className="text-sm text-muted-foreground">{tagline}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
