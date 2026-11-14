# 12 — To-do list

> Living list, in order. Update the status as work lands. Details: `09` (UX), `10` (backend), `11` (agents).

| # | Task | Status |
|---|------|--------|
| 1 | **UI uplift grounded in UX psychology research** (principles in §1 below): v1 done — brand system, grouped nav, Home strength ring + top pick, landing, Motion transitions, skeletons, toasts, mobile menu. v2 done: "vibecoded" tells removed and site basics fixed (checklist in §2). v3 done: familiar look per tool (D-33) for Practice, articles, Code (VS Code), Ship (GitHub Actions), Jobs (LinkedIn) and Teams (Linear), plus a Vercel Web Interface Guidelines audit | ✅ v3 done |
| 2 | Cloud project + `.env.local` (checklist in `10` §8); test sign-in, Firestore and Gemini end to end. Verified: GitHub sign-in, profile import, Gemini via Vertex AI for every agent, Learn roadmap and Practice submissions saved to Firestore with evidence and daily AI caps | ✅ done |
| 3 | Deploy to Firebase App Hosting (asia-south1); live URL | ⬜ |
| 4 | Merge `docs/system-design` + `feat/b3-practice` into `main` | ✅ merged (PR 1) |
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

## 2. UI v2 checklist: remove "vibecoded" tells, fix site basics (task 1)

Each item says what it means for DevVerse. N/A items are kept so the list stays complete.

### 2a. Visual tells

| # | Tell | What we do | Status |
|---|------|------------|--------|
| V1 | Harsh gradients | Remove the purple-to-cyan gradient (`bg-brand`, `text-brand`, `ring-brand`) everywhere; solid colours only | ✅ |
| V2 | Lucide icons | Phosphor icons through one module (`components/icons.tsx`); decorative icon tiles removed | ✅ |
| V3 | Pure white background | Warm paper background and off-white cards instead of `#fff` | ✅ |
| V4 | Rainbow colouring | One accent colour plus semantic red/amber; charts in one hue family | ✅ |
| V5 | Drop shadow on everything | No shadows on cards, buttons or tiles; borders do the separating | ✅ |
| V6 | 3 feature cards in a row | Landing "How it works" becomes a numbered list beside a live demo | ✅ |
| V7 | Emojis | Remove from UI copy and toasts | ✅ |
| V8 | Liquid glass | Remove `backdrop-blur` and translucent white fills | ✅ |
| V9 | M-dashes | UI copy and seeded text rewritten; every Gemini call is told not to use em dashes or emojis | ✅ |
| V10 | Inter / Geist / Space Grotesk | IBM Plex Sans + IBM Plex Mono | ✅ |
| V11 | Coloured left stripe | Remove the active-item stripe in the sidebar and stripe borders | ✅ |
| V12 | Big testimonials | None, and none invented | N/A |
| V13 | Bento grids | Home "next moves" becomes a ranked list, not a mixed-size card grid | ✅ |
| V14 | Terminal window | No fake terminals; real code only in the editor | ✅ |
| V15 | "It's not X, it's Y" copy | Rewrite those lines as plain statements | ✅ |
| V16 | Checkmark bullets | Plain or numbered lists | ✅ |
| V17 | 3 pricing tiers | No pricing page in the app | N/A |
| V18 | No real product demos | Landing runs the real profile builder on any GitHub username | ✅ |
| V19 | Soft corner radius | 4–6 px radius; round only avatars and status dots | ✅ |
| V20 | Purple and black | New palette: ink, paper and one deep green accent | ✅ |
| V21 | No skeleton loaders | Skeletons for the app shell and every loading state | ✅ |
| V22 | Radio orbs | Remove the blurred radial "orbs" (`bg-app`, Home hero glow) | ✅ |
| V23 | Dot grids | None in use; keep it that way | ✅ |
| V24 | Sparkle icons | Remove every sparkle icon | ✅ |
| V25 | Animated arrows | No arrow nudges on hover | ✅ |
| V26 | No Terms / no Privacy policy | Add `/terms` and `/privacy` in plain language | ✅ |
| V27 | Hover animations on everything | No lift or scale on hover; colour change only on things you can click | ✅ |
| V28 | Neon colours | Muted, high-contrast colours only | ✅ |
| V29 | Basic pastel colours | No pastel tints as decoration; tints only for state (selected, error) | ✅ |

### 2b. Site basics

| # | Fix | What we do | Status |
|---|-----|------------|--------|
| S1 | Horizontal scrolling | No page wider than the viewport at 375 px and above | ✅ |
| S2 | Broken links | Crawl every internal link; none may 404 | ✅ |
| S3 | Mobile menu | App sidebar collapses to a menu; landing header works on phones | ✅ |
| S4 | Favicon | DevVerse mark as `app/icon.svg`, plus `app/favicon.ico` (16/32/48 px) for browsers that only read ICO | ✅ |
| S5 | Page titles | "Tool · DevVerse" on every page | ✅ |
| S6 | Meta descriptions | One per page, from the tool's tagline | ✅ |
| S7 | Footer links | Footer with Terms, Privacy, contact and source code, all working | ✅ |
| S8 | Custom 404 page | `app/not-found.tsx` with a way back | ✅ |
| S9 | Copyright | "© {current year} DevVerse" in the footer | ✅ |
| S10 | Compress images | Request small GitHub avatars (`s=` size) and lazy-load them | ✅ |
| S11 | Broken buttons | Main actions clicked on every tool; three permanently disabled buttons (Invite, Apply, Deploy) removed | ✅ |
| S12 | Success messages | Toast on every save, vote, post, import, rating and accepted solution | ✅ |
| S13 | Error messages | Every failed request shows what went wrong and what to do | ✅ |
| S14 | Placeholder text | Remove "coming soon", "Preview mode" copy and fake disabled inputs | ✅ |
| S15 | Unused navigation | Remove the unused "coming soon" route and links to it | ✅ removed |
| S16 | Mobile overflow | Long titles, code and tables wrap or scroll inside their box | ✅ |
| S17 | Clickable logo | Logo links home on every page | ✅ |
| S18 | Clickable phone number | No phone number is published | N/A |
| S19 | Clickable email | Contact email is a `mailto:` link | ✅ |
| S20 | Every page mobile optimised | Check every page at 375 px | ✅ |
