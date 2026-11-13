# 06 — System Design

> Status: **v1** · Written 2026-11-13, after blocks B0–B2. Turns the requirements (docs 03–04) into a system
> design, and from that the final tech stack (`07-tech-stack.md`). Decisions: D-21 to D-27 in `05 §4`.
> **Phases used below:** **H** = 24-hour hackathon build · **V1** = post-hackathon milestones M1–M4 · **V2** = later.

## 1. Design drivers

The design is sized by the NFRs, not by ambition (D-03):

| Driver | Source | What it forces |
|--------|--------|----------------|
| 1,000 users, 100 concurrent, 10× growth path | NFR-SC-01/02/06 | Managed, autoscaling services; no hand-run servers |
| **Untrusted code** in practice, workspace and deploys | NFR-SE-01, SE-06 | Three sandboxes, **never** on the app servers; deploys in a separate cloud project |
| Secrets never in the browser, AI or logs | NFR-SE-03/04 | Server-only routes; Secret Manager; encrypted GitHub tokens |
| Works when the AI is down | NFR-AV-03 | AI is a layer *on top of* rule-based logic (D-19), never the only path |
| AI cost hard-capped | NFR-AI-05 | One AI gateway that counts every call |
| Streamed answers < 3 s | NFR-PF-05 | Streaming HTTP responses from the server |
| Background work retryable, no double counting | NFR-AV-04 | Queue + idempotent jobs for import, judging, deploys |
| Profile updated within 1 min of an activity | NFR-PF-11 | Recompute inline (rules are cheap) or via a trigger, not a nightly batch |
| Scale to zero when idle | NFR-CO-02 | Serverless everywhere (Cloud Run, Firestore, functions) |
| Modules swappable | NFR-MA-02 | Modular monolith with one folder per module and clear interfaces |

## 2. Architecture style

**A modular monolith on serverless Google infrastructure, with separate sandboxes for untrusted code.**

- One Next.js app (UI + server routes) holds all modules. At our scale microservices would add cost and
  coordination with no benefit. Module boundaries (`lib/<module>/`) let any one be split out later (NFR-MA-02).
- **Async work** (imports, re-syncs, judging, deploy events, notifications) runs as Firebase/Google Cloud
  background jobs, so the request path stays fast.
- **Untrusted code** runs only in isolated sandboxes, never in the app.
- **The Developer Profile is the hub:** modules write *evidence*, one profile service turns it into the profile,
  and every module reads the profile summary.

## 3. High-level architecture

```
                    ┌──────────────────────────── BROWSER ─────────────────────────────┐
                    │ Next.js React UI · Monaco editor/diff · Recharts · Firestore      │
                    │ live listeners (notifications, verdicts, deploy status)           │
                    └───────┬───────────────────────────────────────┬──────────────────┘
          Firebase Auth (GitHub) + App Check                         │ realtime reads
                            │ HTTPS + ID token                       │ (rules-protected)
┌───────────────────────────▼──────────── APP TIER ─────────────────┐ │
│ Firebase App Hosting → Cloud Run (+ Cloud CDN for static assets)  │ │
│ Next.js server routes, one module each:                           │ │
│  identity · github · profile · mentor/AI · learn · practice ·     │ │
│  community · workspace · deploy · notify · admin                  │ │
│  shared: auth check · AI gateway · rate limits · evidence writer  │ │
└──┬──────────┬──────────────┬──────────────┬──────────────┬───────┘ │
   │          │              │              │              │         │
   ▼          ▼              ▼              ▼              ▼         ▼
 GitHub    AI TIER        DATA TIER      ASYNC TIER     SANDBOX TIER (untrusted code)
 APIs      Gemini API     Firestore      Cloud Tasks    Practice judge: Judge0 (H) →
 (GraphQL  (AI Studio H,  (+ vector      Cloud          own judge on Cloud Run, no egress (V1)
 + REST)   Vertex V1)     search)        Scheduler      Workspace runtime: GKE Autopilot +
           Search         Cloud Storage  Cloud Functions GKE Sandbox / gVisor (V1)
           grounding      Secret Manager (Firestore     User deploys: Cloud Build → Cloud Run
           Embeddings     (+ Cloud KMS)  triggers)      in a SEPARATE project (V1)
                                         Pub/Sub
   ─────────────── OPS: Cloud Logging · Monitoring · Trace · Error Reporting · Billing budgets ───────────────
```

## 4. Feature audit: what each module needs, what exists, what's missing

Legend: ✅ built (B0–B2) · 🟡 partly · ❌ missing. "Decision" = what we add, and in which phase.

