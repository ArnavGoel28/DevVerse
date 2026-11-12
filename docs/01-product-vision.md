# 01 — Product Vision

> Status: **Draft v1 (redesign from scratch)** · Supersedes all vision statements in `docs/archive/`.
> This document is deliberately **technology-free**. Technology is chosen later, from the needs defined here.

## 1. One-line definition

**DevVerse is a single place where a developer learns, builds, gets help, shares, and ships — guided by an AI that actually knows them.**

## 2. The problem

| # | Problem | What it looks like today |
|---|---------|--------------------------|
| P1 | **Fragmentation** | A student building one project touches an editor, an AI chat, GitHub, a tutorial site, a Q&A site, a practice site, and a hosting provider. Each switch loses context. |
| P2 | **AI that doesn't know you** | AI assistants answer the question in front of them. They don't know what you've built, what you've already learned, or what you keep getting wrong. Every conversation starts from zero. |
| P3 | **Learning disconnected from doing** | Courses and practice problems don't know what you actually ship. Your real projects never shape what you should learn next. |
| P4 | **Failure without explanation** | Deploys and builds fail with raw logs and error codes. Beginners get stuck for hours on problems an expert would spot in seconds. |
| P5 | **Invisible growth** | Developers can't see how they're improving, and can't show it to others beyond a list of repos. |

## 3. The insight

Each of these problems exists because **no single product sees the whole developer**.
If coding, learning, asking, sharing and deploying happen in one place, the product can build a
continuously updated understanding of each developer — and use it everywhere.

We call this understanding the **Developer Profile** (internally: the *Developer Digital Twin*):

- **Skills** — what you know, and how confidently, based on evidence of what you've done.
- **Struggles** — recurring friction points (e.g. "environment variables", "async errors", "SQL joins").
- **Growth** — how your skills change over time.

The profile is built from **evidence of activity** (code written, problems solved, deploys, AI help requested,
questions asked) — not from what you claim and not from storing your chats.

## 4. Vision

> Every developer has a personal mentor that has watched them build, knows where they struggle,
> and helps them get from idea to deployed project — in one place.

## 5. Why DevVerse wins (differentiation)

1. **Personal, not generic.** The AI answers *"why do my deploys keep failing?"* using *your* history.
2. **The loop is closed.** Building feeds learning; learning feeds building; community content feeds the AI.
3. **Failures become lessons.** Every failed build, test or deploy is explained and turned into a learning signal.
4. **Proof of growth.** A profile that shows *demonstrated* skills and improvement over time.
5. **Grow your GitHub.** Recruiters look at GitHub. DevVerse reads your whole GitHub history, shows it the way a
   recruiter would, matches you to open-source issues you can actually solve, and tracks your progress.

Any single feature (editor, AI chat, deploy button, Q&A) is a commodity. **The combination around one Developer Profile is the product.**

## 6. Target users (personas)

| Persona | Who | Main need | Primary pain |
|---------|-----|-----------|--------------|
| **Riya — the student** *(primary)* | CS student / bootcamp / self-taught | Learn by building real projects; prepare for interviews | Doesn't know what to learn next; stuck on errors; no mentor |
| **Kabir — the builder** | Individual dev, side projects, freelancer | Go from idea to live URL fast | Tool sprawl; deployment friction |
| **Meera — the mentor/contributor** | Experienced dev | Share knowledge, build reputation | Answers vanish in noise; little recognition |
| **Small team** *(later)* | 2–5 people, hackathon/startup | Build together | Coordination across many tools |

**V1 designs for Riya first.** If it works for Riya, it works for Kabir.

## 7. Product principles

1. **One workflow, not many apps.** Every feature should reduce a context switch. If it adds one, question it.
2. **Every action teaches the profile.** New features must say what evidence they produce and/or consume.
3. **Explain, don't just answer.** The AI should leave the user more capable, not more dependent.
4. **Evidence over claims.** Skills are inferred from what users do, and users can see why.
5. **User owns their data.** Profiles are transparent, correctable and deletable.
6. **Start small, design for growth.** Ship a lean version of each module; avoid premature abstraction.
7. **Fewer, better features.** No real-time chat, no separate blog/forum/Q&A silos — one unified content model.

## 8. The core loop

```
   Build (workspace + AI)  ──produces evidence──►  Developer Profile
          ▲                                             │
          │                                             ▼
   Ship & share  ◄──── Learn (roadmap, practice, community, personalised AI)
```

## 9. Success — how we'll know it works (hackathon/academic scale)

| Goal | Signal |
|------|--------|
| Users complete the loop | A new user imports/creates a project, gets AI help, deploys, and sees their profile update — in one session |
| The profile is accurate | Users agree with ≥ 70% of skills/struggles shown (simple thumbs up/down) |
| Personalisation matters | Users rate personalised AI answers higher than generic ones in a side-by-side test |
| Failures become understandable | ≥ 70% of failed deploys get an explanation users rate as helpful |

## 10. Non-goals (explicitly out of scope)

- Replacing a full desktop IDE for professional teams.
- Real-time chat (Discord-style).
- Multi-cloud deployment or arbitrary infrastructure generation.
- Paid plans, billing and marketplace (business model is deferred — see `05-scope-and-roadmap.md`).
- Enterprise features (SSO, compliance certifications, org management).
