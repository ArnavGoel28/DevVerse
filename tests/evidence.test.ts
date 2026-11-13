import { describe, expect, it } from "vitest";

import { snapshotToEvidence } from "@/lib/profile/evidence";
import { makeSnapshot } from "./fixtures";

describe("snapshotToEvidence (DI-02)", () => {
  const ev = snapshotToEvidence(makeSnapshot());

  it("ignores forks: other people's code is not your skill", () => {
    expect(ev.some((e) => e.ref === "facebook/react")).toBe(false);
  });

  it("drops languages under 5% of a repo", () => {
    expect(ev.some((e) => e.kind === "repo_language" && e.skills.includes("docker"))).toBe(false);
    expect(ev.some((e) => e.kind === "repo_language" && e.skills.includes("javascript"))).toBe(true); // 8% of notes-api
  });

  it("maps topics to framework skills", () => {
    const fw = ev.filter((e) => e.kind === "repo_framework").flatMap((e) => e.skills);
    expect(fw).toEqual(expect.arrayContaining(["express", "nodejs", "rest-api", "react", "nextjs"]));
  });

  it("dates repo evidence by repo creation (for growth back-fill)", () => {
    const py = ev.find((e) => e.skills.includes("python"))!;
    expect(py.createdAt).toBe("2022-05-01T00:00:00Z");
  });

  it("records failed workflows as struggles and OSS PRs as successes", () => {
    expect(ev.filter((e) => e.kind === "workflow_failed" && e.outcome === "struggle")).toHaveLength(2);
    const oss = ev.find((e) => e.kind === "oss_contribution")!;
    expect(oss.outcome).toBe("success");
    expect(oss.skills).toEqual(["open-source"]);
  });

  it("only stores dated facts from GitHub", () => {
    for (const e of ev) {
      expect(e.source).toBe("github");
      expect(Number.isNaN(Date.parse(e.createdAt))).toBe(false);
    }
  });
});
