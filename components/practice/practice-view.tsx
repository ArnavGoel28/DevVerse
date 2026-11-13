"use client";

import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { CheckCircle2, Circle, Lightbulb, Loader2, Play, Send, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";

import { type ApiAuth, apiJson, apiRequest } from "@/components/api";
import { Markdown } from "@/components/markdown";
import { runInWorker } from "@/components/practice/run-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Difficulty, PROBLEMS, type PracticeProblem, TOPIC_NAMES } from "@/lib/practice/catalog";
import type { HintLevel } from "@/lib/practice/coach";
import { type JudgeResult, VERDICT_LABEL } from "@/lib/practice/judge";
import { recommend } from "@/lib/practice/recommend";
import type { DeveloperProfile } from "@/lib/types";

const SOLVED_KEY = "devverse.practice.solved";
const CODE_KEY = (id: string) => `devverse.practice.code.${id}`;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: progress just isn't remembered
  }
}

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: "text-emerald-700 dark:text-emerald-400",
  medium: "text-amber-700 dark:text-amber-400",
  hard: "text-rose-700 dark:text-rose-400",
};

type Hint = { level: HintLevel; text: string; mode: string };

// PR-01…PR-06: problems, recommendations, browser judge and the Practice Coach agent.
export function PracticeView({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  // Rendered only on the client (ProfileGate waits for the profile), so reading localStorage here is safe.
  const [solved, setSolved] = useState<Set<string>>(() => new Set(load<string[]>(SOLVED_KEY, [])));
  const [selectedId, setSelectedId] = useState(PROBLEMS[0].id);
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [topic, setTopic] = useState("all");

  const recs = useMemo(() => recommend(PROBLEMS, profile, solved), [profile, solved]);
  const list = PROBLEMS.filter((q) => (difficulty === "all" || q.difficulty === difficulty) && (topic === "all" || q.topics.includes(topic)));
  const problem = PROBLEMS.find((q) => q.id === selectedId) ?? PROBLEMS[0];

  const markSolved = (id: string) => {
    setSolved((prev) => {
      const next = new Set(prev).add(id);
      save(SOLVED_KEY, [...next]);
      return next;
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" /> Recommended for you
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">Picked by the Practice Coach from your level and what you haven&apos;t solved.</p>
          {recs.length === 0 ? (
            <p className="text-sm">You&apos;ve solved every problem. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recs.map((r) => (
                <li key={r.problem.id}>
                  <button className="w-full rounded-lg border p-2 text-left text-sm hover:bg-muted" onClick={() => setSelectedId(r.problem.id)}>
                    <span className="font-medium">{r.problem.title}</span>
                    <span className="block text-xs text-muted-foreground">{r.reason}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">All problems</h2>
            <span className="text-xs text-muted-foreground">{solved.size}/{PROBLEMS.length} solved</span>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <select aria-label="Difficulty" className="rounded-md border bg-background px-2 py-1 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "all" | Difficulty)}>
              <option value="all">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select aria-label="Topic" className="rounded-md border bg-background px-2 py-1 text-sm" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="all">All topics</option>
              {Object.entries(TOPIC_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <ul className="flex flex-col">
            {list.map((q) => (
              <li key={q.id}>
                <button
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${q.id === problem.id ? "bg-muted font-medium" : ""}`}
                  onClick={() => setSelectedId(q.id)}
                >
                  {solved.has(q.id) ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-label="Solved" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1 truncate">{q.title}</span>
                  <span className={`text-xs capitalize ${DIFF_STYLE[q.difficulty]}`}>{q.difficulty}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-2 text-sm text-muted-foreground">No problems match these filters.</li>}
          </ul>
        </section>
      </aside>

      <ProblemPanel key={problem.id} auth={auth} problem={problem} solved={solved.has(problem.id)} onSolved={() => markSolved(problem.id)} />
    </div>
  );
}

function ProblemPanel({ auth, problem, solved, onSolved }: { auth: ApiAuth; problem: PracticeProblem; solved: boolean; onSolved: () => void }) {
  // Keyed by problem id, so this state resets per problem; client-only render (see PracticeView).
  const [code, setCode] = useState(() => load(CODE_KEY(problem.id), problem.starter));
  const [busy, setBusy] = useState<"run" | "submit" | "hint" | null>(null);
  const [result, setResult] = useState<(JudgeResult & { kind: "run" | "submit" }) | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [dark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"), // follow the app theme, not the OS
  );

  const onChange = (v?: string) => {
    setCode(v ?? "");
    save(CODE_KEY(problem.id), v ?? "");
  };

  const run = async (kind: "run" | "submit") => {
    setBusy(kind);
    setNote(null);
    const r = await runInWorker(code, problem.fn, kind === "run" ? problem.samples : problem.tests);
    setResult({ ...r, kind });
    if (kind === "submit") {
      if (r.verdict === "accepted") {
        onSolved();
        toast.success(`Accepted! ${problem.title} solved 🎉`, { description: "Added to your progress. Your profile strength just went up." });
      }
      try {
        const res = await apiRequest("/api/practice/submit", auth, {
          body: { problemId: problem.id, code, verdict: r.verdict, passed: r.passed, total: r.total, hintsUsed: hints.length },
        });
        const data = (await res.json().catch(() => ({}))) as { saved?: boolean };
        if (data.saved) setNote("Saved to your Developer Profile as evidence.");
        else if (auth.mode === "demo") setNote("Demo mode: progress is kept in this browser. Sign in to add it to your profile.");
      } catch {
        // judging already happened locally; saving is best-effort
      }
    }
    setBusy(null);
  };

  const askHint = async () => {
    const level = Math.min(hints.length + 1, 3) as HintLevel;
    setBusy("hint");
    try {
      const data = await apiJson<{ hint: string; mode: string }>("/api/practice/hint", auth, { body: { problemId: problem.id, code, level } });
      setHints((h) => [...h, { level, text: data.hint, mode: data.mode }]);
    } catch (e) {
      setHints((h) => [...h, { level, text: problem.hints[level - 1], mode: "offline" }]);
      setNote(e instanceof Error ? e.message : null);
    }
    setBusy(null);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{problem.title}</h2>
          <span className={`text-sm font-medium capitalize ${DIFF_STYLE[problem.difficulty]}`}>{problem.difficulty}</span>
          {problem.topics.map((t) => (
            <Badge key={t} variant="secondary">{TOPIC_NAMES[t] ?? t}</Badge>
          ))}
          {solved && <Badge className="bg-emerald-600 text-white">Solved</Badge>}
        </div>
        <Markdown>{problem.statement}</Markdown>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {problem.samples.map((s, i) => (
            <div key={i} className="rounded-md bg-muted p-2 font-mono text-xs">
              <div>{problem.fn}({s.args.map((a) => JSON.stringify(a)).join(", ")})</div>
              <div className="text-muted-foreground">→ {JSON.stringify(s.expected)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          <span>JavaScript · runs in your browser, not on our servers</span>
          <button className="hover:text-foreground" onClick={() => onChange(problem.starter)}>Reset code</button>
        </div>
        <Editor
          height="300px"
          language="javascript"
          theme={dark ? "vs-dark" : "light"}
          value={code}
          onChange={onChange}
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true }}
          loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => run("run")} disabled={!!busy}>
          {busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run samples
        </Button>
        <Button onClick={() => run("submit")} disabled={!!busy}>
          {busy === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit
        </Button>
        <Button variant="ghost" onClick={askHint} disabled={!!busy || hints.length >= 3}>
          {busy === "hint" ? <Loader2 className="animate-spin" /> : <Lightbulb />}
          {hints.length >= 3 ? "No more hints" : `Hint ${hints.length + 1} of 3`}
        </Button>
      </div>

      {result && <ResultPanel result={result} />}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      {hints.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-amber-500" /> Practice Coach
          </h3>
          <ol className="flex flex-col gap-2 text-sm">
            {hints.map((h) => (
              <li key={h.level}>
                <span className="font-medium">Hint {h.level}:</span> {h.text}
                {h.mode !== "gemini" && <span className="ml-1 text-xs text-muted-foreground">(offline hint)</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ResultPanel({ result }: { result: JudgeResult & { kind: "run" | "submit" } }) {
  const ok = result.verdict === "accepted";
  return (
    <div className={`${ok ? "animate-pop " : ""}rounded-xl border p-4 ${ok ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" : "border-rose-300 bg-rose-50 dark:bg-rose-950/30"}`}>
      <div className="mb-2 flex items-center gap-2 font-semibold">
        {ok ? <CheckCircle2 className="size-5 text-emerald-600" /> : <XCircle className="size-5 text-rose-600" />}
        {VERDICT_LABEL[result.verdict]}
        <span className="text-sm font-normal text-muted-foreground">
          {result.passed}/{result.total} {result.kind === "run" ? "sample tests" : "tests"} passed
        </span>
      </div>
      {result.error && <p className="mb-2 font-mono text-xs">{result.error}</p>}
      <ul className="flex flex-col gap-1 font-mono text-xs">
        {result.results.filter((t) => !t.passed).slice(0, 3).map((t) => (
          <li key={t.index}>
            Test {t.index + 1}: expected {t.expected}, {t.error ? `threw "${t.error}"` : `got ${t.got}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
