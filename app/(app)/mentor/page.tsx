"use client";

import { useAuth } from "@/components/auth-provider";
import { MentorChat } from "@/components/mentor/mentor-chat";
import { PageHeader } from "@/components/page-header";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";

// AI-01/03/07: the personal mentor (journey J2). It needs a profile to personalise answers.
export default function MentorPage() {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="mentor" />
      <ProfileGate state={state}>
        {(profile) => <MentorChat auth={{ mode: state.mode, user, profile }} />}
      </ProfileGate>
    </div>
  );
}
