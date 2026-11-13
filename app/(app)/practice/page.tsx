"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { PracticeView } from "@/components/practice/practice-view";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";

// PR-01…PR-06 (block B3): Practice + the Practice Coach agent (D-28). Problem list and workspace share this route (?problem=).
export default function PracticePage() {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <Suspense fallback={<PageHeader slug="practice" />}>
        <Header />
      </Suspense>
      <ProfileGate state={state}>
        {(profile) => (
          <Suspense fallback={null}>
            <PracticeView auth={{ mode: state.mode, user, profile }} profile={profile} />
          </Suspense>
        )}
      </ProfileGate>
    </div>
  );
}

/** The problem workspace gets the full height, like problem sites; the list keeps the page header. */
function Header() {
  return useSearchParams().get("problem") ? null : <PageHeader slug="practice" />;
}
