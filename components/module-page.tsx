"use client";

import { Suspense } from "react";

import type { ApiAuth } from "@/components/api";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Standard tool page: header from lib/modules.ts + profile gate (sign-in or demo username). */
export function ModulePage({
  slug,
  wide,
  header = true,
  children,
}: {
  slug: string;
  wide?: boolean;
  header?: boolean;
  children: (profile: DeveloperProfile, auth: ApiAuth) => React.ReactNode;
}) {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className={cn("mx-auto flex flex-col gap-6 px-4 py-8", wide ? "max-w-7xl" : "max-w-6xl")}>
      {header && <PageHeader slug={slug} />}
      <ProfileGate state={state}>
        {(profile) => <Suspense fallback={null}>{children(profile, { mode: state.mode, user, profile })}</Suspense>}
      </ProfileGate>
    </div>
  );
}
