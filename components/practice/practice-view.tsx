"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";

import { type ApiAuth, apiJson, apiRequest } from "@/components/api";
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, Lightbulb, Loader2, Play, RefreshCw, XCircle } from "@/components/icons";
import { Markdown } from "@/components/markdown";
import { runInWorker } from "@/components/practice/run-code";
import { Button } from "@/components/ui/button";
import { type Difficulty, PROBLEMS, type PracticeProblem, TOPIC_NAMES } from "@/lib/practice/catalog";
import type { HintLevel } from "@/lib/practice/coach";
import { type JudgeResult, VERDICT_LABEL } from "@/lib/practice/judge";
import { recommend } from "@/lib/practice/recommend";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOLVED_KEY = "devverse.practice.solved";
const CODE_KEY = (id: string) => `devverse.practice.code.${id}`;
const SUBS_KEY = (id: string) => `devverse.practice.subs.${id}`;

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

// D-33: the conventional easy / medium / hard colours people know from problem sites, in our own tokens.
const DIFF_STYLE: Record<Difficulty, string> = { easy: "text-success", medium: "text-highlight", hard: "text-destructive" };
const DIFF_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const number = (id: string) => PROBLEMS.findIndex((p) => p.id === id) + 1;

type Hint = { level: HintLevel; text: string; mode: string };
type Submission = { at: string; verdict: JudgeResult["verdict"]; passed: number; total: number };

