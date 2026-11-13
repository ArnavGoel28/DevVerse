"use client";

import { JobsView } from "@/components/jobs/jobs-view";
import { ModulePage } from "@/components/module-page";

// JB-01 (front end, sample listings) — Career agent matching (D-28, D-31).
export default function JobsPage() {
  return <ModulePage slug="jobs" wide>{(profile) => <JobsView profile={profile} />}</ModulePage>;
}
