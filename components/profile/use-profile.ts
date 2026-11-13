"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { applySkillFeedback } from "@/lib/profile/build";
import type { DeveloperProfile, SkillFeedback } from "@/lib/types";

// One hook for every page that shows the Developer Profile.
// - "account": signed in → profile lives in Firestore, read through /api/profile.
// - "demo":    not signed in / sign-in not configured → build from any public GitHub username
//              (/api/profile/demo), kept only in this browser tab (sessionStorage).

export type ProfileStatus = "loading" | "empty" | "importing" | "ready" | "error";

const DEMO_KEY = "devverse.demoProfile";

function readDemo(): DeveloperProfile | null {
  try {
    const raw = sessionStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as DeveloperProfile) : null;
  } catch {
    return null;
  }
}

function writeDemo(p: DeveloperProfile | null) {
  try {
    if (p) sessionStorage.setItem(DEMO_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(DEMO_KEY);
  } catch {
    // storage blocked — the demo still works for this page view
  }
}

async function call<T>(path: string, init: RequestInit & { idToken?: string } = {}): Promise<T> {
  const { idToken, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

const FEEDBACK_MESSAGE: Record<SkillFeedback | "undo", string> = {
  confirmed: "Skill confirmed",
  wrong: "Marked as wrong. It no longer counts toward your profile.",
  hidden: "Skill hidden from your profile",
  undo: "Change undone",
};

export function useProfile() {
  const { user, configured } = useAuth();
  const mode: "account" | "demo" = configured && user ? "account" : "demo";
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const autoImported = useRef(false);

  const importNow = useCallback(async () => {
    if (!user) return;
    setStatus("importing");
    setError(null);
    try {
      const r = await call<{ profile: DeveloperProfile }>("/api/profile/import", {
        method: "POST",
        idToken: await user.getIdToken(),
      });
      setProfile(r.profile);
      setStatus("ready");
      toast.success("Profile updated from your GitHub history");
    } catch (e) {
      setError((e as Error).message);
      setStatus(profile ? "ready" : "error");
      toast.error("Import failed", { description: (e as Error).message });
    }
  }, [user, profile]);

  // Load on mount / when the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === "demo") {
        // sessionStorage only exists in the browser, so it is read after mount.
        const p = readDemo();
        setProfile(p);
        setStatus(p ? "ready" : "empty");
        return;
      }
      setStatus("loading");
      // Right after sign-in the server may still be saving the GitHub token — retry briefly.
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const r = await call<{ user: { githubImport: { status: string } } | null; profile: DeveloperProfile | null }>(
            "/api/profile",
            { idToken: await user!.getIdToken() },
          );
          if (cancelled) return;
          if (r.profile) {
            setProfile(r.profile);
            setStatus("ready");
            return;
          }
          if (r.user) {
            setStatus("empty");
            // J1: first visit after connecting GitHub → import automatically.
            if (r.user.githubImport.status === "never" && !autoImported.current) {
              autoImported.current = true;
              void importNow();
            }
            return;
          }
        } catch (e) {
          if (cancelled) return;
          setError((e as Error).message);
          setStatus("error");
          return;
        }
        await new Promise((res) => setTimeout(res, 1500));
      }
      if (!cancelled) setStatus("empty");
    })();
    return () => {
      cancelled = true;
    };
    // importNow intentionally omitted: it changes with `profile` and must not re-trigger loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user]);

  const runDemo = useCallback(async (login: string) => {
    setStatus("importing");
    setError(null);
    try {
      const r = await call<{ profile: DeveloperProfile }>("/api/profile/demo", {
        method: "POST",
        body: JSON.stringify({ login }),
      });
      writeDemo(r.profile);
      setProfile(r.profile);
      setStatus("ready");
      toast.success(`Demo profile built for ${login}`);
    } catch (e) {
      setError((e as Error).message);
      toast.error("Couldn't build the demo profile", { description: (e as Error).message });
      setStatus(readDemo() ? "ready" : "empty");
    }
  }, []);

  const clearDemo = useCallback(() => {
    writeDemo(null);
    setProfile(null);
    setStatus("empty");
  }, []);

  /** DI-06: optimistic update; reverted if the server refuses. */
  const setFeedback = useCallback(
    async (skillId: string, feedback: SkillFeedback | null) => {
      if (!profile) return;
      const before = profile;
      const next = applySkillFeedback(profile, skillId, feedback);
      setProfile(next);
      const done = () => toast.success(FEEDBACK_MESSAGE[feedback ?? "undo"]);
      if (mode === "demo") {
        writeDemo(next);
        done();
        return;
      }
      try {
        await call("/api/profile/feedback", {
          method: "PATCH",
          idToken: await user!.getIdToken(),
          body: JSON.stringify({ skillId, feedback }),
        });
        done();
      } catch (e) {
        setProfile(before);
        setError((e as Error).message);
        toast.error("Couldn't save that change", { description: (e as Error).message });
      }
    },
    [profile, mode, user],
  );

  return { mode, profile, status, error, importNow, runDemo, clearDemo, setFeedback };
}
