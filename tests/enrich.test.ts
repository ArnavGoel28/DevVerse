import { describe, expect, it, vi } from "vitest";

import { buildEnrichPrompt, enrichProfile, parseEnrichOutput } from "@/lib/profile/enrich";
import { snapshotToEvidence } from "@/lib/profile/evidence";
import { buildRulesProfile } from "@/lib/profile/rules";
import { makeSnapshot, NOW } from "./fixtures";

const snap = makeSnapshot();
const draft = buildRulesProfile(snap, snapshotToEvidence(snap), NOW);

const good = {
  summary: "Riya builds TypeScript APIs.",
  focusAreas: ["Backend"],
  strengths: ["Solid Express API"],
  gaps: ["Add READMEs"],
  recruiterView: "Promising backend developer.",
  struggleWhy: [{ topic: "Failing CI builds", why: "CI failed twice this month." }],
  recommendations: [{ type: "learn", title: "Learn GitHub Actions", reason: "CI keeps failing." }],
};

describe("Gemini enrichment", () => {
  it("returns the rules profile unchanged when there is no AI key", async () => {
    expect(await enrichProfile(snap, draft, null)).toBe(draft);
  });

  it("merges Gemini text but keeps evidence-based skills", async () => {
    const p = await enrichProfile(snap, draft, async () => JSON.stringify(good));
    expect(p.generatedBy).toBe("gemini");
    expect(p.summary).toBe(good.summary);
    expect(p.skills).toEqual(draft.skills);
    expect(p.struggles.find((s) => s.topic === "Failing CI builds")!.why).toBe("CI failed twice this month.");
    expect(p.recommendations[0].href).toBe("/learn");
  });

  it("falls back to rules on invalid JSON or an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await enrichProfile(snap, draft, async () => "not json")).toBe(draft);
    expect(
      await enrichProfile(snap, draft, async () => {
        throw new Error("quota");
      }),
    ).toBe(draft);
    expect(await enrichProfile(snap, draft, async () => JSON.stringify({ summary: "" }))).toBe(draft);
  });

  it("drops recommendations with unknown types", () => {
    const out = parseEnrichOutput(JSON.stringify({ ...good, recommendations: [{ type: "hack", title: "x", reason: "y" }] }));
    expect(out!.recommendations).toEqual([]);
  });

  it("never puts tokens or secrets in the prompt", () => {
    const prompt = buildEnrichPrompt(snap, draft);
    expect(prompt).toContain("riya");
    expect(prompt).not.toMatch(/token|gho_|ghp_/i);
  });
});
