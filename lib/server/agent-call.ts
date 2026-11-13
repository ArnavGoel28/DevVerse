import "server-only";

import { generateText, isGeminiConfigured } from "@/lib/gemini/client";
import { consumeAiQuota, type RequestContext } from "@/lib/server/context";
import { HttpError } from "@/lib/server/http";

export type AgentAnswer = { text: string; mode: "gemini" | "offline" | "limit"; remaining?: number };

/**
 * One call to a specialist agent (D-28) with the shared rules: per-user caps, offline fallback (NFR-AV-03),
 * and never failing the request because the AI failed.
 */
export async function callAgent(ctx: RequestContext, opts: { system: string; prompt: string; offline: () => string; search?: boolean }): Promise<AgentAnswer> {
  if (!isGeminiConfigured()) return { text: opts.offline(), mode: "offline" };
  let remaining: number;
  try {
    remaining = await consumeAiQuota(ctx);
  } catch (e) {
    if (e instanceof HttpError && e.status === 429) return { text: opts.offline(), mode: "limit", remaining: 0 };
    throw e;
  }
  try {
    const text = (await generateText({ system: opts.system, prompt: opts.prompt, search: opts.search })).trim();
    return text ? { text, mode: "gemini", remaining } : { text: opts.offline(), mode: "offline", remaining };
  } catch (e) {
    console.error("Agent call failed; offline answer.", e);
    return { text: opts.offline(), mode: "offline", remaining };
  }
}
