# 10 — Backend Plan (to review together)

> Status: **Proposal**, written 2026-11-13 after the front end for all ten tools was built.
> Nothing here is built yet unless marked ✅. Decisions to confirm are marked **[DECIDE]**.
> Builds on `06-system-design.md`, `07-tech-stack.md`, `08-data-model.md`.

## 1. Where each tool stands

| Tool | Front end | Backend today | Backend to build |
|------|-----------|---------------|------------------|
| Developer Profile, GitHub Growth | ✅ | ✅ Firestore + GitHub import + Gemini wording | Re-sync job (V1) |
| AI Mentor, Learn | ✅ | ✅ streamed Gemini, roadmaps in Firestore | Saved chats (D-20: later) |
| Practice | ✅ | ✅ hints API, submissions + evidence | Judge0 / own judge, AI-generated problems (D-22, D-32) |
| Code | ✅ | ✅ explain API (Code Reviewer) | Private repos via user token, AI diffs (AI-04/05) |
| Ship | ✅ | ✅ explain API (DevOps agent) | Private runs + log tails via user token; deploy (DP-01) |
| Community | ✅ (browser store) | — | §3 |
| Jobs | ✅ (sample listings) | — | §4 |
| Teams | ✅ (sample team) | — | §5 |
| Home | ✅ | uses the above | — |

## 2. Shared foundations (do first)

1. **Cloud project** (you): Firebase project on Blaze, GitHub OAuth app, Firestore, App Hosting backend, Gemini key. Checklist in §8.
2. **`recordEvidence()` helper** (D-27): one server function every route uses; recompute the profile with rules after each write (ms), Gemini rewording only on import / daily.
3. **Rate limits**: move the demo IP counter from memory to Firestore (`rateLimits/{key}`) so it works across instances; add App Check on all `/api/*` routes.
4. **Roles** (ID-08): Firebase custom claims `role: user | moderator | admin`; a tiny admin script to grant them.
5. **Agent model routing** (D-28): `lib/gemini/client.ts` gets `modelFor(agent)` reading env vars (`GEMINI_MODEL_CODE_REVIEWER=gemini-4-argon` etc.), defaulting to Flash.

## 3. Community backend (CM-01…CM-10)

**Data** (08 already sketches it): `content/{id}` with `answers/{id}` sub-collection (rename "comments" → "answers"), `content/{id}/votes/{uid}`, `answers/{id}/votes/{uid}`, `reports/{id}`. Denormalised `score`, `answerCount`, `acceptedAnswerId` on the post.

**API**

| Route | Does | Rules |
|-------|------|-------|
| `GET /api/community?tab&type&tag&q&cursor` | Feed (For you ranked server-side with `forYouScore`) | public read of `visible` posts |
| `POST /api/community` | Create post (validated by `validateDraft`) + embedding | signed in, 10 posts/day |
| `GET /api/community/{id}` | Post + answers; increments views (sharded counter) | — |
| `POST /api/community/{id}/answers` | Answer / response | signed in, 30/day |
| `POST /api/community/{id}/vote` `{answerId?}` | Toggle vote in a transaction | not own content |
| `POST /api/community/{id}/accept` `{answerId}` | Accept / un-accept | question author only |
| `POST /api/community/{id}/report` | Report | signed in |

**Search & similar (CM-07, D-23)**: on create, embed `title + body` with Gemini Embedding 2 → Firestore vector field; `similarQuestions` becomes `findNearest`. The current word-overlap version stays as offline fallback.
**Evidence**: `post_created`, `answer_accepted` (to the answer's author) feed the profile.
**Moderation**: posts with 3+ reports auto-hide pending moderator review. **[DECIDE]** run a Gemini safety check on new posts?
**Migration**: the browser store's actions map 1:1 to these routes; seeded "Sample" posts are not migrated.

## 4. Jobs backend (JB-01…JB-03)

**[DECIDE] job source** (no scraping, D-15):
- (a) Partner / ATS feeds where companies publish openings (Greenhouse, Lever, Workable public job-board APIs) — needs each company's consent.
- (b) Employers post directly on DevVerse (Hiring tier, D-29) — slow to fill at first.
- (c) A licensed jobs data API — costs money.
Recommendation: start with (b) + a handful of (a) partners from our network; (c) only if needed.

**Data**: `jobs/{id}` (same shape as `lib/jobs/model.ts` `Job`, `sample` removed), `users/{uid}/savedJobs/{jobId}`, `applications/{id}` (later).
**Matching**: `matchJob` runs server-side; the Career agent (Embedding 2) adds semantic matching of job text to evidence later.
**Recruiter side (JB-03)**: search over opt-in public profiles only; never private evidence.

## 5. Teams backend (TM-01…TM-04)

**Data**: `teams/{id}` {name, plan, ownerUid}, `teams/{id}/members/{uid}` {role, joinedAt, shareSkills: boolean}, `invites/{code}`.
**Privacy**: a member's skills appear in the matrix only if `shareSkills` is true (opt-in per team).
**API**: create team, invite link (expires 7 days), accept invite, leave, remove member (owner), GET matrix (computed with `teamStack` / `singlePoints` / `onboardingPath`).
**Campus (TM-04)**: same model with `kind: "campus"`; placement cells see cohort aggregates, students opt in.
**Codebase agent (TM-03, Enterprise)**: repo indexing job (Cloud Run job) → chunk + embed → vector search per team; Gemini 4 Carbon or private Gemma 4. Needs GitHub App installation on the org. **[DECIDE]** post-MVP.

## 6. Code & Ship with private repos

Use the signed-in user's stored GitHub token (already encrypted server-side) through server routes `/api/code/tree`, `/api/code/file`, `/api/ship/runs`, `/api/ship/runs/{id}/log` so private repos and full failed-step **log tails** work. Public repos keep the browser path (no token used). Logs are passed to the agent as quoted data, trimmed to the last 200 lines.

## 7. Exceptions and limits (backend)

| Case | Behaviour |
|------|-----------|
| Gemini down / key missing | Every agent returns its offline answer (`callAgent`) — already in place |
| Daily AI cap | 429 → offline answer with "limit" mode (in place) |
| GitHub rate limit | Serve cached snapshot; tell the user when it refreshes |
| Firestore write fails | Return 503 with a retry hint; client keeps the draft |
| Duplicate vote / accept race | Firestore transactions keyed by uid |
| Abuse | App Check + per-route quotas + report/hide |
| Deleting an account (ID-06) | Delete `users/{uid}/**`, anonymise authored content to "deleted user" **[DECIDE]** |

## 8. Cloud setup checklist (for your `.env.local` / App Hosting secrets)

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_APP_ID` | Firebase console → Project settings → Your apps (web) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase console → Service accounts → Generate key (JSON on one line). Local only; App Hosting uses its own identity |
| `GEMINI_API_KEY` | Google AI Studio → Get API key |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Any random 32-byte base64 string (`openssl rand -base64 32`) |
| `GEMINI_MODEL` (optional) | Defaults to `gemini-3.8-flash` |

Also: Firebase Authentication → enable **GitHub** provider with a GitHub OAuth app (callback URL from Firebase);
Firestore → create database; deploy `firestore.rules`; App Hosting → connect the GitHub repo; set a **$15 budget alert**.

## 9. Proposed build order after review

1. Foundations (§2) → 2. Community API → 3. Code/Ship private repos → 4. Teams (create/invite/matrix) → 5. Jobs source → 6. Judge0 + AI-generated problems → 7. Orchestrator (AG-03) + model routing.
