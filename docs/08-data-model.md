# 08 — Data Model (Hackathon build)

> Status: **v1 for the hackathon** · Store: Cloud Firestore (`07-tech-stack.md`).
> Both builders code against these shapes. Change them here first, then in `lib/types.ts`.
> Every timestamp is an **ISO-8601 string** (simple to send to the browser and to test). IDs are Firestore document IDs unless noted.
> The code mirror is `lib/types.ts` — where it adds fields (B1), they are listed under each shape below.

## Collections at a glance

```
users/{uid}                         ← one per signed-in person (uid = Firebase Auth uid)
  private/github                    ← GitHub token (encrypted) — server-only
  evidence/{evidenceId}             ← raw facts the profile is built from
  profile/current                   ← the Developer Profile (derived)
  profile/current/history/{date}    ← daily snapshots for the growth timeline
  roadmaps/{roadmapId}
  mentorThreads/{threadId}/messages/{messageId}
  submissions/{submissionId}
githubSnapshots/{uid}               ← cached GitHub import (server-only)
problems/{problemId}
content/{contentId}                 ← questions, articles, showcases, discussions
  comments/{commentId}
  votes/{uid}
```

## users/{uid}

```ts
type UserDoc = {
  uid: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  onboarding?: {                      // ID-05
    experience: "beginner" | "intermediate" | "advanced";
    goal: string;                      // e.g. "Backend developer internship"
    interests: string[];
  };
  visibility: { profile: "private" | "public" };   // ID-07
  githubImport: { status: "never" | "running" | "done" | "error"; lastRunAt?: Timestamp; error?: string };
  aiUsage: { date: string; requests: number };      // AI-11 / NFR-AI-05 (date = "YYYY-MM-DD")
  createdAt: Timestamp;
};
```

## users/{uid}/private/github *(server-only — never readable by the browser)*

```ts
type GitHubSecretDoc = {
  encryptedToken: string;   // encrypted with GITHUB_TOKEN_ENCRYPTION_KEY (NFR-SE-03)
  scopes: string[];         // e.g. ["read:user"]
  savedAt: Timestamp;
};
```

## githubSnapshots/{uid} *(server-only cache of the import — GH-08)*

```ts
type GitHubSnapshot = {
  fetchedAt: Timestamp;
  account: { login: string; createdAt: string; followers: number; publicRepos: number };
  contributionsByYear: { year: number; commits: number; pullRequests: number; issues: number; reviews: number }[];
  repos: {
    name: string; owner: string; isFork: boolean; isOwn: boolean; stars: number;
    primaryLanguage?: string; languages: Record<string, number>; // bytes per language
    topics: string[]; hasReadme: boolean; description?: string;
    pushedAt: string; commitCount?: number;
  }[];
  externalContributions: { repo: string; pullRequests: number; merged: number }[]; // open-source work
  failedWorkflowRuns: { repo: string; runId: number; name: string; createdAt: string }[]; // for DP-05
};
```

B1 additions: `source: "graphql" | "public"` (public = no token, used by the demo — D-18); `account.name`, `account.avatarUrl`;
per repo `createdAt` (dates evidence for the growth back-fill); `hasReadme` is optional (unknown in public mode).

## users/{uid}/evidence/{evidenceId} — DI-02

The profile is computed from evidence. **Evidence is a fact, not a chat transcript** (NFR-PR-01).

```ts
type Evidence = {
  source: "github" | "practice" | "mentor" | "community" | "workspace" | "deploy";
  kind:
    | "repo_language" | "repo_framework" | "commit_activity" | "pr_merged" | "oss_contribution"
    | "problem_solved" | "problem_failed" | "hint_used"
    | "ai_help" | "error_explained"
    | "post_created" | "answer_accepted"
    | "workflow_failed";
  skills: string[];          // skill ids, e.g. ["typescript", "react"]
  outcome: "success" | "struggle" | "neutral";
  weight: number;            // 1 = normal; bigger = stronger signal
  detail?: string;           // short human-readable reason, shown in "why?" (DI-06)
  ref?: string;              // repo name, problem id, content id…
  createdAt: Timestamp;
};
```

## users/{uid}/profile/current — the Developer Profile (DI-01…DI-08)

Written only by the server (Gemini analysis over evidence). Read by every module.

```ts
type DeveloperProfile = {
  summary: string;                    // 2–3 sentences, used as AI context (DI-08)
  level: "beginner" | "intermediate" | "advanced";
  primaryLanguages: string[];
  focusAreas: string[];               // e.g. ["Backend", "Cloud"]
  skills: {
    id: string;                       // "react"
    name: string;                     // "React"
    parent?: string;                  // "frontend" — builds the skill tree
    confidence: number;               // 0..1
    evidenceCount: number;
    why: string;                      // DI-06
    userFeedback?: "confirmed" | "wrong" | "hidden";
  }[];
  struggles: {
    topic: string;                    // "Environment variables"
    severity: number;                 // 0..1
    trend: "rising" | "steady" | "falling";
    occurrences: number;
    why: string;
  }[];
  githubInsights: {                   // GH-09
    strengths: string[];
    gaps: string[];                   // e.g. "No README in 4 of 6 repos"
    recruiterView: string;            // one paragraph
  };
  recommendations: { type: "learn" | "practice" | "contribute" | "github"; title: string; reason: string; href?: string }[]; // DI-09
  updatedAt: Timestamp;
};
```

