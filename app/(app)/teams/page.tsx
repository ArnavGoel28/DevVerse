"use client";

import { ModulePage } from "@/components/module-page";
import { TeamsView } from "@/components/teams/teams-view";

// TM-01…TM-03 (front end, sample team) — Teams / Enterprise tier (D-29, D-31).
export default function TeamsPage() {
  return <ModulePage slug="teams" wide>{(profile) => <TeamsView profile={profile} />}</ModulePage>;
}
