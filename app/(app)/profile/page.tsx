"use client";

import { PageHeader } from "@/components/page-header";
import { ProfileGate } from "@/components/profile/profile-gate";
import { ProfileView } from "@/components/profile/profile-view";
import { useProfile } from "@/components/profile/use-profile";

// DI-01…DI-09: the Developer Profile page (journeys J1, J6).
export default function ProfilePage() {
  const state = useProfile();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="profile" />
      <ProfileGate state={state}>
        {(profile) => <ProfileView profile={profile} onFeedback={(id, fb) => void state.setFeedback(id, fb)} />}
      </ProfileGate>
    </div>
  );
}
