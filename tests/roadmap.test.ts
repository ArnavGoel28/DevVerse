import { describe, expect, it } from "vitest";

import { STRUGGLE_PACKS, TRACKS } from "@/lib/learn/catalog";
import { buildPacks, buildRoadmapPrompt, curatedRoadmap, markProgress, parseAiRoadmap, pickTrack, setStepManual } from "@/lib/learn/roadmap";
import { applySkillFeedback } from "@/lib/profile/build";
import { makeProfile, NOW } from "./fixtures";

const profile = makeProfile();

describe("catalogue (D-16)", () => {
  it("only links https resources and has unique step ids per track", () => {
    for (const t of TRACKS) {
      expect(new Set(t.steps.map((s) => s.id)).size).toBe(t.steps.length);
      for (const s of t.steps) for (const r of s.resources) expect(r.url).toMatch(/^https:\/\//);
    }
    for (const p of Object.values(STRUGGLE_PACKS)) for (const r of p.resources) expect(r.url).toMatch(/^https:\/\//);
  });
});

describe("pickTrack", () => {
  it("uses the goal first, then the profile's focus", () => {
    expect(pickTrack("Backend developer internship").id).toBe("backend");
    expect(pickTrack("become a data scientist").id).toBe("data");
    expect(pickTrack("Full-stack engineer").id).toBe("fullstack");
    expect(pickTrack("get a job", profile).id).toBe("frontend"); // riya's focus is Frontend
  });
});

describe("roadmap progress (LN-02)", () => {
  it("marks steps done from evidence", () => {
    const r = curatedRoadmap("Frontend developer", profile, NOW);
    const ts = r.steps.find((s) => s.id === "typescript")!;
    expect(ts).toMatchObject({ status: "done", doneBy: "evidence" });
    expect(r.steps.find((s) => s.id === "a11y")!.status).toBe("todo");
  });

  it("ignores skills the user marked wrong", () => {
    const corrected = applySkillFeedback(profile, "typescript", "wrong");
    const r = curatedRoadmap("Frontend developer", corrected, NOW);
    expect(r.steps.find((s) => s.id === "typescript")!.status).toBe("todo");
  });

  it("lets the user override, and undo the override", () => {
    let r = curatedRoadmap("Frontend developer", profile, NOW);
    r = setStepManual(r, "a11y", true, profile);
    expect(r.steps.find((s) => s.id === "a11y")).toMatchObject({ status: "done", doneBy: "user", manual: "done" });
    r = setStepManual(r, "typescript", false, profile);
    expect(r.steps.find((s) => s.id === "typescript")!.status).toBe("todo");
    r = setStepManual(r, "typescript", null, profile);
    expect(r.steps.find((s) => s.id === "typescript")!.status).toBe("done");
    expect(() => setStepManual(r, "nope", true, profile)).toThrow();
  });

  it("recomputes when the profile changes", () => {
    const r = curatedRoadmap("Frontend developer", profile, NOW);
    const empty = makeProfile({ skills: [] });
    expect(markProgress(r, empty).steps.every((s) => s.status === "todo")).toBe(true);
  });
});

describe("learning packs (LN-03)", () => {
  it("builds up to 3 packs from struggles with explainer, links and practice", () => {
    const packs = buildPacks(profile);
    expect(packs.length).toBeGreaterThan(0);
    expect(packs.length).toBeLessThanOrEqual(3);
    expect(packs[0].explainer.length).toBeGreaterThan(20);
    expect(packs[0].practiceHref).toMatch(/^\/practice\?topic=/);
  });

  it("falls back to a generic explainer for unknown topics", () => {
    const p = makeProfile({ struggles: [{ topic: "Regex", severity: 0.5, trend: "steady", occurrences: 2, why: "x" }] });
    expect(buildPacks(p)[0].explainer).toContain("regex");
  });
});

describe("Gemini roadmap parsing", () => {
  const base = curatedRoadmap("Backend developer", profile, NOW);

  it("puts the goal and profile in the prompt", () => {
    const prompt = buildRoadmapPrompt("Backend developer", profile, base);
    expect(prompt).toContain("GOAL: Backend developer");
    expect(prompt).toContain("@riya");
  });

  it("parses JSON even with a code fence, and drops unsafe links", () => {
    const steps = [
      { title: "HTTP", why: "You build APIs", skillIds: ["REST API"], resources: [{ title: "MDN", url: "https://developer.mozilla.org", kind: "docs" }] },
      { title: "SQL", skillIds: ["sql"], resources: [{ title: "bad", url: "javascript:alert(1)", kind: "docs" }, { title: "http", url: "http://x.com", kind: "docs" }] },
      { title: "Docker", skillIds: ["docker"], resources: [{ title: "Docs", url: "https://docs.docker.com", kind: "weird" }] },
    ];
    const r = parseAiRoadmap("```json\n" + JSON.stringify(steps) + "\n```", "Backend", "backend", NOW)!;
    expect(r.source).toBe("ai");
    expect(r.steps).toHaveLength(3);
    expect(r.steps[0].skillIds).toEqual(["rest-api"]);
    expect(r.steps[1].resources).toEqual([]);
    expect(r.steps[2].resources[0].kind).toBe("article");
  });

  it("returns null for unusable replies", () => {
    expect(parseAiRoadmap("Sorry, I can't help", "g", "t")).toBeNull();
    expect(parseAiRoadmap("[1, 2", "g", "t")).toBeNull();
    expect(parseAiRoadmap(JSON.stringify([{ title: "only one" }]), "g", "t")).toBeNull();
  });
});
