"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { PracticeView } from "@/components/practice/practice-view";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";

// PR-01…PR-06 (block B3): Practice + the Practice Coach agent (D-28).
export default function PracticePage() {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="practice" />
      <ProfileGate state={state}>
        {(profile) => <PracticeView auth={{ mode: state.mode, user, profile }} profile={profile} />}
      </ProfileGate>
    </div>
  );
}
