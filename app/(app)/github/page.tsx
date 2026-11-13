"use client";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { GitHubInsights } from "@/components/profile/github-insights";
import { GitHubTips, OssIssues } from "@/components/profile/oss-issues";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";

// GH-08 (import), GH-09 (insights), GH-10 (open-source matching), GH-11 (tips, lean).
export default function GitHubPage() {
  const state = useProfile();
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="github" />
      <ProfileGate state={state}>
        {(profile) => (
          <>
            <GitHubInsights profile={profile} />
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <OssIssues auth={{ mode: state.mode, user, profile }} />
              </div>
              <div className="lg:col-span-2">
                <GitHubTips profile={profile} />
              </div>
            </div>
          </>
        )}
      </ProfileGate>
    </div>
  );
}
