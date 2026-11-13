"use client";

import { PageHeader } from "@/components/page-header";
import { GitHubInsights } from "@/components/profile/github-insights";
import { ProfileGate } from "@/components/profile/profile-gate";
import { useProfile } from "@/components/profile/use-profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// GH-08 (import) + GH-09 (insights). GH-10/11 arrive in block B2.
export default function GitHubPage() {
  const state = useProfile();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PageHeader slug="github" />
      <ProfileGate state={state}>
        {(profile) => (
          <>
            <GitHubInsights profile={profile} />
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Open-source issues for you &amp; growth tips</CardTitle>
                  <Badge variant="secondary">B2</Badge>
                </div>
                <CardDescription>
                  Coming next: beginner-friendly issues matched to your skills (GH-10) and AI tips to improve your GitHub
                  presence (GH-11).
                </CardDescription>
              </CardHeader>
            </Card>
          </>
        )}
      </ProfileGate>
    </div>
  );
}
