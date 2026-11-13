"use client";

import type { User } from "firebase/auth";

import type { DeveloperProfile } from "@/lib/types";

// Browser → server calls. Signed in: send the Firebase ID token (the server loads the profile itself).
// Demo: send the demo profile in the body instead (D-18).

export type ApiAuth = { mode: "account" | "demo"; user: User | null; profile: DeveloperProfile | null };

export async function apiRequest(path: string, auth: ApiAuth, init: { method?: string; body?: Record<string, unknown> } = {}) {
  const method = init.method ?? (init.body ? "POST" : "GET");
  const headers: Record<string, string> = {};
  let body = init.body;
  if (auth.mode === "account" && auth.user) headers.Authorization = `Bearer ${await auth.user.getIdToken()}`;
  else if (method !== "GET") body = { ...body, profile: auth.profile };
  if (body) headers["Content-Type"] = "application/json";
  return fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

export async function apiJson<T>(path: string, auth: ApiAuth, init: { method?: string; body?: Record<string, unknown> } = {}): Promise<T> {
  const res = await apiRequest(path, auth, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

/** sessionStorage helpers that never throw (storage can be blocked). */
export function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
