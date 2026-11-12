"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/components/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  // Signed-out users go back to the landing page.
  // Exception: before Firebase is configured, allow a preview so the UI can be built.
  const blocked = configured && !loading && !user;
  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (configured && (loading || !user)) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {!configured && (
          <div className="border-b bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
            Preview mode — sign-in is not configured yet.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
