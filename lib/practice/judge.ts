// PR-02 / PR-03 / PR-04 (MVP, D-32): user code runs ONLY in the user's own browser, inside a Web Worker that the
// page terminates on a time limit. Nothing here runs on our servers (NFR-SE-01).
// JUDGE_CORE is plain JavaScript source so the exact same logic runs in the worker and in unit tests.

import type { PracticeTest } from "./catalog";

export type TestResult = { index: number; passed: boolean; got?: string; expected: string; error?: string };
export type Verdict = "accepted" | "wrong_answer" | "runtime_error" | "compile_error" | "time_limit";
export type JudgeResult = { verdict: Verdict; passed: number; total: number; results: TestResult[]; error?: string };

export const TIME_LIMIT_MS = 3000;

export const JUDGE_CORE = String.raw`
function __show(v) {
  try { var s = JSON.stringify(v); return s === undefined ? String(v) : (s.length > 300 ? s.slice(0, 300) + "…" : s); }
  catch (e) { return String(v); }
}
function __equal(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return (isNaN(a) && isNaN(b)) || Math.abs(a - b) < 1e-9;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!__equal(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var k = 0; k < ka.length; k++) if (!__equal(a[ka[k]], b[ka[k]])) return false;
    return true;
  }
  return false;
}
function __run(code, fn, tests) {
  var f;
  try {
    f = new Function(code + "\n;return typeof " + fn + " === 'function' ? " + fn + " : undefined;")();
  } catch (e) {
    return { verdict: "compile_error", passed: 0, total: tests.length, results: [], error: String(e && e.message || e) };
  }
  if (typeof f !== "function")
    return { verdict: "compile_error", passed: 0, total: tests.length, results: [], error: "Define a function named " + fn + "." };
  var results = [], passed = 0, crashed = false;
  for (var i = 0; i < tests.length; i++) {
    var t = tests[i], expected = __show(t.expected);
    try {
      var got = f.apply(null, JSON.parse(JSON.stringify(t.args)));
      var ok = __equal(got, t.expected);
      if (ok) passed++;
      results.push({ index: i, passed: ok, got: __show(got), expected: expected });
    } catch (e) {
      crashed = true;
      results.push({ index: i, passed: false, expected: expected, error: String(e && e.message || e) });
    }
  }
  var verdict = passed === tests.length ? "accepted" : crashed ? "runtime_error" : "wrong_answer";
  return { verdict: verdict, passed: passed, total: tests.length, results: results };
}
`;

/** Source for the Web Worker: receives { code, fn, tests } and posts back a JudgeResult. */
export const WORKER_SOURCE = `${JUDGE_CORE}
self.onmessage = function (e) { self.postMessage(__run(e.data.code, e.data.fn, e.data.tests)); };`;

/** Runs the judge synchronously in the current JS context. For unit tests only — never call on the server. */
export function runInline(code: string, fn: string, tests: PracticeTest[]): JudgeResult {
  const run = new Function(`${JUDGE_CORE}; return __run;`)() as (c: string, f: string, t: PracticeTest[]) => JudgeResult;
  return run(code, fn, tests);
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong answer",
  runtime_error: "Runtime error",
  compile_error: "Doesn't compile",
  time_limit: "Time limit exceeded",
};
