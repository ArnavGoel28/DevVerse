# 12 — To-do list

> Living list, in order. Update the status as work lands. Details: `09` (UX), `10` (backend), `11` (agents).

| # | Task | Status |
|---|------|--------|
| 1 | **UI uplift grounded in UX psychology research** (principles in §1 below): v1 done — brand system, grouped nav, Home strength ring + top pick, landing, Motion transitions, skeletons, toasts, mobile menu. Next: per-tool polish pass | 🟡 v1 done |
| 2 | Cloud project + `.env.local` (checklist in `10` §8); test sign-in, Firestore and Gemini end to end. Done: GitHub sign-in, profile import to Firestore, Gemini via Vertex AI for Mentor, Practice Coach, Code Reviewer, DevOps. Left: Learn roadmap and practice submit while signed in | 🟡 mostly done |
| 3 | Deploy to Firebase App Hosting (asia-south1); live URL | ⬜ |
| 4 | Merge `docs/system-design` + `feat/b3-practice` into `main` | ⬜ |
| 5 | Agentic platform phases A1–A4 (registry, redaction guard, agent API + SSE, orchestrator routing) — `11` §12 | ⬜ |
| 6 | Community backend (`10` §3) | ⬜ |
| 7 | Agentic phases A5–A8 (MCP tool servers, session store, model pool + caching, observability + cost tracker) | ⬜ |
| 8 | Code & Ship on private repos with log tails (`10` §6) | ⬜ |
| 9 | Teams backend, then Jobs source (`10` §4–5) | ⬜ |
| 10 | Agentic phases A9–A10 (fan-out, planner with approval, eval suite in CI, Gemma 4 / tenant isolation) | ⬜ |
| 11 | Practice: Judge0 / own judge, AI-generated problems, more languages | ⬜ |
| 12 | Quality: accessibility + mobile pass, dark-mode pass, end-to-end tests, CI on GitHub | ⬜ |

## 1. UI psychology principles used in task 1

Each principle comes from published research; each is applied ethically (no dark patterns — Mathur et al., 2019).

| Principle (research) | What it says | How DevVerse applies it |
|----------------------|--------------|-------------------------|
| Aesthetic-usability effect (Kurosu & Kashimura, 1995; Tractinsky et al., 2000 "What is beautiful is usable") | Attractive interfaces are perceived as easier to use and trusted more | Brand gradient, depth (soft shadows), consistent rounded cards, motion on hover |
| First impressions in 50 ms (Lindgaard et al., 2006) | Visual appeal is judged almost instantly | Bold hero on landing and Home: clear headline, gradient accent, no clutter above the fold |
| Hick–Hyman law (Hick, 1952; Hyman, 1953) & cognitive load (Sweller, 1988; Miller, 1956) | More choices → slower decisions; working memory is small | Sidebar grouped into 4 labelled sections (You · Grow · Build · Connect) instead of 11 flat items |
| Von Restorff isolation effect (1933) | The item that stands out is remembered and acted on | Home marks one **Top pick** action with a highlighted card |
| Endowed progress effect (Nunes & Drèze, 2006) & goal-gradient (Kivetz, Urminsky & Zheng, 2006) | People finish goals they see as already started, and speed up near the end | **Profile strength** ring that starts from real progress and shows the next steps to the next level |
| Zeigarnik effect (1927) | Unfinished tasks stay on our minds | "Pick up where you left off" items and visible checklists |
| Self-determination theory (Deci & Ryan, 2000) | Competence, autonomy and relatedness drive motivation | Visible skill growth, user choice of next move, community "questions you can answer" |
| Peak-end rule (Kahneman et al., 1993) | Experiences are remembered by their peak and their end | Celebration moment when a problem is accepted; warm, positive end states |
| Flow (Csikszentmihalyi, 1990) | Engagement peaks when challenge matches skill | Practice recommendations by level (already built) |
| Social proof (Cialdini, 1984) | We follow what others do | Real activity signals (votes, answers) — never invented numbers |
| Gestalt proximity & similarity (Wertheimer, 1923) | Grouped, similar items read as one unit | Consistent card anatomy: icon tile, title, one line, one action |
| Fitts's law (1954) | Bigger, closer targets are faster to hit | Full-width clickable cards and generous hit areas for primary actions |
