// Shared data shapes. Source of truth: docs/08-data-model.md — change the doc first, then this file.
// Timestamps are ISO-8601 strings (see 08 "Timestamps").

export type SkillFeedback = "confirmed" | "wrong" | "hidden";

/** githubSnapshots/{uid} — cached GitHub import (GH-08). Server-only. */
export type GitHubSnapshot = {
  fetchedAt: string;
  /** "graphql" = full history with a token; "public" = public REST data only (no token, fewer details). */
  source: "graphql" | "public";
  account: {
    login: string;
    name?: string;
    avatarUrl?: string;
    createdAt: string;
    followers: number;
    publicRepos: number;
  };
  contributionsByYear: { year: number; commits: number; pullRequests: number; issues: number; reviews: number }[];
  repos: {
    name: string;
    owner: string;
    isFork: boolean;
    isOwn: boolean;
    stars: number;
    primaryLanguage?: string;
    languages: Record<string, number>; // bytes (or size weight) per language
    topics: string[];
    hasReadme?: boolean; // undefined = unknown (public mode)
    description?: string;
    createdAt: string;
    pushedAt: string;
    commitCount?: number;
  }[];
  externalContributions: { repo: string; pullRequests: number; merged: number }[];
  failedWorkflowRuns: { repo: string; runId: number; name: string; createdAt: string }[];
};

/** users/{uid}/evidence/{id} — DI-02. A fact, never a chat transcript (NFR-PR-01). */
export type Evidence = {
  source: "github" | "practice" | "mentor" | "community" | "workspace" | "deploy";
  kind:
    | "repo_language"
    | "repo_framework"
    | "commit_activity"
    | "pr_merged"
    | "oss_contribution"
    | "problem_solved"
    | "problem_failed"
    | "hint_used"
    | "ai_help"
    | "error_explained"
    | "post_created"
    | "answer_accepted"
    | "workflow_failed";
  skills: string[];
  outcome: "success" | "struggle" | "neutral";
  weight: number;
  detail?: string;
  ref?: string;
  createdAt: string;
};

export type ProfileSkill = {
  id: string;
  name: string;
  parent?: string;
  confidence: number; // 0..1
  evidenceCount: number;
  why: string; // DI-06
  userFeedback?: SkillFeedback;
};

export type ProfileStruggle = {
  topic: string;
  severity: number; // 0..1
  trend: "rising" | "steady" | "falling";
  occurrences: number;
  why: string;
};

export type Recommendation = {
  type: "learn" | "practice" | "contribute" | "github";
  title: string;
  reason: string;
  href?: string;
};

/** Chart-ready numbers for GitHub insights (GH-09). */
export type GitHubStats = {
  login: string;
  avatarUrl?: string;
  memberSince: string;
  source: GitHubSnapshot["source"];
  totals: { repos: number; stars: number; commits: number; pullRequests: number; mergedExternalPRs: number };
  contributionsByYear: GitHubSnapshot["contributionsByYear"];
  topLanguages: { name: string; share: number }[]; // share 0..1
  topRepos: { name: string; owner: string; stars: number; language?: string; pushedAt: string; description?: string }[];
  externalContributions: GitHubSnapshot["externalContributions"];
};

/** users/{uid}/profile/current — the Developer Profile (DI-01…DI-09). */
export type DeveloperProfile = {
  summary: string; // DI-08
  level: "beginner" | "intermediate" | "advanced";
  primaryLanguages: string[];
  focusAreas: string[];
  skills: ProfileSkill[];
  struggles: ProfileStruggle[];
  /** DI-04: skill confidence per year, back-filled from GitHub history. */
  growth: { period: string; skills: Record<string, number> }[];
  githubInsights: { strengths: string[]; gaps: string[]; recruiterView: string }; // GH-09
  githubStats: GitHubStats; // GH-09
  recommendations: Recommendation[]; // DI-09
  /** Which engine wrote the text fields. */
  generatedBy: "gemini" | "rules";
  updatedAt: string;
};
