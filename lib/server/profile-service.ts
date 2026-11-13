import "server-only";

import { FieldValue, type WriteBatch } from "firebase-admin/firestore";

import { generateJson, isGeminiConfigured } from "@/lib/gemini/client";
import { fetchHistoryWithToken, fetchPublicHistory, GitHubError } from "@/lib/github/history";
import { applySkillFeedback, buildProfile, carryOverFeedback } from "@/lib/profile/build";
import { decryptSecret, encryptSecret } from "@/lib/server/crypto";
import { adminDb } from "@/lib/server/firebase-admin";
import { HttpError } from "@/lib/server/http";
import type { DeveloperProfile, SkillFeedback } from "@/lib/types";

// Server-side Developer Profile operations (GH-08, DI-01…DI-09). Paths follow docs/08-data-model.md.

const IMPORT_COOLDOWN_MS = 2 * 60 * 1000; // protects the GitHub + Gemini quotas (NFR-AI-05)
const STALE_RUN_MS = 5 * 60 * 1000;

function encryptionKey(): string {
  const k = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!k) throw new HttpError(503, "GITHUB_TOKEN_ENCRYPTION_KEY is not set on the server.");
  return k;
}

const userRef = (uid: string) => adminDb().collection("users").doc(uid);
const profileRef = (uid: string) => userRef(uid).collection("profile").doc("current");

/** Called right after GitHub sign-in: verify the token with GitHub, then store it encrypted. */
export async function saveGitHubToken(uid: string, token: string): Promise<{ login: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "devverse-app" },
  });
  if (!res.ok) throw new HttpError(400, "GitHub did not accept this sign-in. Please try again.");
  const gh = (await res.json()) as { login: string; name: string | null; avatar_url: string; bio: string | null };
  const scopes = (res.headers.get("x-oauth-scopes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const db = adminDb();
  const user = userRef(uid);
  const snap = await user.get();
  const batch = db.batch();
  batch.set(user.collection("private").doc("github"), {
    encryptedToken: encryptSecret(token, encryptionKey()),
    scopes,
    savedAt: new Date().toISOString(),
  });
  batch.set(
    user,
    {
      uid,
      githubLogin: gh.login,
      displayName: gh.name ?? gh.login,
      avatarUrl: gh.avatar_url,
      ...(gh.bio ? { bio: gh.bio } : {}),
      ...(snap.exists
        ? {}
        : { visibility: { profile: "private" }, githubImport: { status: "never" }, createdAt: new Date().toISOString() }),
    },
    { merge: true },
  );
  await batch.commit();
  return { login: gh.login };
}

export async function getProfile(uid: string) {
  const [user, profile] = await Promise.all([userRef(uid).get(), profileRef(uid).get()]);
  return {
    user: user.exists
      ? {
          githubLogin: user.get("githubLogin") as string,
          githubImport: (user.get("githubImport") ?? { status: "never" }) as { status: string; lastRunAt?: string; error?: string },
        }
      : null,
    profile: profile.exists ? (profile.data() as DeveloperProfile) : null,
  };
}

/** GH-08: import the full GitHub history and rebuild the profile. */
export async function runImport(uid: string): Promise<DeveloperProfile> {
  const user = userRef(uid);
  const db = adminDb();

  // Claim the run in a transaction so two clicks don't start two imports.
  const login = await db.runTransaction(async (tx) => {
    const snap = await tx.get(user);
    if (!snap.exists) throw new HttpError(409, "Sign in with GitHub first.");
    const imp = (snap.get("githubImport") ?? {}) as { status?: string; lastRunAt?: string };
    const last = imp.lastRunAt ? Date.parse(imp.lastRunAt) : 0;
    if (imp.status === "running" && Date.now() - last < STALE_RUN_MS)
      throw new HttpError(409, "An import is already running.");
    if (imp.status === "done" && Date.now() - last < IMPORT_COOLDOWN_MS)
      throw new HttpError(429, "Your profile was just updated. Try again in a couple of minutes.");
    tx.update(user, { githubImport: { status: "running", lastRunAt: new Date().toISOString() } });
    return snap.get("githubLogin") as string;
  });

  try {
    const secret = await user.collection("private").doc("github").get();
    if (!secret.exists) throw new HttpError(409, "GitHub access is missing. Please sign out and sign in again.");
    const token = decryptSecret(secret.get("encryptedToken") as string, encryptionKey());

    const snapshot = await fetchHistoryWithToken(login, token);
    const { evidence, profile: built } = await buildProfile(snapshot, isGeminiConfigured() ? generateJson : null);
    const previous = await profileRef(uid).get();
    const profile = carryOverFeedback(built, previous.exists ? (previous.data() as DeveloperProfile) : null);

    // Replace GitHub evidence (other sources are kept).
    const old = await user.collection("evidence").where("source", "==", "github").get();
    const writes: ((b: WriteBatch) => void)[] = [
      ...old.docs.map((d) => (b: WriteBatch) => b.delete(d.ref)),
      ...evidence.map((e) => (b: WriteBatch) => b.set(user.collection("evidence").doc(), e)),
    ];
    for (let i = 0; i < writes.length; i += 450) {
      const b = db.batch();
      writes.slice(i, i + 450).forEach((w) => w(b));
      await b.commit();
    }

    const today = new Date().toISOString().slice(0, 10);
    const b = db.batch();
    b.set(db.collection("githubSnapshots").doc(uid), snapshot);
    b.set(profileRef(uid), profile);
    b.set(profileRef(uid).collection("history").doc(today), {
      skills: profile.skills.map((s) => ({ id: s.id, confidence: s.confidence })),
    });
    b.update(user, { githubImport: { status: "done", lastRunAt: new Date().toISOString() } });
    await b.commit();
    return profile;
  } catch (e) {
    const message = e instanceof HttpError || e instanceof GitHubError ? e.message : "Import failed.";
    await user.update({ githubImport: { status: "error", lastRunAt: new Date().toISOString(), error: message } });
    throw e;
  }
}

/** DI-06: confirm, correct or hide a skill. */
export async function setSkillFeedback(uid: string, skillId: string, feedback: SkillFeedback | null) {
  const ref = profileRef(uid);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "No profile yet.");
    let next: DeveloperProfile;
    try {
      next = applySkillFeedback(snap.data() as DeveloperProfile, skillId, feedback);
    } catch {
      throw new HttpError(404, "Unknown skill.");
    }
    tx.update(ref, { skills: next.skills, feedbackAt: FieldValue.serverTimestamp() });
    return next;
  });
}

// ---------- Demo (no sign-in): public data only, nothing stored ----------

const demoCache = new Map<string, { at: number; profile: DeveloperProfile }>();
const DEMO_TTL_MS = 60 * 60 * 1000;

export async function buildDemoProfile(login: string): Promise<DeveloperProfile> {
  const key = login.toLowerCase();
  const hit = demoCache.get(key);
  if (hit && Date.now() - hit.at < DEMO_TTL_MS) return hit.profile;

  // An optional server token (public data only) lifts GitHub's 60 requests/hour anonymous limit.
  const demoToken = process.env.GITHUB_DEMO_TOKEN;
  const snapshot = demoToken
    ? await fetchHistoryWithToken(login, demoToken).catch((e) => {
        if (e instanceof GitHubError && e.status === 404) throw e;
        return fetchPublicHistory(login);
      })
    : await fetchPublicHistory(login);
  const { profile } = await buildProfile(snapshot, isGeminiConfigured() ? generateJson : null);

  if (demoCache.size >= 100) demoCache.delete(demoCache.keys().next().value!);
  demoCache.set(key, { at: Date.now(), profile });
  return profile;
}
