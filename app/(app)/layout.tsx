"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/components/auth-provider";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  // Signed-out users go back to the landing page.
  // Exception: before Firebase is configured, allow a preview so the UI can be built.
  const blocked = configured && !loading && !user;
  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (configured && (loading || !user)) return <ShellSkeleton />;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="min-h-screen min-w-0 flex-1">
        {!configured && (
          <div className="border-b bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
            Demo mode. Sign-in is turned off on this server, so nothing you do is saved.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

/** V21: the app's shape while sign-in is checked, instead of a blank "Loading" line. */
function ShellSkeleton() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row" aria-busy="true" aria-label="Loading DevVerse">
      <div className="flex flex-col gap-3 border-b bg-sidebar p-4 md:h-screen md:w-60 md:border-r md:border-b-0">
        <Skeleton className="h-7 w-32" />
        <div className="hidden flex-col gap-2 pt-4 md:flex">
          {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Skeleton className="mb-6 h-12 w-72" />
        <PageSkeleton />
      </div>
    </div>
  );
}
