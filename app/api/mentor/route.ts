import { isGeminiConfigured, streamChat } from "@/lib/gemini/client";
import { buildMentorSystem, detectSkills, offlineAnswer, sanitizeTurns } from "@/lib/mentor/mentor";
import { consumeAiQuota, recordAiHelpEvidence, resolveContext } from "@/lib/server/context";
import { errorResponse, HttpError, readJson } from "@/lib/server/http";

// AI-01 / AI-03 / AI-07 / AI-09: the personal mentor. Streams plain text (Markdown).
// Falls back to an offline, profile-based answer when Gemini is unavailable or the daily cap is hit (NFR-AV-03).
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJson<{ messages?: unknown; teach?: unknown; profile?: unknown }>(request);
    const turns = sanitizeTurns(body.messages);
    if (!turns) throw new HttpError(400, "Ask a question first.");
    const ctx = await resolveContext(request, body);
    const question = turns[turns.length - 1].text;

    if (ctx.uid) {
      const skills = detectSkills(question, ctx.profile);
      const names = ctx.profile.skills.filter((s) => skills.includes(s.id)).map((s) => s.name).join(", ");
      void recordAiHelpEvidence(ctx.uid, skills, names).catch((e) => console.error("evidence", e));
    }

    const offline = (mode: string, remaining?: number) =>
      new Response(offlineAnswer(ctx.profile, question), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-AI-Mode": mode,
          ...(remaining !== undefined ? { "X-AI-Remaining": String(remaining) } : {}),
        },
      });

    if (!isGeminiConfigured()) return offline("offline");
    let remaining: number;
    try {
      remaining = await consumeAiQuota(ctx);
    } catch (e) {
      if (e instanceof HttpError && e.status === 429) return offline("limit", 0);
      throw e;
    }

    // Start the stream before replying, so a Gemini failure can still fall back cleanly.
    const gen = streamChat(buildMentorSystem(ctx.profile, body.teach === true), turns);
    let first: IteratorResult<string>;
    try {
      first = await gen.next();
    } catch (e) {
      console.error("Gemini mentor failed; offline answer.", e);
      return offline("offline", remaining);
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encoder.encode(first.value));
          for await (const chunk of gen) controller.enqueue(encoder.encode(chunk));
        } catch (e) {
          console.error("Gemini stream broke", e);
          controller.enqueue(encoder.encode("\n\n_The answer was cut off. Please try again._"));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Mode": "gemini", "X-AI-Remaining": String(remaining) },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
