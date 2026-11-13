import { describe, expect, it } from "vitest";

import { applySkillFeedback, buildProfile, carryOverFeedback } from "@/lib/profile/build";
import { decryptSecret, encryptSecret } from "@/lib/server/crypto";
import { makeSnapshot, NOW } from "./fixtures";

describe("skill feedback (DI-06)", async () => {
  const { profile } = await buildProfile(makeSnapshot(), null, NOW);

  it("sets and clears feedback on one skill only", () => {
    const wrong = applySkillFeedback(profile, "python", "wrong");
    expect(wrong.skills.find((s) => s.id === "python")!.userFeedback).toBe("wrong");
    expect(wrong.skills.filter((s) => s.userFeedback)).toHaveLength(1);
    const undone = applySkillFeedback(wrong, "python", null);
    expect(undone.skills.find((s) => s.id === "python")!.userFeedback).toBeUndefined();
  });

  it("rejects unknown skills", () => {
    expect(() => applySkillFeedback(profile, "cobol", "confirmed")).toThrow();
  });

  it("keeps corrections after a re-import", () => {
    const corrected = applySkillFeedback(profile, "typescript", "confirmed");
    const merged = carryOverFeedback(profile, corrected);
    expect(merged.skills.find((s) => s.id === "typescript")!.userFeedback).toBe("confirmed");
  });
});

describe("token encryption (NFR-SE-03)", () => {
  const key = "a-long-random-test-key-1234567890";

  it("round-trips and never stores the plain token", () => {
    const enc = encryptSecret("gho_example", key);
    expect(enc).not.toContain("gho_example");
    expect(decryptSecret(enc, key)).toBe("gho_example");
    expect(encryptSecret("gho_example", key)).not.toBe(enc); // random IV
  });

  it("fails with the wrong key or tampered data", () => {
    const enc = encryptSecret("gho_example", key);
    expect(() => decryptSecret(enc, "another-long-random-key-000000")).toThrow();
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join(":"), key)).toThrow();
  });

  it("refuses short keys", () => {
    expect(() => encryptSecret("x", "short")).toThrow();
  });
});
