# AGENTS.md — DevVerse

> **This is the single source of truth for any AI coding agent** (Gemini CLI, Firebase Studio, Jules, Codex, Cursor, Copilot, etc.).
> Agent-specific files (`GEMINI.md`, `.github/copilot-instructions.md`) only point here.
> Update this file — not those — when project context changes.

---

## 1. What DevVerse is (the gist)

DevVerse is an **AI-native "developer operating system"**: one browser-based platform where a developer
**learns, codes, gets help, shares, and deploys** — instead of hopping between an editor, an AI assistant,
GitHub, LeetCode, Stack Overflow, Medium, Discord, courses, and a hosting provider.

Elevator pitch: *VS Code + Cursor + GitHub + LeetCode + Stack Overflow + Medium + a deploy platform,
as one continuous, AI-guided workflow.*

## 2. Why we are building it

- **Fragmentation fatigue.** Developers and students juggle 10+ disconnected tools. Every switch loses
  context, and no single tool sees the whole picture of what the developer is doing.
- **AI today is stateless and generic.** Assistants answer the question in front of them but don't know
  *who you are*, what you've built, or where you keep struggling.
- **Learning is disconnected from doing.** Courses and practice platforms don't know what you actually
  ship; your real projects don't feed back into what you should learn next.
- **Deployment is a commodity, debugging it is not.** Platforms show "500 error"; few explain
  *why it failed for you* and how to fix it.

## 3. The core idea (the moat)

Because everything happens in one place, DevVerse can build a **Developer Digital Twin** — a living model
of each developer, built from *evidence* of what they do (code, AI requests, deploys, community activity),
not from chat history. It tracks:

- a **skill graph** (what you know, with confidence),
- a **weakness graph** (recurring struggles — e.g. "keeps forgetting env vars"),
- a **growth timeline** (how you improve over time).

Every part of the platform then becomes personal: the AI assistant answers *"why do my deployments keep
failing?"* using your own history; the learning roadmap targets your real gaps; the community feed surfaces
content for what you're struggling with; deploy failures are explained in plain language.
Community content in turn improves the AI's knowledge — a reinforcing loop.

**Unified + AI-native + personalized** is the bet. Any single feature (IDE, deploy, Q&A) alone is a commodity.

## 4. Who it's for

Students and self-taught learners, individual developers / side-project builders, small teams & startups,
and later enterprises and educational institutions.

## 5. Current state of the repo

**Building — blocks B0 and B1 done.** The project was redesigned from scratch, needs first (D-09).
Current target: a **24-hour Google hackathon build** by 2 people coding with AI help (D-13).
Every module ships at Real / Lean / Later depth (`03` → *Hackathon build*), in the block order of `05 §2`.
Stack is Google-first: Next.js + Firebase + Gemini (`07-tech-stack.md`).
Build priority: GitHub history → Developer Profile → personal AI mentor. Those must never be cut.

### Document map (read in this order)

| File | What it is | Status |
|------|------------|--------|
| `AGENTS.md` | This file — project context for agents | Canonical |
| `docs/01-product-vision.md` | Problem, vision, personas, principles, non-goals | Canonical |
| `docs/02-user-journeys.md` | End-to-end journeys J1–J6 (acceptance tests for V1) | Canonical |
| `docs/03-functional-requirements.md` | Requirements by module with IDs (e.g. `WS-03`) and priorities | Canonical |
| `docs/04-non-functional-requirements.md` | Quality targets with IDs (e.g. `NFR-SE-01`) | Canonical |
| `docs/05-scope-and-roadmap.md` | **24 h build plan**, V1 milestones, **decision log (D-xx)**, open questions (Q-xx) | Canonical |
| `docs/07-tech-stack.md` | Hackathon tech stack, env vars, GitHub scopes, cost guardrails | Canonical |
| `docs/08-data-model.md` | Firestore collections and TypeScript shapes — change here first | Canonical |

### Code layout (blocks B0–B1 done)

- `app/page.tsx` landing + GitHub sign-in · `app/(app)/layout.tsx` signed-in shell with sidebar
- B1 (GH-08/09, DI-*): `lib/github/history.ts` (GitHub import) → `lib/profile/evidence.ts` → `lib/profile/rules.ts`
  (skills, struggles, growth, insights) → `lib/profile/enrich.ts` (Gemini rewrites text only, D-19).
  Server: `lib/server/*` (Firebase Admin, token encryption, `profile-service.ts`), routes in `app/api/`.
  UI: `app/(app)/profile`, `app/(app)/github`, `components/profile/*` (`useProfile()` handles signed-in and demo mode, D-18).
- **Testing (required for every block):** `npm run check` (typecheck + lint + Vitest unit tests in `tests/`),
  `npm run build`, then run the app and click through the feature (dynamic test).
- `app/(app)/[module]/page.tsx` "coming soon" placeholder for every module. **To build a module, create
  `app/(app)/<slug>/page.tsx`** — it overrides the placeholder. Modules are listed in `lib/modules.ts`.
- `components/auth-provider.tsx` (`useAuth()`), `components/ui/*` (shadcn-style), `lib/firebase/client.ts`
- Next.js 16 App Router: route `params` are a Promise (`await params`). Tailwind v4 (theme in `app/globals.css`).
- Secrets are server-only (`.env.local`, App Hosting secrets). Never import them in `"use client"` files.

| `docs/archive/` | Earlier drafts (Jan 2026 AWS docs, architecture brainstorm, master prompt) | **Superseded** — source material only |

Rules: the `docs/0x` files win over anything in `docs/archive/`. Reference requirement and decision IDs in
code, commits and PRs. Don't renumber IDs. If you change direction, add a decision to `05 §4`.
Docs 01–05 are deliberately technology-free; technology lives in `07` and later docs.
Never scrape or copy other sites' code/designs — reuse open-source components and familiar layouts instead (D-15).

## 6. Guidance for agents working here

- Start by reading this file, then the doc relevant to your task.
- Prefer the *why* in §2–3 when making product or design trade-offs: does it reduce context switching,
  and does it feed or use the Developer Digital Twin?
- Keep scope lean; the design notes repeatedly favor starting simple and deferring abstractions.
- If you add code, a new doc, or change direction, update §5 (state + document map) of this file.
- Keep agent-specific instruction files as thin pointers to this file.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
