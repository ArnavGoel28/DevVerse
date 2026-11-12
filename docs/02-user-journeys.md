# 02 — User Journeys

> Status: **Draft v1** · Technology-free. These journeys are the acceptance tests for the whole product:
> if V1 can't do J1–J5 end-to-end, V1 isn't done.

Persona details: see `01-product-vision.md §6`. Requirement IDs (e.g. `WS-03`) refer to `03-functional-requirements.md`.

---

## J1 — First session: from sign-up to a live project *(the core loop)*

**Persona:** Riya (student). **Goal:** see the whole product deliver value in one sitting.

1. Riya signs up with her GitHub account. *(ID-01, ID-02)*
2. A short onboarding asks her experience level, goals ("get an internship", "learn backend") and interests. *(ID-05)*
3. DevVerse offers to import her repositories; she picks a half-finished Node.js API. *(GH-02)*
4. DevVerse analyses the repo and seeds her profile: "JavaScript, Express, REST APIs — beginner/intermediate". She can see *why* each skill was inferred. *(DI-01, DI-06)*
5. She opens the project in the browser workspace, runs it in the terminal, and it crashes. *(WS-01, WS-04)*
6. She clicks "Explain this error". The AI explains the cause in beginner-friendly terms and proposes a fix as a diff. She accepts it. *(AI-03, AI-05)*
7. She clicks **Deploy**. DevVerse detects the project type, asks for missing environment variables, and deploys. *(DP-01, DP-02)*
8. She gets a live URL. *(DP-04)*
9. Her profile updates: a new "Deployment" skill appears; the crash is logged as evidence. *(DI-02)*

**Done when:** a new user reaches a live URL in under 30 minutes without leaving DevVerse.

---

## J2 — "Why do my deploys keep failing?" *(personalised AI)*

**Persona:** Kabir (builder). **Goal:** get an answer about *him*, not a generic answer.

1. Kabir's last three deploys failed. He asks the assistant: "Why do my deploys keep failing?"
2. The assistant looks at his profile (struggle: *environment variables*, trending up), his recent deploy history and logs. *(AI-07, DI-03)*
3. It answers: "3 of your last 4 failures were a missing `DATABASE_URL`. Here's how to set it, and a 5-minute explainer on environment variables." *(AI-08, LN-03)*
4. It offers to add a check that warns him before deploying without required variables. *(DP-06)*

**Done when:** the answer cites the user's own history and links a concrete next step.

---

## J3 — "What should I learn next?" *(learning from doing)*

**Persona:** Riya. **Goal:** a roadmap shaped by what she actually does.

1. Riya opens her **Learning** page. *(LN-01)*
2. She sees a roadmap toward her goal ("backend internship"), with steps marked done based on evidence from her projects and solved problems. *(LN-01, LN-02)*
3. Her top struggle ("async/await errors") is highlighted with: a short explainer, 3 practice problems, and 2 community posts. *(LN-03, PR-05, CM-08)*
4. She solves the practice problems; her struggle severity goes down; the growth chart shows it. *(DI-04)*

**Done when:** at least one roadmap step is completed automatically from real activity, not by ticking a box.

---

## J4 — Practice for interviews *(DSA practice)*

**Persona:** Riya. **Goal:** practise problems with useful feedback.

1. She opens **Practice**, filters by topic ("arrays", "easy") or takes a recommended problem. *(PR-01, PR-05)*
2. She writes a solution in the editor, runs it against sample tests, then submits. *(PR-02, PR-03)*
3. Her submission fails a hidden test. She asks for a **hint** (not the answer). The AI gives a nudge appropriate to her level. *(PR-06)*
4. She passes. Her profile records the evidence; similar problems are suggested next. *(DI-02, PR-05)*

**Done when:** submissions are judged correctly and safely, and hints never reveal the full solution unless asked.

---

## J5 — Ask, answer, showcase *(community)*

**Personas:** Riya asks, Meera answers.

1. Riya is stuck. From the workspace she clicks "Ask the community". DevVerse drafts a question with the relevant code and error attached; she edits and posts it. *(CM-01, CM-03)*
2. Before posting, DevVerse shows similar existing answered questions. *(CM-07)*
3. Meera's feed shows the question because it matches her strengths. She answers; Riya accepts it; Meera gains reputation. *(CM-08, CM-05, CM-06)*
4. Later, Riya publishes her finished project as a **Showcase** post with the live URL, and writes an **Article** about what she learned. *(CM-01)*

**Done when:** a question can go from workspace to accepted answer, and both users' profiles reflect it.

---

## J6 — Returning user: progress at a glance

1. Riya opens her **Profile** after a month. *(DI-05)*
2. She sees skills gained, struggles reduced, projects deployed, problems solved, community contributions.
3. She can correct anything wrong ("I don't actually know Docker") and the profile adjusts. *(DI-06)*
4. She shares a public version of the profile as a portfolio link. *(DI-07)*
