# 03 — Functional Requirements

> Status: **Draft v1** · Technology-free: requirements say **what** the system does, never **how**.
> Journeys that exercise these requirements: `02-user-journeys.md`.

## How to read this

- **ID** — stable identifier. Never reuse or renumber; mark removed ones as *Withdrawn*.
- **Priority (V1)** — **M**ust (V1 isn't done without it) · **S**hould (V1 if time allows) · **C**ould (nice to have) · **L**ater (post-V1, see `05-scope-and-roadmap.md`).
- **Profile signal** — what this feature *feeds into* (→DI) or *uses from* (←DI) the Developer Profile. Per principle 2, every module should do at least one.

## Modules

| Code | Module | Purpose |
|------|--------|---------|
| ID | Identity & Account | Who the user is; sign-in; settings; privacy |
| GH | GitHub Integration | Bring the user's existing code in; push work back |
| WS | Workspace (browser IDE) | Edit, run and manage a project in the browser |
| AI | AI Assistant | Context-aware, personal help inside every module |
| DI | Developer Intelligence | Build and expose the Developer Profile |
| LN | Learning | Personal roadmap and targeted learning |
| PR | Practice (DSA) | Coding problems with an automatic judge |
| DP | Deploy | One-click deploy and AI-explained failures |
| CM | Community | Unified content: questions, articles, showcases, discussions |
| NT | Notifications | Tell users what matters |
| AD | Administration & Moderation | Keep the platform safe and operable |
| JB | Jobs | Roles and recruiters matched to proven skills (D-31) |
| TM | Teams | Team and campus skill views, onboarding, codebase agent (D-31) |
| AG | AI agents | One named agent per AI job, shared profile memory (D-28) |

Pitch-deck names (D-31): WS = **Code**, DP = **Ship**, GH = **GitHub Growth**, DI = **Developer Profile**, AI = **AI Mentor**.

---

## ID — Identity & Account

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| ID-01 | Users can sign up / sign in with their GitHub account. | M | — |
| ID-02 | On first sign-in, an account and an empty Developer Profile are created. | M | →DI |
| ID-03 | Users can sign out, and sessions expire after inactivity. | M | — |
| ID-04 | Users can edit display name, bio, avatar and links. | S | — |
| ID-05 | Onboarding captures experience level, goals and interests (skippable, editable later). | M | →DI |
| ID-06 | Users can export all their data and delete their account (deleting all personal data and the profile). | S | — |
| ID-07 | Users choose what is public: profile, projects, activity. Default: private profile, public community posts. | M | — |
| ID-08 | Roles: **user**, **moderator**, **admin**. | M | — |
| ID-09 | Sign in with email/password or other providers. | L | — |

## GH — GitHub Integration

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| GH-01 | Users grant DevVerse access to selected repositories (least privilege, revocable). | M | — |
| GH-02 | Users can list their repositories and import one into a workspace. | M | →DI (repo analysis) |
| GH-03 | On import, the repo is analysed for languages, frameworks, and project type. | M | →DI |
| GH-04 | Users can commit and push changes from the workspace back to GitHub. | M | →DI |
| GH-05 | Users can create a branch and open a pull request from the workspace. | S | →DI |
| GH-06 | Users can create a new repository from a DevVerse template. | S | — |
| GH-07 | Changes pushed to GitHub outside DevVerse are reflected when the workspace is next opened. | S | — |
| GH-08 | On connecting GitHub, the user's **entire GitHub history** is analysed to seed the profile: repositories (own and contributed), languages, commits, pull requests, issues, reviews, and contributions to other people's (open-source) projects. Private repos only if the user grants access. Re-synced periodically. | **M** | →DI |
| GH-09 | **GitHub insights:** show the user's GitHub activity as a recruiter would see it — contribution trend, top languages, open-source contributions, most active repos, gaps (e.g. "no READMEs", "no PRs to other projects"). | M | ←DI |
| GH-10 | **Open-source matching:** suggest beginner-friendly open issues (e.g. labelled "good first issue") in public projects that match the user's skills and goals. | M | ←DI |
| GH-11 | **GitHub growth tips:** AI suggestions to improve the user's GitHub presence — profile README, repo READMEs/descriptions, which projects to pin, next contribution to make. | S | ←DI |
| GH-12 | Track progress on GitHub growth over time (e.g. first open-source PR merged). | S | →DI |

## WS — Workspace (browser IDE)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| WS-01 | Open a project in the browser with a file tree and code editor (syntax highlighting, search, multiple tabs). | M | — |
| WS-02 | Create, rename, move and delete files and folders. | M | — |
| WS-03 | Changes are saved automatically; nothing is lost if the browser closes. | M | — |
| WS-04 | An integrated terminal runs commands (install, run, test) in an isolated environment per workspace. | M | →DI (errors, commands) |
| WS-05 | Users can preview a running web app from the workspace. | S | — |
| WS-06 | Show uncommitted changes (diff) before committing. | M | — |
| WS-07 | Basic code intelligence: autocomplete and error markers for the main languages. | S | →DI (recurring errors) |
| WS-08 | Workspaces stop when idle and resume with files intact. | M | — |
| WS-09 | Users can create a project from a template without GitHub. | C | — |
| WS-10 | Real-time multi-user editing. | L | — |

**V1 supported languages:** JavaScript/TypeScript and Python (must); Java and C++ for Practice only (should).

## AI — AI Assistant

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| AI-01 | A chat panel in the workspace answers questions about the open project. | M | →DI |
| AI-02 | Answers use relevant parts of the project (not just the open file) and show which files they used. | M | — |
| AI-03 | "Explain this": explain selected code or an error, adapted to the user's level. | M | ←DI, →DI |
| AI-04 | Generate code (e.g. a function, a test, a component) from an instruction. | M | →DI |
| AI-05 | Proposed changes are shown as a diff the user must accept or reject. The AI never changes code silently. | M | — |
| AI-06 | Generate tests and documentation for selected code. | S | — |
| AI-07 | The assistant can use the user's profile, deploy history and practice history when answering. | M | ←DI |
| AI-08 | Answers include "learn more" links to relevant learning items or community posts. | S | ←DI |
| AI-09 | "Teach me" mode: guide with hints and questions rather than giving the full answer. | S | ←DI |
| AI-10 | Users can rate an answer (helpful / not helpful). | M | →DI |
| AI-11 | Per-user usage limits prevent abuse and runaway cost; users can see their remaining usage. | M | — |
| AI-12 | Multi-step agent tasks ("add authentication to this API") that plan, edit several files and run commands, with user approval at each step. | C | →DI |
| AI-13 | AI review of a pull request. | L | →DI |

## DI — Developer Intelligence (the Developer Profile)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| DI-01 | Maintain a **skill** list per user, each with a confidence level and the evidence behind it. Skills are organised hierarchically (e.g. *Backend → Node.js → Express*). | M | core |
| DI-02 | Collect **evidence events** from all modules (code written, errors hit, AI help, problems solved, deploys, posts/answers). Store *evidence*, not chat transcripts. | M | core |
| DI-03 | Detect **struggles**: recurring problems with a count, severity and trend (rising/falling). | M | core |
| DI-04 | Keep a **growth timeline** of skill confidence over time. | M | core |
| DI-05 | A profile page shows skills, struggles, growth and activity summary. | M | — |
| DI-06 | Every skill/struggle shows *why* it was inferred; users can confirm, correct or hide items. | M | core |
| DI-07 | A shareable public portfolio view (user chooses what to show). | S | — |
| DI-08 | Provide a "profile summary" other modules (AI, Learning, Practice, Community) can request. | M | core |
| DI-09 | Recommend next actions (learn X, practise Y, read Z) based on goals and struggles. | M | core |
| DI-10 | Users can pause tracking or reset their profile. | S | — |
| DI-11 | Auto-generated resume/portfolio from evidence. | L | — |

## LN — Learning

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| LN-01 | Show a roadmap toward the user's goal (e.g. "Backend developer"). Roadmaps are **AI-generated for the user's profile**, and each step links to existing free resources found on the web (see D-16). | M | ←DI |
| LN-02 | Roadmap steps are marked complete automatically when evidence shows the skill (users can also mark manually). | M | ←DI |
| LN-03 | For each top struggle, show a focused learning pack: short explainer, practice problems, related community posts. | M | ←DI |
| LN-04 | AI-generated explainers for any topic, adapted to user level. | S | ←DI |
| LN-05 | Users can bookmark learning items. | C | →DI |
| LN-06 | Full courses / video content. | L | — |

## PR — Practice (DSA)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| PR-01 | Browse problems by topic, difficulty and status (solved / attempted). | M | — |
| PR-02 | Solve a problem in an editor; run against sample tests. | M | — |
| PR-03 | Submit; the solution is judged against hidden tests with a clear verdict (accepted, wrong answer, time/memory limit, runtime/compile error). | M | →DI |
| PR-04 | User code is executed in isolation with strict time, memory and network limits; it can never affect the platform or other users. | M | — |
| PR-05 | Recommend problems based on struggles and goals. | M | ←DI |
| PR-06 | Progressive AI hints that do not reveal the full solution unless explicitly asked. | S | ←DI, →DI |
| PR-07 | AI explanation of why a submission failed. | S | →DI |
| PR-08 | Problems come from two sources (D-16): **AI-generated** problems with test cases, tailored to the user's struggles, and **links to existing problems** on established practice sites. Admins can also create and edit problems. | M | — |
| PR-09 | Per-problem discussion threads (via Community). | C | →DI |
| PR-10 | Timed contests and leaderboards. | L | — |

## DP — Deploy

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| DP-01 | One-click deploy of a workspace project; DevVerse detects the project type and uses a matching deployment template. | M | →DI |
| DP-02 | Before deploying, detect required configuration (e.g. environment variables) and ask for missing values. Secrets are stored securely and never shown in full again. | M | →DI |
| DP-03 | Show build and deploy progress and logs live. | M | — |
| DP-04 | Successful deploys get a public URL. | M | →DI |
| DP-05 | **When a deploy fails, the AI explains the root cause in plain language and suggests a fix.** This also covers failed CI/deploy runs the user already has on GitHub (e.g. failed workflow runs). | M | →DI |
| DP-06 | Pre-deploy checks warn about common mistakes, prioritising the user's known struggles. | S | ←DI |
| DP-07 | List deployments with status; roll back to a previous successful deploy. | S | — |
| DP-08 | View runtime logs of a running deployment; AI can explain runtime errors. | S | →DI |
| DP-09 | Users can stop/delete deployments; deployments have resource and lifetime limits. | M | — |
| DP-10 | Supported in V1: static frontends and single-service web apps (Node.js, Python). | M | — |
| DP-11 | Managed databases, custom domains, multiple services per project. | L | — |

## CM — Community

One **unified content model**: every post is *content* with a type. No separate blog, forum or Q&A products.

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| CM-01 | Create content of type **Question**, **Article**, **Showcase** or **Discussion**, with markdown and code blocks and tags. | M | →DI |
| CM-02 | Comment on content; answer questions. | M | →DI |
| CM-03 | "Ask the community" from the workspace pre-fills a question with code and error context. | S | →DI |
| CM-04 | Upvote content and answers. | M | →DI |
| CM-05 | Question authors can accept an answer. | M | →DI |
| CM-06 | Reputation from upvotes and accepted answers, shown on profiles. | S | →DI |
| CM-07 | Search content; show similar existing questions while writing a new one. | M | — |
| CM-08 | Personalised feed based on skills, struggles and interests (not just newest). | M | ←DI |
| CM-09 | Follow tags and users. | C | →DI |
| CM-10 | Report content; moderators can hide/remove content and suspend users. | M | — |
| CM-11 | AI-assisted article drafting from a project or learning ("write up what I built"). | C | ←DI |
| CM-12 | Real-time chat. | Won't | — |

## NT — Notifications

| ID | Requirement | Pri |
|----|-------------|-----|
| NT-01 | In-app notifications: answers/comments on your content, accepted answers, deploy finished/failed. | M |
| NT-02 | Users can mark notifications read and choose which types they receive. | S |
| NT-03 | Email digests. | L |

## AD — Administration & Moderation

| ID | Requirement | Pri |
|----|-------------|-----|
| AD-01 | Admin view of users, content reports, deployments and AI usage. | S |
| AD-02 | Admins manage roadmaps and practice problems. | M |
| AD-03 | Admins can disable a user's deployments or AI access. | M |
| AD-04 | Basic product analytics: sign-ups, journey completion (J1), feature usage. | S |

## JB — Jobs (D-31)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| JB-01 | Show job and internship openings matched to the user's evidence-verified skills, with the skill gap for each role. | L | ←DI |
| JB-02 | Users can share a verified profile with employers (opt-in). | L | ←DI |
| JB-03 | Recruiters can search opt-in profiles by proven skills (hiring marketplace, D-29). | L | ←DI |

## TM — Teams (D-31)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| TM-01 | A team view shows the combined skill graph of its members (each member opts in). | L | ←DI |
| TM-02 | Onboarding paths: a new member gets a roadmap built from the team's stack and their own gaps. | L | ←DI |
| TM-03 | A private codebase agent answers questions about the team's repositories (Enterprise). | L | ←DI, →DI |
| TM-04 | Campus view: placement cells see cohort skill gaps and readiness (opt-in by students). | L | ←DI |

## AG — AI agents (D-28)

| ID | Requirement | Pri | Profile signal |
|----|-------------|-----|----------------|
| AG-01 | Each AI feature is owned by one named agent (Profile Analyst, Mentor, Learning Path, Practice Coach, Code Reviewer, DevOps & Debug, Career, Interview, Codebase). | M | — |
| AG-02 | All agents read the same profile summary as context and write evidence, never chat transcripts. | M | ←DI, →DI |
| AG-03 | An orchestrator routes a free-form request to the right agent(s) and merges the answer. | S | ←DI |
| AG-04 | No agent changes code, pushes or deploys without the user's explicit approval (rule 1). | M | — |

---

## Hackathon build (24 h) — what is actually built

The full requirements above describe V1. For the 24-hour Google hackathon build (D-13), **every module
exists**, but each is built at one of three depths. Order and cut lines: `05-scope-and-roadmap.md §2`.

| Depth | Meaning | Modules |
|-------|---------|---------|
| **Real** | Fully working on real data | ID (GitHub sign-in), GH-08/09/10/11 (full history, insights, open-source matching, tips), DI (skills, struggles, growth, profile page), AI mentor chat using the profile (AI-01/03/07), LN-01/03 (AI roadmap + learning packs) |
| **Lean** | Works for real, but minimal | WS (editor on a repo's files + "Explain this" — no terminal), PR (problems + run/submit via a hosted code-execution service + hints), CM (posts of all four types, comments, votes, simple feed), DP-05 (AI explains failed GitHub workflow runs) |
| **Later** | Shown as "coming soon" in the UI, not built | WS-04 terminal, GH-04/05 push & PRs, DP-01–04 one-click deploy, reputation, notifications, admin |

## Cross-cutting rules

1. **User approval for code changes** — no module may modify user code or push to GitHub without an explicit user action.
2. **Evidence, not surveillance** — the profile records structured evidence (what skill, what kind of event, outcome), not raw chats or keystrokes; users can see and delete it.
3. **AI is everywhere but optional** — every core action works without using the AI.
4. **Every feature declares its profile signal** — new requirements must fill in the "Profile signal" column.
