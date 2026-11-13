# 07 — Tech Stack (final)

> Status: **Final for the hackathon, planned for V1** · Derived from the system design (`06-system-design.md`),
> which derives from the requirements (docs 03–04). Driven by D-13 (24 h, 2 people, AI-assisted coding),
> D-14 (Google-first), D-15 (reuse proven pieces) and D-21–D-27.
> **Phases:** **H** = hackathon build · **V1** = post-hackathon milestones · **V2** = later. ✅ = already in the code.

## 1. Selection criteria (in priority order)

1. **Meets an NFR the design depends on** (isolation, secrets, AI-down fallback, cost caps).
2. **Google products where they fit** (hackathon judging; one bill, one console, GCP credits).
3. **No servers to manage.** Managed, scale-to-zero services only (NFR-CO-02).
4. **AI coding tools are very good at it**, so generated code works first time more often.
5. **Free tier or within the GCP credits.**

## 2. Final stack by layer

| Layer | Choice | Phase | Why / requirements |
|-------|--------|-------|--------------------|
| **Language** | TypeScript everywhere | ✅ | One language for UI, server and jobs |
| **App framework** | Next.js 16 (App Router), modular monolith: `lib/<module>/` + `app/api/<module>/` | ✅ | UI + server routes in one deployable; keys stay server-side; NFR-MA-02 |
| **UI** | Tailwind CSS v4 + shadcn/ui (Radix), lucide icons | ✅ | Familiar layouts fast (D-15); light/dark (NFR-UX-04) |
| **Charts** | Recharts | ✅ | Skills, growth, GitHub insights |
| **Markdown** | react-markdown + remark-gfm | ✅ | AI answers, posts |
| **Code editor + diff** | Monaco Editor (`@monaco-editor/react`), incl. DiffEditor | H (B3) | VS Code feel; JS/TS IntelliSense free; AI diffs (AI-05) |
| **Hosting** | **Firebase App Hosting** → Cloud Run + Cloud CDN | ✅ | Deploys from GitHub on push, rollback, scale to zero |
| **Auth** | **Firebase Authentication** (GitHub provider) + **custom claims** for roles | ✅ / H (roles) | ID-01, ID-08 |
| **Abuse protection** | **Firebase App Check** with **reCAPTCHA Enterprise** | H (B6) if time / V1 | Protects public demo + AI routes (NFR-SE-06) |
| **Database** | **Cloud Firestore** (native mode), realtime listeners, TTL policies, scheduled backups + PITR | ✅ / V1 (backups) | Per-user docs fit the profile; live verdicts/notifications for free; NFR-AV-05 |
| **Search / semantic memory** | **Firestore vector search** + **Gemini Embeddings** | H (community) / V1 (code) | Similar questions, search, feed, project retrieval — no extra search service (D-23) |
| **File storage** | **Cloud Storage for Firebase** | V1 | Post images, workspace snapshots |
| **Secrets** | **Secret Manager** (via App Hosting secrets); **Cloud KMS** for GitHub-token encryption | H / V1 (KMS) | NFR-SE-02/03/04 |
| **AI SDK** | Google Gen AI SDK `@google/genai`, behind one wrapper `lib/gemini/client.ts` (the "AI gateway": caps, fallback, model routing) | ✅ | NFR-AI-05/06 |
| **AI access** | **Gemini API via Google AI Studio key** → **Vertex AI** (same SDK, config flag) | ✅ / V1 | IAM auth, no key, quotas, data governance (D-25) |
| **AI models** | Gemini Flash (default) · Gemini Pro (deep analysis, PR review) · Gemini Embedding | ✅ / V1 / H | see §3 |
| **AI features used** | Streaming · JSON (structured) output · **Google Search grounding** · function calling (V1) | ✅ / V1 | AI-01, LN-01, D-16 |
| **AI evals & tracing** | Vitest eval sets (H/V1) → **Firebase Genkit** evals + traces if prompts grow | V1 | NFR-AI-07 |
| **Agents** | Gemini function calling → **Google Agent Development Kit (ADK)** | V2 | AI-12 |
| **GitHub data** | GitHub **GraphQL + REST** APIs via `fetch` (Trees/Contents, Actions logs, Git Data, Search) | ✅ / H / V1 | GH-08–12, WS-01, DP-05, GH-04/05 |
| **Practice judge** | **Judge0 CE (hosted)** → **own judge on Cloud Run** (gVisor, no egress, concurrency 1) | H / V1 | PR-02–04, NFR-SE-01 (D-22) |
| **Async jobs** | **Cloud Tasks** (queues: import, judging) · **Cloud Scheduler** (nightly re-sync, snapshots) · **Cloud Functions for Firebase (2nd gen)** (Firestore triggers, Pub/Sub handlers) · **Pub/Sub** (build events) | V1 | NFR-AV-04, PF-11, GH-08 re-sync (D-21) |
| **Workspace runtime** | **GKE Autopilot + GKE Sandbox (gVisor)**, one pod per workspace, WebSocket terminal, idle stop | V1 (M1, spike first) | WS-04/05/08 (D-26) |
| **User deploys** | **Cloud Build** (buildpacks) → **Artifact Registry** → **Cloud Run**, in a separate `devverse-apps` project; env vars in Secret Manager; rollback via revisions | V1 (M2) | DP-01–10 (D-24) |
| **Observability** | **Cloud Logging** (structured JSON), **Cloud Monitoring** alerts, **Cloud Trace**, **Error Reporting** | H (logs) / V1 | NFR-MA-05 |
| **Analytics** | **Google Analytics for Firebase** | V1 | AD-04 |
| **Cost control** | **Cloud Billing budget alerts** ($15 day one) + BigQuery billing export; per-user AI counters | H / V1 | NFR-CO-01/03 |
| **Email** | Firebase **Trigger Email** extension | V2 | NT-03 |
| **CI** | **GitHub Actions**: `npm run check`, `npm run build`, `npm audit`; Dependabot | V1 | NFR-MA-03, SE-08 |
| **Tests** | Vitest (unit + AI eval sets); Firebase Emulator Suite for rules | ✅ / V1 | NFR-MA-03 |

