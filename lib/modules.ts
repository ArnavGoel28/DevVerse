import {
  BookOpen,
  Briefcase,
  Code2,
  LayoutDashboard,
  Users,
  GitBranch,
  MessageSquare,
  Rocket,
  Sparkles,
  Swords,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Single list of DevVerse modules. Drives the sidebar and the placeholder pages.
 * Requirement IDs refer to docs/03-functional-requirements.md; blocks to docs/05-scope-and-roadmap.md §2.
 */
export type AppModule = {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  block: string;
  depth: "Real" | "Lean" | "Later";
  /** true once app/(app)/<slug>/page.tsx exists (the placeholder is then skipped). */
  built?: boolean;
  features: { id: string; text: string }[];
};

export const MODULES: AppModule[] = [
  {
    slug: "home",
    name: "Home",
    tagline: "Your next best move in every tool, picked from your Developer Profile.",
    icon: LayoutDashboard,
    block: "B6",
    depth: "Real",
    built: true,
    features: [
      { id: "DI-09", text: "Next actions across all tools" },
      { id: "AG-01", text: "Your AI agent team at a glance" },
    ],
  },
  {
    slug: "profile",
    name: "Profile",
    tagline: "Your Developer Profile: skills, struggles and growth, built from what you actually do.",
    icon: UserRound,
    block: "B1",
    depth: "Real",
    built: true,
    features: [
      { id: "DI-01", text: "Skills with confidence and evidence" },
      { id: "DI-03", text: "Recurring struggles and their trend" },
      { id: "DI-04", text: "Growth timeline" },
      { id: "DI-06", text: "See why each skill was inferred, and correct it" },
    ],
  },
  {
    slug: "github",
    name: "Grow your GitHub",
    tagline: "Your whole GitHub history, seen the way a recruiter sees it.",
    icon: GitBranch,
    block: "B1–B2",
    depth: "Real",
    built: true,
    features: [
      { id: "GH-08", text: "Import your entire GitHub history" },
      { id: "GH-09", text: "Insights: contributions, languages, open-source work, gaps" },
      { id: "GH-10", text: "Open-source issues matched to your skills" },
      { id: "GH-11", text: "Tips to improve your GitHub presence" },
    ],
  },
  {
    slug: "mentor",
    name: "AI Mentor",
    tagline: "A Gemini-powered mentor that knows your history.",
    icon: Sparkles,
    block: "B2",
    depth: "Real",
    built: true,
    features: [
      { id: "AI-01", text: "Ask anything about your projects" },
      { id: "AI-03", text: "Explanations at your level" },
      { id: "AI-07", text: "Answers that use your profile and history" },
    ],
  },
  {
    slug: "learn",
    name: "Learn",
    tagline: "A roadmap built for your goal, with real resources.",
    icon: BookOpen,
    block: "B2",
    depth: "Real",
    built: true,
    features: [
      { id: "LN-01", text: "Personal roadmap with linked resources" },
      { id: "LN-02", text: "Steps complete automatically from your activity" },
      { id: "LN-03", text: "Learning packs for your top struggles" },
    ],
  },
  {
    slug: "practice",
    name: "Practice",
    tagline: "Coding problems picked for you, with hints that don't spoil the answer.",
    icon: Swords,
    block: "B3",
    depth: "Lean",
    built: true,
    features: [
      { id: "PR-01", text: "Problems by topic and difficulty" },
      { id: "PR-03", text: "Run and submit, judged automatically" },
      { id: "PR-05", text: "Recommendations from your struggles" },
      { id: "PR-06", text: "Progressive AI hints" },
    ],
  },
  {
    slug: "community",
    built: true,
    name: "Community",
    tagline: "Questions, articles, showcases and discussions in one feed made for you.",
    icon: MessageSquare,
    block: "B4",
    depth: "Lean",
    features: [
      { id: "CM-01", text: "Post questions, articles, showcases, discussions" },
      { id: "CM-02", text: "Comments and answers" },
      { id: "CM-04", text: "Upvotes" },
      { id: "CM-08", text: "Feed personalised by your profile" },
    ],
  },
  {
    slug: "workspace",
    built: true,
    name: "Code",
    tagline: "Open your repo's code in a VS Code-style editor and have it explained.",
    icon: Code2,
    block: "B5",
    depth: "Lean",
    features: [
      { id: "WS-01", text: "Browse and read files in the editor" },
      { id: "AI-03", text: "Explain selected code" },
    ],
  },
  {
    slug: "deploy",
    built: true,
    name: "Ship",
    tagline: "Understand why your builds and deploys fail.",
    icon: Rocket,
    block: "B5",
    depth: "Lean",
    features: [
      { id: "DP-05", text: "AI explains failed GitHub workflow runs" },
      { id: "DP-01", text: "One-click deploy (coming after the hackathon)" },
    ],
  },
  {
    slug: "jobs",
    built: true,
    name: "Jobs",
    tagline: "Roles matched to the skills you've actually proven.",
    icon: Briefcase,
    block: "Later",
    depth: "Later",
    features: [
      { id: "JB-01", text: "Jobs matched to your verified skills, with your gap per role" },
      { id: "JB-02", text: "Share a verified profile with employers" },
    ],
  },
  {
    slug: "teams",
    built: true,
    name: "Teams",
    tagline: "Team skill graphs, onboarding paths and a mentor that knows your codebase.",
    icon: Users,
    block: "Later",
    depth: "Later",
    features: [
      { id: "TM-01", text: "Team skill graph" },
      { id: "TM-02", text: "Onboarding paths for new members" },
      { id: "TM-03", text: "Private codebase agent (Enterprise)" },
    ],
  },
];

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}
