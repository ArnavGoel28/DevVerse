"use client";

import { useCallback, useState } from "react";

// Browser-only state for tools whose backend isn't built yet (Community, Jobs, Teams; see docs/10-backend-plan.md).
// Never throws: blocked storage just means changes last for this page view.

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** useState that persists to localStorage. Only use in components rendered on the client (after ProfileGate). */
export function useLocal<T>(key: string, initial: () => T): [T, (update: (prev: T) => T) => void, boolean] {
  const [value, setValue] = useState<T>(() => readLocal(key, initial()));
  const [saved, setSaved] = useState(true);
  const update = useCallback(
    (fn: (prev: T) => T) => {
      setValue((prev) => {
        const next = fn(prev);
        setSaved(writeLocal(key, next));
        return next;
      });
    },
    [key],
  );
  return [value, update, saved];
}