### Rejected or deferred (and why)

| Option | Decision | Why |
|--------|----------|-----|
| Microservices / separate backend | No | Next.js routes + async jobs cover every flow at 1,000 users (D-21) |
| Separate search engine (Algolia, Elastic) | No | Firestore vector search covers search + similarity (D-23) |
| Dedicated vector DB | No | Same reason; one database |
| Cloud Workstations for the workspace | No | Full VM per user: too heavy and costly for 25 concurrent students |
| Cloud Run per workspace | No | No persistent interactive sessions; shared instances break isolation |
| Running practice code in our app | **Never** | NFR-SE-01 |
| Octokit | Not needed | Plain `fetch` to GitHub APIs already works and keeps the bundle small |
| AWS | Backup only | D-14 |
| Real-time chat, WebContainers | No | D-05; WebContainers need a commercial licence |

## 3. Google AI models

| Model | Phase | Used for |
|-------|-------|----------|
Models are assigned **per agent** (D-28), matching the pitch deck. Line-up checked Nov 2026 (Google Cloud model versions page).

| Agent | Model | Phase |
|-------|-------|-------|
| Profile Analyst, Mentor, Learning Path | **Gemini 3.8 Flash** (`GEMINI_MODEL`), + **Google Search grounding** for Learning Path | ✅ |
| Practice Coach (hints, problem generation) | Gemini 3.8 Flash now → **Gemini 4 Hydrogen** | ✅ / next |
| Orchestrator | **Gemini 4 Hydrogen** (fast, cheap routing) | next |
| Code Reviewer, DevOps & Debug | **Gemini 4 Argon** | next |
| Career (job & issue matching) | **Gemini Embedding 2** + Flash | roadmap |
| Interview (voice mock interviews) | **Gemini 3.8 Live** | roadmap |
| Codebase (Enterprise) | **Gemini 4 Carbon**; **Gemma 4** for private / on-prem | roadmap |
| Extras | **Nano Banana 2.1** (profile cards), **Gemini Omni 1.2 Flash** (video explainers), Flash-Lite (bulk) | roadmap |

Each agent's model is one env var / constant in `lib/gemini/client.ts`; feature code never names a model.
Production moves to **Vertex AI** (same SDK) with agents built on **ADK** and run on **Managed Agents** (D-25, D-28).

## 4. How the pieces fit

See `06-system-design.md §3` (diagram) and `§5` (flows). The core is still:
**GitHub import → evidence → rules engine → Gemini wording → Developer Profile → every module reads it.**

## 5. Environment variables (server-only unless marked)

| Name | Purpose | Phase |
|------|---------|-------|
| `NEXT_PUBLIC_FIREBASE_*` (public) | Firebase web config — safe to expose | ✅ |
| `FIREBASE_SERVICE_ACCOUNT` | Server access to Firestore (local only; App Hosting uses its own identity) | ✅ |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini via AI Studio | ✅ |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Encrypt users' GitHub tokens (→ Cloud KMS in V1) | ✅ |
| `AI_DAILY_LIMIT`, `AI_DEMO_DAILY_LIMIT` | AI caps | ✅ |
| `JUDGE0_API_KEY`, `JUDGE0_API_HOST` | Hosted Judge0 | H (B3) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (public) | App Check | H/V1 |
| `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | Switch to Vertex AI | V1 |

Never commit these. Use `.env.local` locally and App Hosting secrets in production.

## 6. GitHub access scopes

- **Default:** public data only (`read:user`) — enough for public repos, contributions, open-source activity, public Actions logs.
- **Optional, user opt-in:** `repo` for private repositories and for commit/push/PR (V1). This scope also allows writing,
  so explain it and never write without the user's action (cross-cutting rule 1).
- Firebase only returns the GitHub token **at sign-in time** — save it (encrypted, server-side) then.

## 7. Cost guardrails

- **GCP budget alert at $15** on day one; a separate budget on `devverse-apps` in V1.
- Gemini: Flash by default, Pro only where routed; cache profile wording; per-user and demo daily caps (NFR-AI-05).
- Judge0 free tier has a daily limit — run tests only on click, cache verdicts per (problem, code hash).
- GitHub API: 5,000 requests/hour per user token — import once, re-sync incrementally, cache issue searches (TTL).
- Everything scales to zero; workspace pods and user deploys have idle/lifetime limits (NFR-CO-02).

## 8. Building with AI coding tools

- Point your tool at `AGENTS.md` first; it links here.
- Build in the block order of `05-scope-and-roadmap.md §2`; deploy after every block.
- Ask the AI to implement **one requirement ID at a time** (e.g. "implement PR-03") and reference the ID in commits.
