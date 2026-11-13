# 05 — Scope, Roadmap & Decisions

> Status: **Draft v1** · Records what V1 includes, the order we build it in, the decisions that resolved
> conflicts between the old documents, and the questions still open.

## 1. V1 scope summary

V1 includes **all six core modules**, each in a lean form, connected through the Developer Profile:

| Module | V1 in one line |
|--------|----------------|
| Identity + GitHub | Sign in with GitHub; import a repo; commit/push back |
| Workspace | Browser editor + terminal + autosave on one project |
| AI Assistant | Project-aware chat, explain, generate-as-diff, personalised by the profile |
| Developer Intelligence | Skills, struggles, growth from evidence; explainable and correctable |
| Practice | Problems, isolated judge, recommendations, hints |
| Deploy | One-click deploy from templates; AI explains failures |
| Community | Questions/articles/showcases/discussions in one model; personalised feed |
| Learning | Curated roadmaps auto-progressed from evidence; struggle learning packs |

Full list with priorities: `03-functional-requirements.md`. Everything marked **L** is post-V1.

> ⚠️ **Scope risk.** Every module in a 24-hour build is very ambitious. The plan below keeps a deployed,
> demo-able app after every block and defines what to cut first.

## 2. Hackathon build plan (24 hours, 2 people, AI-assisted coding)

Context: Google hackathon, deadline 24 h from 2026-11-13, two builders who code entirely with AI help (D-13).
Every module ships, at the depth set in `03-functional-requirements.md` → *Hackathon build*.
**Rule: a working, deployed demo exists after every block.** Never be more than one block away from something demo-able.

| Block | Hours | Delivers | Demo after this block |
|-------|-------|----------|------------------------|
| B0 | 0–2 | Project created from the stack in `07-tech-stack.md`; app shell (sidebar nav for every module, "coming soon" pages); GitHub sign-in; deployed to a public URL | Sign in, see the app |
| B1 | 2–7 | **Full GitHub history import** (GH-08) → Developer Profile (skills + evidence, struggles, growth) → profile page; GitHub insights (GH-09) | **The core "wow": your profile from your GitHub** |
| B2 | 7–11 | AI mentor chat that uses the profile (AI-01/03/07); AI roadmap with linked resources (LN-01/03); open-source issue matching (GH-10) | Ask "what should I learn next?" — personal answer |
| B3 | 11–15 | Practice: problem list (AI-generated + linked), editor, run/submit via hosted code execution, AI hints (PR-01–06) | Solve a problem, get a hint |
| B4 | 15–18 | Community: one content model (question/article/showcase/discussion), comments, votes, feed ranked by profile (CM-01/02/04/08) | Post a question, see personalised feed |
| B5 | 18–20 | Workspace: open a repo's files in the editor, "Explain this" (WS-01, AI-03); AI explains failed GitHub workflow runs (DP-05) | Explain code / a failed CI run |
| B6 | 20–24 | **Freeze features.** Seed demo account, fix bugs, polish UI, record backup demo video, write submission | Final demo |

**Cut lines if behind:** drop B5 first, then shrink B4 to questions only, then shrink B3 to linked problems only.
**Never cut:** B0–B2 — they are the product's reason to exist.

### Work split for two people

| Person A — "data & AI" | Person B — "screens & modules" |
|------------------------|--------------------------------|
| GitHub import, profile building, Gemini prompts (mentor, roadmap, hints, failure explanation) | App shell, profile page UI, practice UI, community UI, editor UI |

Agree the data shapes (`08-data-model.md`, written in B0) first so both can work in parallel.

## 2b. Post-hackathon V1 milestones

| # | Milestone | Delivers |
|---|-----------|----------|
| M1 | **Real workspace** | Terminal, autosave, commit/push and PRs back to GitHub |
| M2 | **Real deploy** | One-click deploy from templates, live logs, rollback |
| M3 | **Depth** | Reputation, notifications, admin, moderation, privacy export/delete |
| M4 | **Quality** | Accessibility pass, AI evaluation sets, load test at NFR targets |

## 3. After V1 (roadmap, not committed)

| Phase | Themes |
|-------|--------|
| V2 — Deeper AI | Multi-step agent tasks (AI-12), AI PR review, specialised agents (coding, review, learning, deployment), longer-term memory |
| V2 — Collaboration | Real-time co-editing, team workspaces, hackathon spaces (teams, submissions, judging) |
| V2 — Practice | Contests, leaderboards, mock interviews |
| V3 — Portfolio & career | Auto-generated resume/portfolio from evidence, recruiter-facing profiles |
| V3 — Platform | Managed databases, custom domains, multi-service deploys, plugin/template marketplace |
| V3 — Business | Pricing tiers, billing, team/enterprise features (SSO, org management) |

