"use client";

import type { PracticeTest } from "@/lib/practice/catalog";
import { type JudgeResult, TIME_LIMIT_MS, WORKER_SOURCE } from "@/lib/practice/judge";

// Runs the user's code in a throwaway Web Worker in THEIR browser (D-32, NFR-SE-01), killed after the time limit.
export function runInWorker(code: string, fn: string, tests: PracticeTest[]): Promise<JudgeResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url);
    const done = (r: JudgeResult) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    const timer = setTimeout(
      () => done({ verdict: "time_limit", passed: 0, total: tests.length, results: [], error: `Stopped after ${TIME_LIMIT_MS / 1000}s. Look for an infinite loop or a slow approach.` }),
      TIME_LIMIT_MS,
    );
    worker.onmessage = (e: MessageEvent<JudgeResult>) => done(e.data);
    worker.onerror = (e) => {
      e.preventDefault();
      done({ verdict: "runtime_error", passed: 0, total: tests.length, results: [], error: e.message || "The code crashed." });
    };
    worker.postMessage({ code, fn, tests });
  });
}
