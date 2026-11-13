"use client";

import { CommunityFeed } from "@/components/community/community-feed";
import { ModulePage } from "@/components/module-page";

// CM-01…CM-08 (block B4). Front end on a browser store until the backend in docs/10-backend-plan.md.
export default function CommunityPage() {
  return <ModulePage slug="community" wide>{(profile) => <CommunityFeed profile={profile} />}</ModulePage>;
}
