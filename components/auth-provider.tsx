"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  GithubAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function signInWithGitHub() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError(null);
    const provider = new GithubAuthProvider();
    // Public data only by default (docs/07-tech-stack.md §6). Private repos are an opt-in for later.
    provider.addScope("read:user");
    try {
      const result = await signInWithPopup(auth, provider);
      // Firebase only returns the GitHub token at sign-in time. Hand it straight to the server,
      // which stores it encrypted (GH-01, NFR-SE-03). It is never kept in the browser.
      const githubToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
      if (githubToken) {
        const res = await fetch("/api/github/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await result.user.getIdToken()}` },
          body: JSON.stringify({ token: githubToken }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? "Couldn't connect your GitHub account. Please sign in again.");
        }
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError("Sign-in with GitHub didn't work. Please try again.");
      console.error(e);
    }
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, configured: isFirebaseConfigured, error, signInWithGitHub, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
