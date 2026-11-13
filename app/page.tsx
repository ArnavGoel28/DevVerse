"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Bot, GitBranch, Sparkles, Target } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { GitHubIcon } from "@/components/github-icon";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/modules";

const STEPS = [
  { icon: GitBranch, title: "Connect GitHub", text: "We read your whole history: repos, languages, PRs and open-source work." },
  { icon: Target, title: "Get your Developer Profile", text: "Skills with proof, struggles you keep hitting, growth over time. Every item shows why." },
  { icon: Bot, title: "Let 9 AI agents guide you", text: "Mentor, practice coach, code reviewer, DevOps… all tuned to you, across 10 tools." },
];

const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  const { user, loading, configured, error, signInWithGitHub } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/home");
  }, [user, router]);

  const tools = MODULES.filter((m) => m.slug !== "home");

  return (
    <main className="bg-app min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-md">DV</span>
          <span className="text-lg font-bold">Dev<span className="text-brand">Verse</span></span>
        </span>
        <span className="hidden rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur sm:block">Built on Google Gemini · Firebase · Cloud Run</span>
      </header>

      <motion.section initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pt-10 pb-16 text-center sm:pt-16">
        <motion.span variants={fade} className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="size-3.5 text-primary" /> One platform. Ten tools. An AI team that knows you.
        </motion.span>
        <motion.h1 variants={fade} className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
          Stop juggling 10 tools.<br />
          <span className="text-brand">Grow as a developer in one place.</span>
        </motion.h1>
        <motion.p variants={fade} className="max-w-2xl text-lg text-muted-foreground">
          Learn, practise, code, get help, grow your GitHub, find jobs and ship, guided by AI agents that read your real work, not a blank chat.
        </motion.p>
        <motion.div variants={fade} className="flex flex-col items-center gap-3 sm:flex-row">
          {configured ? (
            <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25" onClick={signInWithGitHub} disabled={loading || !!user}>
              <GitHubIcon /> {loading ? "Loading…" : "Continue with GitHub"}
            </Button>
          ) : (
            <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25" onClick={() => router.push("/home")}>
              Try it with any GitHub username <ArrowRight />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{configured ? "Free · read-only GitHub access" : "Preview mode · no sign-up needed"}</span>
        </motion.div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </motion.section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <motion.ul initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ staggerChildren: 0.04 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tools.map(({ slug, name, tagline, icon: Icon }) => (
            <motion.li key={slug} variants={fade} className="card-lift rounded-2xl border bg-card/90 p-4 backdrop-blur">
              <span className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
              <p className="font-semibold">{name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tagline}</p>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.li key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative rounded-2xl border bg-card p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{i + 1}</span>
              <Icon className="mb-3 size-6 text-primary" />
              <p className="mb-1 font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </main>
  );
}