// PR-01…PR-06: problem list → problem workspace (D-33: the layout people know from problem sites).
export function PracticeView({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  const params = useSearchParams();
  const router = useRouter();
  // Rendered only on the client (ProfileGate waits for the profile), so reading localStorage here is safe.
  const [solved, setSolved] = useState<Set<string>>(() => new Set(load<string[]>(SOLVED_KEY, [])));
  const problem = PROBLEMS.find((q) => q.id === params.get("problem"));

  const open = (id: string | null) => router.push(id ? `/practice?problem=${id}` : "/practice", { scroll: true });
  const markSolved = (id: string) =>
    setSolved((prev) => {
      const next = new Set(prev).add(id);
      save(SOLVED_KEY, [...next]);
      return next;
    });

  return problem ? (
    <Workspace key={problem.id} auth={auth} problem={problem} solved={solved.has(problem.id)} onSolved={() => markSolved(problem.id)} onOpen={open} />
  ) : (
    <ProblemList profile={profile} solved={solved} />
  );
}

/* ------------------------------ Problem list ------------------------------ */

function ProblemList({ profile, solved }: { profile: DeveloperProfile; solved: Set<string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const difficulty = (params.get("difficulty") ?? "all") as "all" | Difficulty;
  const topic = params.get("topic") ?? "all";
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`/practice${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const recs = useMemo(() => recommend(PROBLEMS, profile, solved), [profile, solved]);
  const list = PROBLEMS.filter((q) => (difficulty === "all" || q.difficulty === difficulty) && (topic === "all" || q.topics.includes(topic)));
  const counts = (["easy", "medium", "hard"] as const).map((d) => ({ d, total: PROBLEMS.filter((p) => p.difficulty === d).length, done: PROBLEMS.filter((p) => p.difficulty === d && solved.has(p.id)).length }));

  return (
    <div className="flex flex-col gap-6">
      {recs.length > 0 && (
        <section aria-labelledby="recs">
          <h2 id="recs" className="mb-1 text-sm font-semibold">Recommended for You</h2>
          <p className="mb-3 text-xs text-muted-foreground">Picked by the Practice Coach from your level and what you haven&apos;t solved yet.</p>
          <ol className="grid gap-2 md:grid-cols-3">
            {recs.map((r) => (
              <li key={r.problem.id}>
                <Link href={`/practice?problem=${r.problem.id}`} className="flex h-full flex-col rounded-md border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/40">
                  <span className="text-sm font-medium">{number(r.problem.id)}. {r.problem.title}</span>
                  <span className={cn("text-xs font-medium", DIFF_STYLE[r.problem.difficulty])}>{DIFF_LABEL[r.problem.difficulty]}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{r.reason}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="all" className="rounded-md border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <h2 id="all" className="mr-auto text-sm font-semibold">Problems</h2>
          <p className="flex gap-3 font-mono text-xs tabular-nums" aria-label="Solved by difficulty">
            {counts.map((c) => <span key={c.d} className={DIFF_STYLE[c.d]}>{DIFF_LABEL[c.d]} {c.done}/{c.total}</span>)}
          </p>
          <label className="sr-only" htmlFor="filter-difficulty">Difficulty</label>
          <select id="filter-difficulty" className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground" value={difficulty} onChange={(e) => setFilter("difficulty", e.target.value)}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <label className="sr-only" htmlFor="filter-topic">Topic</label>
          <select id="filter-topic" className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground" value={topic} onChange={(e) => setFilter("topic", e.target.value)}>
            <option value="all">All Topics</option>
            {Object.entries(TOPIC_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="w-14 px-4 py-2 font-medium">Status</th>
              <th scope="col" className="px-2 py-2 font-medium">Title</th>
              <th scope="col" className="hidden px-2 py-2 font-medium md:table-cell">Topics</th>
              <th scope="col" className="w-24 px-4 py-2 text-right font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q, i) => (
              <tr key={q.id} className={cn("border-b last:border-b-0", i % 2 === 1 && "bg-muted/40")}>
                <td className="px-4 py-2.5">
                  {solved.has(q.id) ? <CheckCircle2 className="size-4 text-success" aria-label="Solved" /> : <span className="sr-only">Not solved</span>}
                </td>
                <td className="px-2 py-2.5">
                  <Link href={`/practice?problem=${q.id}`} className="font-medium hover:text-primary">{number(q.id)}. {q.title}</Link>
                </td>
                <td className="hidden px-2 py-2.5 text-xs text-muted-foreground md:table-cell">{q.topics.map((t) => TOPIC_NAMES[t] ?? t).join(", ")}</td>
                <td className={cn("px-4 py-2.5 text-right text-xs font-medium", DIFF_STYLE[q.difficulty])}>{DIFF_LABEL[q.difficulty]}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">No problems match these filters. Try All Topics.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------------------------- Problem workspace ---------------------------- */

type LeftTab = "description" | "hints" | "submissions";
type ConsoleTab = "testcase" | "result";

function Workspace({
  auth,
  problem,
  solved,
  onSolved,
  onOpen,
}: {
  auth: ApiAuth;
  problem: PracticeProblem;
  solved: boolean;
  onSolved: () => void;
  onOpen: (id: string | null) => void;
}) {
  // Keyed by problem id, so this state resets per problem; client-only render (see PracticeView).
  const [code, setCode] = useState(() => load(CODE_KEY(problem.id), problem.starter));
  const [busy, setBusy] = useState<"run" | "submit" | "hint" | null>(null);
  const [result, setResult] = useState<(JudgeResult & { kind: "run" | "submit" }) | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [subs, setSubs] = useState<Submission[]>(() => load(SUBS_KEY(problem.id), []));
  const [note, setNote] = useState<string | null>(null);
  const [left, setLeft] = useState<LeftTab>("description");
  const [bottom, setBottom] = useState<ConsoleTab>("testcase");
  const idx = PROBLEMS.findIndex((p) => p.id === problem.id);
  const prev = PROBLEMS[idx - 1];
  const next = PROBLEMS[idx + 1];

  const onChange = (v?: string) => {
    setCode(v ?? "");
    save(CODE_KEY(problem.id), v ?? "");
  };

  const run = async (kind: "run" | "submit") => {
    setBusy(kind);
    setNote(null);
    const r = await runInWorker(code, problem.fn, kind === "run" ? problem.samples : problem.tests);
    setResult({ ...r, kind });
    setBottom("result");
    if (kind === "submit") {
      const entry: Submission = { at: new Date().toISOString(), verdict: r.verdict, passed: r.passed, total: r.total };
      setSubs((s) => {
        const list = [entry, ...s].slice(0, 20);
        save(SUBS_KEY(problem.id), list);
        return list;
      });
      if (r.verdict === "accepted") {
        onSolved();
        toast.success(`Accepted: ${problem.title} solved`, { description: "Added to your progress. Your profile strength just went up." });
      } else {
        toast.error(VERDICT_LABEL[r.verdict], { description: `${r.passed}/${r.total} tests passed. Check the test result below, or ask for a hint.` });
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
    setLeft("hints");
    try {
      const data = await apiJson<{ hint: string; mode: string }>("/api/practice/hint", auth, { body: { problemId: problem.id, code, level } });
      setHints((h) => [...h, { level, text: data.hint, mode: data.mode }]);
    } catch (e) {
      setHints((h) => [...h, { level, text: problem.hints[level - 1], mode: "offline" }]);
      toast.error("The Practice Coach is unavailable", { description: e instanceof Error ? `${e.message} Showing a built-in hint instead.` : "Showing a built-in hint instead." });
    }
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Problem navigation" className="flex items-center gap-2 text-sm">
        <Link href="/practice" className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Problem List
        </Link>
        <span className="ml-auto flex gap-1">
          <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && onOpen(prev.id)} aria-label="Previous problem">
            <ArrowLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" disabled={!next} onClick={() => next && onOpen(next.id)} aria-label="Next problem">
            <ChevronRight aria-hidden />
          </Button>
        </span>
      </nav>

      <div className="grid gap-3 lg:h-[calc(100dvh-11rem)] lg:min-h-[520px] lg:grid-cols-2">
        {/* Left: Description / Hints / Submissions */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-card">
          <Tabs
            label="Problem"
            value={left}
            onChange={setLeft}
            tabs={[
              { id: "description", label: "Description" },
              { id: "hints", label: hints.length ? `Hints (${hints.length})` : "Hints" },
              { id: "submissions", label: subs.length ? `Submissions (${subs.length})` : "Submissions" },
            ]}
          />
          <div className="min-h-0 flex-1 overflow-y-auto p-5" role="tabpanel">
            {left === "description" && (
              <>
                <h2 className="mb-2 text-xl font-semibold text-balance">{number(problem.id)}. {problem.title}</h2>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-sm bg-muted px-2 py-0.5 font-medium", DIFF_STYLE[problem.difficulty])}>{DIFF_LABEL[problem.difficulty]}</span>
                  {problem.topics.map((t) => <span key={t} className="rounded-sm bg-muted px-2 py-0.5 text-muted-foreground">{TOPIC_NAMES[t] ?? t}</span>)}
                  {solved && <span className="flex items-center gap-1 text-success"><CheckCircle2 className="size-3.5" aria-hidden /> Solved</span>}
                </div>
                <Markdown>{problem.statement}</Markdown>
                {problem.samples.map((s, i) => (
                  <div key={i} className="mt-4">
                    <p className="mb-1 text-sm font-semibold">Example {i + 1}:</p>
                    <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs leading-relaxed"><b>Input:</b> {s.args.map((a) => JSON.stringify(a)).join(", ")}{"\n"}<b>Output:</b> {JSON.stringify(s.expected)}</pre>
                  </div>
                ))}
              </>
            )}
            {left === "hints" && (
              <div className="flex flex-col gap-3 text-sm">
                <p className="text-muted-foreground">The Practice Coach nudges you toward the idea without giving the answer. Three hints, each a little more specific.</p>
                {hints.map((h) => (
                  <div key={h.level} className="rounded-md border p-3">
                    <p className="mb-1 font-medium">Hint {h.level}{h.mode !== "gemini" && <span className="ml-1 text-xs font-normal text-muted-foreground">(built-in)</span>}</p>
                    <p>{h.text}</p>
                  </div>
                ))}
                <Button variant="outline" className="self-start" onClick={askHint} disabled={!!busy || hints.length >= 3}>
                  {busy === "hint" ? <Loader2 className="animate-spin" aria-hidden /> : <Lightbulb aria-hidden />}
                  {hints.length >= 3 ? "No More Hints" : `Get Hint ${hints.length + 1} of 3`}
                </Button>
              </div>
            )}
            {left === "submissions" && (
              subs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet. Submit your code to see its result here.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b"><th scope="col" className="py-2 font-medium">Status</th><th scope="col" className="py-2 font-medium">Tests</th><th scope="col" className="py-2 text-right font-medium">When</th></tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.at} className="border-b last:border-b-0">
                        <td className={cn("py-2 font-medium", s.verdict === "accepted" ? "text-success" : "text-destructive")}>{VERDICT_LABEL[s.verdict]}</td>
                        <td className="py-2 font-mono text-xs tabular-nums">{s.passed}/{s.total}</td>
                        <td className="py-2 text-right text-xs text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(s.at))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </section>

        {/* Right: editor + console */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-card">
          <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
            <span className="font-medium">JavaScript</span>
            <span className="hidden truncate text-muted-foreground xl:inline">Runs in your browser, not on our servers</span>
            <button type="button" className="ml-auto flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => onChange(problem.starter)}>
              <RefreshCw className="size-3.5" aria-hidden /> Reset Code
            </button>
          </div>
          <div className="h-[320px] min-h-0 lg:h-auto lg:flex-[3]">
            <Editor
              height="100%"
              language="javascript"
              theme="light"
              value={code}
              onChange={onChange}
              options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true }}
              loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
            />
          </div>
          <div className="flex min-h-[180px] flex-col border-t lg:flex-[2]">
            <Tabs label="Console" value={bottom} onChange={setBottom} tabs={[{ id: "testcase", label: "Testcase" }, { id: "result", label: "Test Result" }]} />
            <div className="min-h-0 flex-1 overflow-y-auto p-3" role="tabpanel" aria-live="polite">
              {bottom === "testcase" && (
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {problem.samples.map((s, i) => (
                    <li key={i} className="rounded-md bg-muted px-3 py-2">
                      <span className="text-muted-foreground">Case {i + 1}: </span>{problem.fn}({s.args.map((a) => JSON.stringify(a)).join(", ")})
                    </li>
                  ))}
                </ul>
              )}
              {bottom === "result" && (result ? <Result result={result} /> : <p className="text-sm text-muted-foreground">Run or submit your code to see the result.</p>)}
              {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
            </div>
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <Button variant="ghost" size="sm" onClick={askHint} disabled={!!busy || hints.length >= 3}>
                <Lightbulb aria-hidden /> Hint
              </Button>
              <span className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => run("run")} disabled={!!busy}>
                  {busy === "run" ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />} {busy === "run" ? "Running…" : "Run"}
                </Button>
                <Button size="sm" onClick={() => run("submit")} disabled={!!busy}>
                  {busy === "submit" ? <Loader2 className="animate-spin" aria-hidden /> : null} {busy === "submit" ? "Judging…" : "Submit"}
                </Button>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Tabs<T extends string>({ label, value, onChange, tabs }: { label: string; value: T; onChange: (v: T) => void; tabs: { id: T; label: string }[] }) {
  return (
    <div role="tablist" aria-label={label} className="flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b px-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px border-b-2 px-2.5 py-2 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === t.id ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Result({ result }: { result: JudgeResult & { kind: "run" | "submit" } }) {
  const ok = result.verdict === "accepted";
  return (
    <div className={ok ? "animate-pop" : undefined}>
      <p className={cn("mb-2 flex items-center gap-2 text-lg font-semibold", ok ? "text-success" : "text-destructive")}>
        {ok ? <CheckCircle2 className="size-5" aria-hidden /> : <XCircle className="size-5" aria-hidden />}
        {VERDICT_LABEL[result.verdict]}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {result.passed}/{result.total} {result.kind === "run" ? "sample tests" : "tests"} passed
        </span>
      </p>
      {result.error && <pre className="mb-2 overflow-x-auto rounded-md bg-destructive/10 p-2 font-mono text-xs text-destructive">{result.error}</pre>}
      <ul className="flex flex-col gap-1.5 font-mono text-xs">
        {result.results.map((t) => (
          <li key={t.index} className="flex items-start gap-2 rounded-md bg-muted px-3 py-1.5">
            {t.passed ? <CheckCircle2 className="mt-px size-3.5 shrink-0 text-success" aria-label="Passed" /> : <Circle className="mt-px size-3.5 shrink-0 text-destructive" aria-label="Failed" />}
            <span className="min-w-0 break-words">
              Case {t.index + 1}: expected {t.expected}
              {!t.passed && <>, {t.error ? `threw "${t.error}"` : `got ${t.got}`}</>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
