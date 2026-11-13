"use client";

import { HomeView } from "@/components/home/home-view";
import { ModulePage } from "@/components/module-page";

// Overview (DI-09 across tools, AG-01): next best move in every tool + the AI agent team.
export default function HomePage() {
  return <ModulePage slug="home" wide>{(profile) => <HomeView profile={profile} />}</ModulePage>;
}