### ID — Identity & Account
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| GitHub sign-in, account + empty profile | ID-01/02 | ✅ Firebase Auth | — |
| Sessions expire | ID-03 | ✅ Firebase ID tokens (1 h, refreshed) | — |
| Onboarding (level, goal, interests) | ID-05 | 🟡 goal picked in Learn | Short onboarding form → `users.onboarding` · **H (B6)** |
| Roles user/moderator/admin | ID-08 | ❌ | **Firebase Auth custom claims** (`role`), checked server-side and in rules · **H (B4, for moderation)** |
| Visibility settings | ID-07 | 🟡 field exists | Settings page · V1 |
| Export / delete account | ID-06 | ❌ | Server job that deletes `users/{uid}/**`, content authorship anonymised · V1 |
| Email / other sign-in | ID-09 | ❌ | Firebase Auth providers (config only) · V2 |
| Bot / abuse protection on public endpoints | NFR-SE-06 | 🟡 in-memory caps per instance | **Firebase App Check (reCAPTCHA Enterprise)** on API routes; move demo caps to Firestore · **H (B6) if time**, else V1 |

### GH — GitHub
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| Full history import → profile | GH-08 | ✅ GraphQL + REST via `fetch` | Import runs inside one request (`maxDuration 60`); very active accounts may time out → move to a **Cloud Tasks job** with progress in Firestore · V1 (H: keep inline) |
| Periodic re-sync | GH-08 | ❌ | **Cloud Scheduler** → nightly incremental re-sync job · V1 |
| Insights, issue matching | GH-09/10 | ✅ | Cache issue searches with a **Firestore TTL policy** (rate limits, NFR-CM-02) · H (B6) |
| Growth tips, growth tracking | GH-11/12 | 🟡 tips in insights | Snapshot diff over time · V1 |
| Read a repo's files into the editor | WS-01 | ❌ | GitHub **Git Trees + Contents API** → **H (B5)** |
| Commit/push, branch, PR | GH-04/05 | ❌ | GitHub **Git Data API** (blobs → tree → commit → ref), PR API; needs opt-in `repo` scope · V1 (M1) |
| Webhooks for outside changes | GH-07 | ❌ | Read latest SHA on open (no webhook needed at our scale) · V1 |

### DI — Developer Intelligence (the core)
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| Skills, struggles, growth, why, feedback | DI-01–06 | ✅ rules engine + Gemini wording (D-19) | — |
| Evidence from **every** module | DI-02 | 🟡 GitHub + mentor only | One shared `recordEvidence(uid, event)` writer; practice, community, workspace, deploy call it · **H (B3–B5)** |
| Profile refresh ≤ 1 min after activity | NFR-PF-11 | 🟡 only on import | Recompute inline after writing evidence (rules are milliseconds; Gemini wording only on import/daily) · **H**; V1: **Cloud Functions Firestore trigger** on `evidence` |
| Growth snapshots | DI-04 | ✅ back-filled | Daily snapshot by the re-sync job · V1 |
| Public portfolio | DI-07 | ❌ | Public route reading only fields the user marked public · V1 |
| Pause / reset | DI-10 | ❌ | Flag on `users` checked by `recordEvidence` · V1 |