B1 additions: `growth: { period: string; skills: Record<skillId, number> }[]` (confidence per year, back-filled from GitHub — DI-04);
`githubStats` (chart-ready numbers for GH-09: totals, contributions by year, top languages, top repos, open-source PRs);
`generatedBy: "gemini" | "rules"` (D-19: skills always come from rules; Gemini only rewrites the text).

`profile/current/history/{YYYY-MM-DD}` stores `{ skills: { id: string; confidence: number }[] }` for the growth chart (DI-04).

## users/{uid}/roadmaps/{roadmapId} — LN-01…LN-03

```ts
type Roadmap = {
  goal: string;
  steps: {
    id: string;
    title: string;
    skillIds: string[];
    status: "todo" | "in_progress" | "done";
    doneBy?: "evidence" | "user";      // LN-02
    resources: { title: string; url: string; kind: "article" | "video" | "docs" | "problem" }[]; // D-16
  }[];
  createdAt: Timestamp;
};
```

## users/{uid}/roadmaps/current — B2 shape (supersedes the sketch above)

`{ goal, trackId, source: "ai" | "curated", steps: { id, title, why?, skillIds, status: "todo" | "done",
doneBy?: "evidence" | "user", manual?: "done" | "todo", resources: { title, url, kind: "article" | "video" | "docs" | "problem" | "course" }[] }[], createdAt }`.
`doneBy` is recomputed from the profile on every read (LN-02); `manual` is the user's override and always wins.

## users/{uid}/aiRatings/{id} — AI-10

`{ rating: "up" | "down", mode: "gemini" | "offline" | "limit", createdAt }`. `users/{uid}.aiUsage` counts AI calls per day (AI-11).

## users/{uid}/mentorThreads/{threadId}/messages/{messageId} — AI-01 *(not used yet — D-20: chats stay in the browser)*

Chats are kept only so the user can scroll back; they are **not** used to build the profile — only the
`ai_help` evidence events are.

```ts
type MentorMessage = { role: "user" | "model"; text: string; rating?: "up" | "down"; createdAt: Timestamp };
```

## problems/{problemId} — PR-01, PR-08

```ts
type Problem = {
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];                     // skill ids
  source: "ai" | "admin" | "external";  // D-16
  externalUrl?: string;                 // when source = "external": link only, no statement copied
  statement?: string;                   // markdown (ai/admin only)
  starterCode?: Record<string, string>; // language -> code
  sampleTests?: { input: string; expected: string }[];
  hiddenTests?: { input: string; expected: string }[]; // server-only; never sent to the browser
  createdFor?: string;                  // uid, when generated for one user
  createdAt: Timestamp;
};
```

## users/{uid}/submissions/{submissionId} — PR-03

```ts
type Submission = {
  problemId: string;
  language: string;
  code: string;
  verdict: "accepted" | "wrong_answer" | "time_limit" | "memory_limit" | "runtime_error" | "compile_error" | "pending";
  passed: number;
  total: number;
  hintsUsed: number;                    // PR-06
  createdAt: Timestamp;
};
```

## content/{contentId} — CM-01…CM-08 (one unified model, D-04)

```ts
type Content = {
  type: "question" | "article" | "showcase" | "discussion";
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  body: string;                 // markdown
  tags: string[];               // skill ids — used for the personalised feed
  url?: string;                 // showcase link
  acceptedCommentId?: string;   // questions only (CM-05)
  score: number;                // upvotes (CM-04)
  commentCount: number;
  status: "visible" | "hidden"; // CM-10
  createdAt: Timestamp;
};
type Comment = { authorId: string; authorName: string; body: string; score: number; createdAt: Timestamp };
type Vote = { value: 1; createdAt: Timestamp }; // doc id = voter uid → one vote per user
```

## Access rules (summary for `firestore.rules`)

| Path | Read | Write |
|------|------|-------|
| `users/{uid}` and sub-collections | owner only | owner, except `profile/*` and `evidence/*` (server only) |
| `users/{uid}/private/*`, `githubSnapshots/*` | server only | server only |
| `problems/*` | signed-in users (server strips `hiddenTests`) | server/admin only |
| `content/*`, `comments`, `votes` | anyone signed in (`status == "visible"`) | author creates/edits own; votes doc id must equal own uid |

"Server only" = written through Next.js server routes with the Firebase Admin SDK, which bypasses rules.
