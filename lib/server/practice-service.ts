import "server-only";

import { generateText, isGeminiConfigured } from "@/lib/gemini/client";
import { getProblem } from "@/lib/practice/catalog";
import { buildCoachSystem, buildHintPrompt, guardHint, type HintLevel, offlineHint } from "@/lib/practice/coach";
import type { Verdict } from "@/lib/practice/judge";
import { consumeAiQuota, type RequestContext } from "@/lib/server/context";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError } from "@/lib/server/http";

export type HintResult = { hint: string; mode: "gemini" | "offline" | "limit"; remaining?: number };

/** PR-06: one hint from the Practice Coach agent, or the authored hint when AI is off or capped (NFR-AV-03). */
export async function getHint(ctx: RequestContext, problemId: string, code: string, level: HintLevel): Promise<HintResult> {
  const problem = getProblem(problemId);
  if (!problem) throw new HttpError(404, "Unknown problem.");
  if (!isGeminiConfigured()) return { hint: offlineHint(problem, level), mode: "offline" };
  let remaining: number;
  try {
    remaining = await consumeAiQuota(ctx);
  } catch (e) {
    if (e instanceof HttpError && e.status === 429) return { hint: offlineHint(problem, level), mode: "limit", remaining: 0 };
    throw e;
  }
  try {
    const text = await generateText({ system: buildCoachSystem(ctx.profile), prompt: buildHintPrompt(problem, code, level) });
    const hint = guardHint(text);
    return hint ? { hint, mode: "gemini", remaining } : { hint: offlineHint(problem, level), mode: "offline", remaining };
  } catch (e) {
    console.error("Practice Coach failed; offline hint.", e);
    return { hint: offlineHint(problem, level), mode: "offline", remaining };
  }
}

const VERDICTS: Verdict[] = ["accepted", "wrong_answer", "runtime_error", "compile_error", "time_limit"];

export type SubmissionInput = { problemId: string; code: string; verdict: Verdict; passed: number; total: number; hintsUsed: number };

export function parseSubmission(body: Record<string, unknown>): SubmissionInput {
  const problem = typeof body.problemId === "string" ? getProblem(body.problemId) : undefined;
  if (!problem) throw new HttpError(400, "Unknown problem.");
  const verdict = body.verdict as Verdict;
  if (!VERDICTS.includes(verdict)) throw new HttpError(400, "Invalid verdict.");
  const num = (v: unknown, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : 0);
  return {
    problemId: problem.id,
    code: typeof body.code === "string" ? body.code.slice(0, 20_000) : "",
    verdict,
    passed: num(body.passed, 100),
    total: num(body.total, 100),
    hintsUsed: num(body.hintsUsed, 3),
  };
}

/** PR-03 + DI-02: store the submission and one evidence fact (never the code in evidence). */
export async function recordSubmission(uid: string, s: SubmissionInput): Promise<void> {
  const problem = getProblem(s.problemId)!;
  const user = adminDb().collection("users").doc(uid);
  const now = new Date().toISOString();
  const solved = s.verdict === "accepted";
  await Promise.all([
    user.collection("submissions").add({ ...s, language: "javascript", createdAt: now }),
    user.collection("evidence").add({
      source: "practice",
      kind: solved ? "problem_solved" : "problem_failed",
      skills: [...problem.topics, "javascript"],
      outcome: solved ? "success" : "struggle",
      weight: solved ? (problem.difficulty === "hard" ? 2 : problem.difficulty === "medium" ? 1.5 : 1) : 0.5,
      detail: solved
        ? `Solved "${problem.title}" (${problem.difficulty})${s.hintsUsed ? ` with ${s.hintsUsed} hint(s)` : ""}`
        : `Attempted "${problem.title}": ${s.passed}/${s.total} tests`,
      ref: problem.id,
      createdAt: now,
    }),
  ]);
}