## 4. Decision log

Decisions that resolve conflicts between the archived documents (`docs/archive/`). Format: what was in
conflict → what we decided → why. **Technology conflicts are intentionally deferred** (D-09).

| ID | Topic | Conflict in old docs | Decision | Why |
|----|-------|----------------------|----------|-----|
| D-01 | **Product centre** | README/REQUIREMENTS framed DevVerse as "unified tools + AI"; later design notes made Developer Intelligence the core. | The **Developer Profile** is the product's centre; every module produces or consumes it. | Unification alone is copyable; the personal profile is the moat. |
| D-02 | **Where code lives** | Jan docs: platform-hosted git repos. Later notes: GitHub is the source of truth. | **GitHub is the source of truth** for user code in V1. | Users already live on GitHub; lowers switching cost; avoids building a git host. |
| D-03 | **Scale targets** | Jan docs: 100K concurrent users. Later notes: 10M registered / 99.95%. | **Hackathon/academic scale** (see NFR §1) with a 10× growth path. | Matches the team; avoids designing for problems we don't have. |
| D-04 | **Community shape** | Separate blog, Q&A, forum, showcase services vs. one model. | **One unified content model** with types. | Simpler search, feed, moderation and AI; fewer things to build. |
| D-05 | **Chat** | Master prompt included Discord-style chat; later notes rejected it. | **No real-time chat.** | High moderation cost, noise, little learning value. |
| D-06 | **Deploy approach** | "One-click deploy to many AWS services" vs. "AI generates infrastructure" vs. "templates". | **Fixed deploy templates per project type**; AI explains failures. No AI-generated infrastructure in V1. | Reliable and safe; the differentiator is the *explanation*, not the plumbing. |
| D-07 | **AI agents** | Master prompt: 6 agent types; later notes: start with 4. | V1 ships **one assistant** with a small set of tools; specialised agents are V2. | Fewest moving parts that still deliver J1–J5. |
| D-08 | **Business model** | Jan docs: detailed pricing, revenue projections, marketplace. | **Deferred.** V1 has usage limits, no billing. | Not needed to prove the product; hackathon context. |
| D-09 | **Technology** | Jan docs: serverless-only AWS. Later notes: containers/Kubernetes, multiple databases. | Technology is chosen **after** requirements, driven by them. Now done: see D-14 and `07-tech-stack.md`. | Needs first, then tools. |
| D-10 | **DSA practice** | In master prompt, absent from Jan docs. | **In V1** (lean: no contests). | Strong fit for the primary persona (students) and a rich source of profile evidence. |
| D-11 | **Learning content** | "AI-curated resources" vs. "courses". | **Curated roadmaps + AI explainers + practice + community posts.** No courses/videos in V1. | Content creation is expensive; reuse what the loop already produces. |
| D-12 | **Primary persona** | Old docs listed everyone from students to enterprises equally. | **Students/learners first**, individual builders second. | Clearest need for a personal mentor; matches the team's context. |
| D-13 | **Build context** | — | **24-hour Google hackathon, 2 builders, AI-assisted coding.** All modules ship, at Real/Lean/Later depth. | Answers Q-01, Q-03. Showing the whole vision matters to judges; depth goes where the differentiator is. |
| D-14 | **Google-first technology** | Old docs: AWS-only. | Prefer **Google products** (Gemini, Firebase, Google Cloud). Run on the GCP credits; AWS credits kept as backup. | Answers Q-02, Q-04: it's a Google hackathon. |
| D-15 | **Build on proven pieces** | — | Each module reuses **open-source components and familiar layouts** (VS Code's editor component, Reddit/Stack Overflow-style feeds, Medium-style article view) and **hosted services** (e.g. code execution) instead of building from scratch. We do **not** scrape or copy other sites' code or designs. | Only way to ship every module in 24 h; familiar UX is easier for users. Copying sites is legally risky and gives HTML, not working features. |
| D-16 | **Learning & practice content** | — | **Both**: Gemini generates roadmaps and problems tailored to the user, **and** links to existing free resources and problems found on the web. | Answers Q-05. Nothing to write by hand; links add trusted depth. |
| D-17 | **GitHub history** | — | Analyse the user's **entire GitHub history**, and add a **"Grow your GitHub"** feature set (insights, open-source matching, tips) — GH-08 to GH-12. | Answers Q-06. Recruiters look at GitHub and open-source work; helping users grow it is a strong, concrete value. |
| D-18 | **Try without signing in** | — | Anyone can type a public GitHub username and see the profile DevVerse would build (public data only, nothing saved). Signing in adds full history. | Judges and first-time visitors see the core value in seconds, before trusting us with sign-in. |
| D-20 | **Mentor chats stay on the device (for now)** | — | Mentor conversations are kept only in the browser tab. The profile learns from short facts ("asked about React"), never from chat text; answer ratings are kept to measure quality. | Matches the privacy rule (evidence, not transcripts) and saves build time. Saved chat history can come later. |
| D-19 | **Explainable profile first, AI wording second** | — | Skills, confidence and struggles are computed from evidence by fixed rules; the AI only writes the summary, explanations and next steps. If the AI is unavailable, the profile still works. | Every skill can show *why* (DI-06), results are testable and stable, and AI cost or outages never break the core feature. |
| D-21 | **System shape** | Old docs: serverless Lambdas vs. containers/microservices. | A **modular monolith** (one Next.js app, one folder per module) on App Hosting/Cloud Run, plus **async jobs** (Cloud Tasks, Scheduler, Cloud Functions, Pub/Sub) from V1 and **separate sandboxes** for untrusted code. See `06-system-design.md`. | Smallest thing that meets every NFR at 1,000 users; modules can be split out later (NFR-MA-02). |
| D-22 | **Practice judge** | — | Hackathon: hosted **Judge0 CE**. V1: our own judge on **Cloud Run** (gVisor, no network egress, concurrency 1) behind a Cloud Tasks queue. | Fastest safe start; V1 removes the third-party daily limit and keeps everything on Google Cloud. |
| D-23 | **Search** | Old docs: OpenSearch / separate search. | **Gemini Embeddings + Firestore vector search** for community search, similar questions and (V1) project-code retrieval. No separate search service. | Firestore has no full-text search; one vector index gives semantic search and similarity without another system to run. |
| D-24 | **User deployments** | D-06 said templates, no tech. | **Cloud Build (buildpacks) → Artifact Registry → Cloud Run** in a **separate GCP project** (`devverse-apps`) with per-service caps; env vars in Secret Manager; rollback via revisions. | Isolates users' apps from our data and budget (NFR-SE-06); Cloud Run gives URLs, revisions and logs for free. |
| D-25 | **Gemini access** | — | Hackathon: Gemini API with an **AI Studio** key. V1: **Vertex AI** through the same `@google/genai` SDK (config switch). | No code change (NFR-AI-06); V1 gets IAM auth, quotas and enterprise data terms. |
| D-26 | **Workspace runtime** | Old docs: Fargate / EFS. | V1: one **GKE Sandbox (gVisor)** pod per workspace on **GKE Autopilot**, WebSocket terminal, idle stop. **Spike before committing** (M1). Not Cloud Workstations (too heavy) or Cloud Run (no persistent interactive sessions). | Strongest isolation for interactive untrusted code that still scales to zero nodes. |
| D-27 | **Evidence from every module** | — | One shared `recordEvidence()` writer; the rules engine recomputes the profile inline after each event (V1: Firestore trigger). Gemini rewording only on import / daily. | Meets "profile updated within 1 min" (NFR-PF-11) cheaply; keeps every module feeding the twin (principle 2). |

## 5. Open questions

All of Q-01 to Q-06 are answered (D-13 to D-17). New ones:

| ID | Question | Why it matters | Owner |
|----|----------|----------------|-------|
| Q-07 | Does the hackathon require specific Google products (e.g. Gemini mandatory, Firebase, a judging criterion)? | May change `07-tech-stack.md`. | Team (check the hackathon rules) |
| Q-08 | What's the team/project name and the one-sentence pitch for the submission? | Needed in B6. | Team |

## 6. Next documents

1. `07-tech-stack.md` — **written** (Google-first, hackathon build).
2. `08-data-model.md` — data shapes both builders share (write in B0).
3. `06-system-design.md` — **written** (system design, feature gap audit, D-21–D-27).
4. `09-ai-architecture.md`, `10-workspace-and-execution.md`, `11-security.md`, `12-api-spec.md` — after the hackathon, for V1.