### AI — Assistant
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| Profile-aware chat, streamed | AI-01/07, PF-05 | ✅ | — |
| Explain code / error | AI-03 | ❌ | Workspace "Explain this" → Gemini Flash with the selection + profile summary · **H (B5)** |
| Answers use the **project**, cite files | AI-02, NFR-AI-01 | ❌ | H: send file tree + open file + files the user picks (Gemini's long context is enough). V1: **code retrieval** — chunk repo files, **Gemini Embeddings → Firestore vector search**, cite the chunks used |
| Generate code as a diff, user accepts | AI-04/05 | ❌ | Gemini returns full new file text → **Monaco DiffEditor** → user accepts · V1 (stretch for H) |
| "Learn more" links, teach-me mode | AI-08/09 | 🟡 | Prompt modes in the AI gateway · V1 |
| Ratings, usage caps | AI-10/11 | ✅ Firestore counters | — |
| Model swap without feature changes | NFR-AI-06 | ✅ `lib/gemini/client.ts` wrapper | Switch transport from AI Studio key to **Vertex AI** (same `@google/genai` SDK, flag only) · V1 |
| Eval set re-run on prompt/model change | NFR-AI-07 | ❌ | Vitest-based eval files for explain / hints / failure explanation · V1; **Firebase Genkit** evals + tracing considered once prompts > ~10 |
| Prompt-injection safety | NFR-SE-07 | 🟡 | Untrusted text (repo files, posts, logs) wrapped as quoted data; AI has **no tools that write** in V1; per-user context only · H rule |
| Multi-step agents | AI-12 | ❌ | Gemini **function calling** + Google **Agent Development Kit** · V2 |

### LN — Learning
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| AI roadmap + web resources, auto-progress | LN-01/02 | ✅ (Search grounding) | — |
| Struggle learning packs (explainer + problems + posts) | LN-03 | 🟡 explainer only | Link packs to Practice problems (B3) and Community tags (B4) · **H** |
| Bookmarks | LN-05 | ❌ | `users/{uid}/bookmarks` · V1 |

### PR — Practice
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| Problem list, AI-generated + linked | PR-01/08 | ❌ | Gemini **JSON output** generates problem + tests; external links only (no copied statements) · **H (B3)** |
| Editor, run samples, submit vs hidden tests | PR-02/03 | ❌ | **Monaco** + **Judge0 CE (hosted)**; hidden tests stay server-side · **H (B3)** |
| Isolation, **no network** for submissions | PR-04, SE-01 | ❌ | H: Judge0's sandbox. V1: **own judge on Cloud Run** (gVisor sandbox, egress forced into a VPC with no NAT = no internet, concurrency 1, per-run time/memory limits) — removes the third-party quota (D-22) |
| Queue ≤ 20 concurrent, retryable | SC-04, AV-04 | ❌ | H: Judge0 handles its own queue; verdict polled. V1: **Cloud Tasks** queue with max-concurrency 20, verdict written to Firestore, browser listens |
| Hints that don't leak the solution, failure explanation | PR-06/07 | ❌ | Gemini Flash with a "never give full code" rule + eval set (NFR-AI-04) · **H (B3)** |
| Recommendations from struggles | PR-05 | ❌ | Rank problems by overlap with struggle topics · **H (B3)** |

### WS — Workspace
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| File tree, editor, tabs, search | WS-01 | ❌ | **Monaco** + GitHub Trees API · **H (B5)** |
| Autosave drafts | WS-03, AV-02 | ❌ | Edited files saved as drafts in Firestore (`workspaces/{id}/files`, ≤ 1 MiB each) · H (B5, lean) |
| Diff before commit | WS-06 | ❌ | Monaco DiffEditor vs GitHub version · V1 |
| **Terminal + isolated runtime**, preview, idle stop | WS-04/05/08, PF-03/04 | ❌ | V1 (M1): one sandboxed pod per workspace on **GKE Autopilot with GKE Sandbox (gVisor)**, terminal over WebSocket, files on a persistent disk / Cloud Storage, stopped after 15 min idle. **Spike first** (D-26) |
| Code intelligence | WS-07 | 🟡 Monaco gives JS/TS for free | Python language server inside the workspace pod · V1 |

### DP — Deploy
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| AI explains failed CI runs | DP-05 | 🟡 failed runs listed in snapshot | Fetch the failed job's log tail (GitHub Actions API) → Gemini → plain-language cause + fix · **H (B5)** |
| One-click deploy, templates, public URL | DP-01/04/10 | ❌ | V1 (M2): **Cloud Build** (buildpacks, no Dockerfile needed) → **Artifact Registry** → **Cloud Run** in a **separate `devverse-apps` project** with per-service caps (1 instance, 512 MiB, lifetime limit) — D-24 |
| Env vars write-only | DP-02, SE-04 | ❌ | **Secret Manager** in the apps project, mounted into the Cloud Run service; never read back to the UI |
| Live build logs + status | DP-03 | ❌ | Cloud Build publishes to **Pub/Sub** → Cloud Function writes status to Firestore → browser listens; logs from **Cloud Logging** |
| Rollback, runtime logs, stop | DP-07/08/09 | ❌ | **Cloud Run revisions** (traffic to previous revision), Cloud Logging, delete service; admin kill switch (AD-03) |

### CM — Community
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| Four content types, comments, votes, accept | CM-01/02/04/05 | ❌ | Firestore `content` model (doc 08), votes doc-id = uid (one vote each) · **H (B4)** |
| **Search + similar questions** | CM-07 | ❌ | Firestore has no full-text search. **Gemini Embeddings + Firestore vector search** (`findNearest`) on title + body — semantic search and "similar questions" from one index, no extra search service (D-23) · **H (B4) lean**, tag filter as fallback |
| Personalised feed | CM-08 | ❌ | Fetch recent visible posts, score by tag overlap with profile skills/struggles + votes + recency, on the server · **H (B4)** |
| Report, hide, suspend | CM-10 | ❌ | Report collection + moderator role (custom claims) · H (lean) / V1 |
| Media in posts | CM-01 | ❌ | Links only in H; **Cloud Storage for Firebase** uploads with size/type rules · V1 |
| Reputation, follow | CM-06/09 | ❌ | Counters updated by a Cloud Function on votes / accepts · V1 |

### NT, AD — Notifications, Admin
| Need | Req | Now | Gap → Decision |
|------|-----|-----|----------------|
| In-app notifications | NT-01 | ❌ | `users/{uid}/notifications` written by server / functions; browser **Firestore listener** (no push service needed) · V1 |
| Email digests | NT-03 | ❌ | Firebase **Trigger Email** extension · V2 |
| Admin views, kill switch | AD-01/03 | ❌ | Admin pages behind `role == admin`; flags on `users` checked by the AI gateway and deploy service · V1 |
| Product analytics | AD-04 | ❌ | **Google Analytics for Firebase** events (sign-up, J1 steps) · V1 |

### Cross-cutting platform gaps
| Need | Req | Decision |
|------|-----|----------|
| Backups, tested restore | AV-05 | **Firestore scheduled backups** (daily) + point-in-time recovery · V1 (enable in B6 if time) |
| Logs, metrics, alerts | MA-05 | Structured JSON logs → **Cloud Logging**; **Cloud Monitoring** alerts (5xx rate, AI cost, queue length); **Error Reporting** · H (budget alert day one), V1 rest |
| CI for DevVerse itself | MA-03/04, SE-08 | **GitHub Actions** runs `npm run check` + `npm audit` on every PR; App Hosting deploys `main` and can roll back · V1 (H: run `check` locally) |
| Cost visibility | CO-03 | **Billing budgets + BigQuery billing export**; AI usage counters per user · V1 |
| GitHub token encryption key | SE-02/03 | H: AES key in App Hosting secret (Secret Manager). V1: **Cloud KMS** envelope encryption |

## 5. Key flows

**F1 — Sign-in and GitHub token (✅).** Browser → Firebase Auth GitHub popup → gets ID token + GitHub access token
(only given at sign-in) → `POST /api/github/token` → server encrypts and stores it in `users/{uid}/private/github`.
The browser never sees it again.

**F2 — GitHub import → Developer Profile (✅ inline · V1 async).**
`POST /api/profile/import` → (V1: enqueue Cloud Task, return 202, status in `users.githubImport`) → GitHub GraphQL/REST
→ `githubSnapshots/{uid}` → `evidence` → **rules engine** (skills, struggles, growth) → **Gemini Flash** (summary,
why, recruiter view; JSON output; skipped if AI is down) → `profile/current` → UI reads it.

**F3 — Any activity → evidence → profile (H).** e.g. practice verdict → `recordEvidence({source:"practice", kind:"problem_solved", skills, outcome})`
→ rules recompute (ms) → `profile/current` updated → visible on next read (< 1 min, NFR-PF-11).

**F4 — Mentor answer (✅).** Browser → `/api/mentor` with ID token → server loads the profile (never trusts the
browser's copy when signed in) → AI gateway checks the daily cap → Gemini Flash streams → if Gemini fails, an
offline answer built from the profile (NFR-AV-03) → `ai_help` evidence (facts only, no transcript — D-20).

**F5 — Practice submit (H: Judge0 · V1: own judge).** Browser → `/api/practice/submit` → server attaches **hidden tests**
(never sent to the browser) → judge runs each test with time/memory limits → verdict → `submissions` + evidence →
profile → on failure, optional Gemini explanation (PR-07).

**F6 — Community post (H).** Browser → `/api/community/content` → validate + rate-limit → save → Gemini embedding of
title + body stored on the doc → "similar questions" = `findNearest` on that vector; feed = server-side scoring.

**F7 — Failed CI explanation (H).** Snapshot lists failed workflow runs → user picks one → server fetches the failed
job's log tail via GitHub Actions API → log passed to Gemini **as quoted data** (injection-safe) with the profile's
struggles → cause + fix → `workflow_failed` evidence (feeds struggles like "env vars").

**F8 — One-click deploy (V1).** Browser → `/api/deploy` → detect project type → Cloud Build in `devverse-apps`
project (buildpacks) → image in Artifact Registry → Cloud Run service with caps + Secret Manager env vars →
Pub/Sub build events → Cloud Function → `deployments/{id}` status → browser listener shows live progress →
on failure, F7's explainer runs on the build log.

## 6. Data design (additions to `08-data-model.md`)

Firestore stays the single database (document model fits per-user profiles; realtime listeners give live UI for free).

| New collection / field | For | Phase |
|------------------------|-----|-------|
| `content/{id}.embedding` (vector, 768 dims) + vector index | CM-07 search & similar questions | H |
| `workspaces/{id}` + `files/{pathId}` (draft text, baseSha) | WS-01/03 | H (lean) |
| `users/{uid}/notifications/{id}` | NT-01 | V1 |
| `deployments/{id}` (owner, repo, status, url, revision, logs ref) | DP-01–09 | V1 |
| `reports/{id}` | CM-10 | H/V1 |
| `cache/{key}` with `expiresAt` + **TTL policy** | GitHub issue search, grounding results | H |
| `codeChunks/{id}.embedding` | AI-02 project retrieval | V1 |

**Cloud Storage** (V1): post images, workspace snapshots, build artifacts. **Secret Manager**: platform secrets and users'
deploy env vars. Nothing secret is stored in Firestore unencrypted.

## 7. Security design

- **Trust boundaries:** browser (untrusted) → app tier (trusted, holds secrets) → sandboxes (untrusted code, no secrets,
  no access to our project) → user deploys (separate GCP project, own budget, no route into our data).
- **AuthN/AuthZ:** every route verifies the Firebase ID token; roles from custom claims; Firestore rules give the browser
  only owner-scoped reads; all privileged writes go through the Admin SDK on the server (doc 08 rules table).
- **Secrets:** Secret Manager (via App Hosting secrets); GitHub tokens AES-encrypted (Cloud KMS in V1); never logged,
  never sent to Gemini.
- **AI safety:** only the minimum context per call (NFR-PR-04); untrusted text quoted as data; no write-capable tools in V1;
  every code change is a diff the user accepts (rule 1).
- **Abuse:** App Check, per-user/IP rate limits (AI, submissions, posts, deploys), Cloud Run caps, admin kill switch.

## 8. Scalability, cost and reliability

| Component | At 1,000 users | 10× path |
|-----------|----------------|----------|
| App (Cloud Run via App Hosting) | 0–2 instances, scale to zero | raise `maxInstances`; it's stateless |
| Firestore | free tier / cents | scales automatically; watch hot documents (counters → sharded) |
| Gemini | Flash default, per-user daily cap, cached profile text | Vertex AI quotas / provisioned throughput |
| Judge | Judge0 free tier (H) | own Cloud Run judge, autoscale to the queue |
| Workspaces | 25 concurrent pods, stop after idle | add GKE node capacity (Autopilot does this) |
| Deploys | 50 Cloud Run services, scale to zero | per-user quotas in the apps project |

Reliability: stateless app + managed data = restarts lose nothing; async jobs are idempotent (job id = doc id) and
retried by Cloud Tasks; AI failure falls back to rules/offline answers; daily Firestore backups.

## 9. Environments and delivery

| Environment | What | Notes |
|-------------|------|-------|
| Local | `next dev` + `.env.local` (+ Firebase emulators in V1) | NFR-MA-01 |
| `devverse` GCP/Firebase project | App Hosting backend from `main`, Firestore, Secret Manager | H |
| `devverse-apps` GCP project | Users' deployed apps only (Cloud Build, Cloud Run, Artifact Registry) | V1, own budget alert |
| CI | GitHub Actions: `npm run check`, `npm run build`, `npm audit` | V1 |

## 10. Agent layer (D-28, matches the pitch deck)

The AI tier is organised as **agents**, one per AI job, all behind the AI gateway (`lib/gemini/client.ts`):

| Agent | Module | Model (doc 07 §3) | Status |
|-------|--------|-------------------|--------|
| Profile Analyst | Developer Profile | rules + Gemini 3.8 Flash | ✅ built (`lib/profile/*`) |
| Mentor | AI Mentor | Gemini 3.8 Flash | ✅ built (`lib/mentor/*`) |
| Learning Path | Learn | Flash + Search grounding | ✅ built (`lib/learn/*`) |
| Practice Coach | Practice | Flash → Gemini 4 Hydrogen | B3 (`lib/practice/*`) |
| Code Reviewer, DevOps & Debug | Code, Ship | Gemini 4 Argon | next |
| Orchestrator | all | Gemini 4 Hydrogen | next |
| Career, Interview, Codebase | Jobs, Teams | Embedding 2, 3.8 Live, 4 Carbon / Gemma 4 | roadmap |

Shared rules for every agent: profile summary as context, evidence out (never transcripts), per-user caps,
an offline fallback, and no code change without user approval (AG-01…AG-04). In production they move to ADK on Managed Agents.
