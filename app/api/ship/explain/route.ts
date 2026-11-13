import { parseRepo } from "@/lib/code/repo";
import { buildCiPrompt, buildCiSystem, diagnose, type FailedStep, formatDiagnosis } from "@/lib/ship/ci";
import { callAgent } from "@/lib/server/agent-call";
import { resolveContext } from "@/lib/server/context";
import { errorResponse, HttpError, readJson } from "@/lib/server/http";

// DP-05: DevOps & Debug agent explains a failed CI run, with offline rules as fallback.
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await readJson<{ repo?: unknown; workflow?: unknown; steps?: unknown; profile?: unknown }>(request);
    const ref = typeof body.repo === "string" ? parseRepo(body.repo) : null;
    if (!ref) throw new HttpError(400, "Pick a repository first.");
    const workflow = typeof body.workflow === "string" ? body.workflow.slice(0, 120) : "Workflow";
    const steps: FailedStep[] = Array.isArray(body.steps)
      ? body.steps.slice(0, 10).flatMap((s) => (s && typeof s.job === "string" && typeof s.step === "string" ? [{ job: s.job.slice(0, 120), step: s.step.slice(0, 160) }] : []))
      : [];
    const ctx = await resolveContext(request, body);
    const answer = await callAgent(ctx, {
      system: buildCiSystem(ctx.profile),
      prompt: buildCiPrompt(`${ref.owner}/${ref.repo}`, workflow, steps),
      offline: () => formatDiagnosis(diagnose(steps, workflow)),
    });
    return Response.json(answer);
  } catch (e) {
    return errorResponse(e);
  }
}
