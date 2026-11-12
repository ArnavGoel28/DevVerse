# 07 — Tech Stack (Hackathon build)

> Status: **Decided for the 24-hour hackathon build** · Driven by D-13 (24 h, 2 people, AI-assisted coding),
> D-14 (Google-first), D-15 (reuse proven pieces) and the requirements in docs 03–04.
> Revisit for post-hackathon V1.

## 1. Selection criteria (in priority order)

1. **AI coding tools are very good at it.** Popular, well-documented choices, so generated code works first time more often.
2. **Google products where they fit** (hackathon judging).
3. **No servers to manage.** Managed services only.
4. **Free tier or within ~$20–30 of GCP credits.**
5. **Secrets stay on the server** (GitHub tokens, Gemini key) — NFR-SE-03/04.

## 2. The stack

| Layer | Choice | Why | Requirements served |
|-------|--------|-----|---------------------|
| Language | **TypeScript** everywhere | One language for UI and server; AI tools generate it reliably | all |
| App framework | **Next.js** (App Router) | UI + server routes in one project, so keys stay server-side; the most common choice AI tools know | all |
| UI | **Tailwind CSS + shadcn/ui** | Ready-made, good-looking components; fast to assemble familiar layouts (D-15) | NFR-UX |
| Charts | **Recharts** | Skill/growth charts on the profile | DI-04/05, GH-09 |
| Hosting | **Firebase App Hosting** (runs on Google Cloud Run) | Deploys Next.js straight from GitHub on every push; uses GCP credits | NFR-MA-04 |
| Sign-in | **Firebase Authentication — GitHub provider** | GitHub sign-in in a few lines; gives us the user's GitHub token | ID-01, GH-01 |
| Database | **Cloud Firestore** | No schema setup, real-time updates, free tier, security rules | all |
| AI | **Gemini API** via the Google Gen AI SDK (`@google/genai`), called only from server routes | Google's model; streaming; JSON output for structured profiles; **Google Search grounding** to find real resource links (D-16) | AI-*, DI-*, LN-*, PR-06/07, DP-05, GH-10/11 |
| GitHub data | **GitHub GraphQL + REST APIs** via **Octokit** | GraphQL for full history (contributions per year, repos, PRs, issues, reviews); REST for languages, failed workflow logs, issue search | GH-08 to GH-12, DP-05 |
| Code editor | **Monaco Editor** (`@monaco-editor/react`) — the editor inside VS Code | Familiar VS Code feel with no effort (D-15) | WS-01, PR-02 |
| Code execution | **Judge0 CE** (hosted API, free tier) | Runs untrusted code in *their* sandbox, never on our servers; many languages | PR-02/03/04, NFR-SE-01 |
| Markdown | **react-markdown** + a markdown editor component | Articles, questions, AI answers with code blocks | CM-01, AI-* |

### Not used in the hackathon build (and why)
- **AWS** — credits kept as a backup only (D-14).
- **Terminal / containers per user** — too much to build safely in 24 h (moved to Later).
- **Separate backend service / microservices** — Next.js server routes are enough at this scale.
- **Vector database** — Gemini's long context + Firestore queries are enough for a demo.

## 3. How the pieces fit

```
Browser (Next.js UI, Monaco)
   │  Firebase Auth (GitHub sign-in)
   ▼
Next.js server routes  ── on Firebase App Hosting / Cloud Run
   ├── GitHub APIs (Octokit)      ← user's GitHub token, stored server-side only
   ├── Gemini API                 ← key in server env only; usage capped per user
   ├── Judge0                     ← runs practice code
   └── Cloud Firestore            ← users, profiles, evidence, roadmaps, problems, submissions, posts
```

**Developer Profile flow (the core):**
GitHub import → raw facts saved as *evidence* in Firestore → Gemini turns evidence into skills / struggles /
growth (JSON) → saved as the profile → every module reads the profile summary (DI-08) when calling Gemini.

## 4. Project layout (suggested)

```
app/                      Next.js pages, one folder per module
  (auth)/  profile/  github/  mentor/  learn/  practice/  community/  workspace/
  api/                    server routes: github/, ai/, judge/, profile/
lib/
  firebase/   github/   gemini/   judge0/   profile/   ← shared logic, one folder per integration
components/              shared UI (shadcn/ui)
docs/                    these documents
```

## 5. Environment variables (server-only unless marked)

| Name | Purpose |
|------|---------|
| `GEMINI_API_KEY` | Gemini API key from Google AI Studio |
| `JUDGE0_API_KEY`, `JUDGE0_API_HOST` | Hosted Judge0 access |
| `FIREBASE_*` (public) | Firebase web config — safe to expose |
| `FIREBASE_SERVICE_ACCOUNT` | Server access to Firestore |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Encrypt users' GitHub tokens before storing them |

Never commit these. Use `.env.local` locally and App Hosting secrets in production.

## 6. GitHub access scopes

- **Default:** public data only (`read:user`) — enough for public repos, contributions and open-source activity.
- **Optional, user opt-in:** `repo` for private repositories. Note this scope also allows writing, so explain it to the user and never write without their action (cross-cutting rule 1).
- Firebase only returns the GitHub token **at sign-in time** — save it (encrypted, server-side) then.

## 7. Cost guardrails

- Set a **GCP budget alert at $15** on day one.
- Gemini: use a Flash-class model by default, a Pro-class model only for the profile analysis; cache profile analysis results; per-user daily cap (NFR-AI-05).
- Judge0 free tier has a daily request limit — run sample tests in the browser UI only on click, and cache results.
- GitHub API: 5,000 requests/hour per user token — import once, then re-sync incrementally.

## 8. Building with AI coding tools

- Point your tool at `AGENTS.md` first; it links here.
- Build in the block order of `05-scope-and-roadmap.md §2`; deploy after every block.
- Ask the AI to implement **one requirement ID at a time** (e.g. "implement GH-09") and to reference the ID in commit messages.
- Use the latest stable versions of each library; check exact Gemini model names in Google AI Studio when starting.
