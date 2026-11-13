"use client";

import { useAuth } from "@/components/auth-provider";
import { LearnView } from "@/components/learn/learn-view";
import { PageHeader } from "@/components/page-header";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";

// LN-01…LN-03: roadmap + learning packs (journey J3).
export default function LearnPage() {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="learn" />
      <ProfileGate state={state}>
        {(profile) => <LearnView auth={{ mode: state.mode, user, profile }} profile={profile} />}
      </ProfileGate>
    </div>
  );
}
