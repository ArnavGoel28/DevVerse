# 04 — Non-Functional Requirements

> Status: **Draft v1** · Technology-free. These are the quality targets the architecture must meet.
> **Scale assumption:** hackathon / academic V1. Targets are sized for a demo-able product with real users,
> not for millions. The old "10M users / 99.95%" targets are deliberately dropped (see `05-scope-and-roadmap.md`, D-03).
> Where a design choice would make later growth very hard, the architecture docs must say so.

Each NFR has an ID, a measurable target, and how it will be checked.

> **Hackathon build (24 h):** only these NFRs are must-haves for the demo — NFR-SE-01 (untrusted code runs
> only on the hosted code-execution service, never on our servers), NFR-SE-03/04 (GitHub tokens and secrets
> never reach the browser or the AI), NFR-AV-03 (app still works if the AI is down), NFR-AI-05 (AI usage caps,
> to protect the credits), NFR-PF-05 (streamed AI answers) and NFR-UX-05 (helpful error messages).
> The rest are V1 targets.

## 1. Capacity & scale (V1)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SC-01 | Registered users | up to **1,000** |
| NFR-SC-02 | Concurrent active users | up to **100** |
| NFR-SC-03 | Concurrently running workspaces | up to **25** (others queue or wait with a clear message) |
| NFR-SC-04 | Concurrent practice submissions being judged | up to **20**; extra submissions queue |
| NFR-SC-05 | Live deployments | up to **50** at once, each with a resource and lifetime cap |
| NFR-SC-06 | Growth path | Every component must be able to scale ~10× by adding resources, without a redesign. |

## 2. Performance

| ID | Requirement | Target (95th percentile) |
|----|-------------|---------------------------|
| NFR-PF-01 | Page / view load after sign-in | < 2 s |
| NFR-PF-02 | Typing in the editor | No perceptible lag (< 50 ms; editing is local to the browser) |
| NFR-PF-03 | Opening a stopped workspace | < 30 s, with progress shown |
| NFR-PF-04 | Terminal command echo | < 200 ms |
| NFR-PF-05 | AI assistant — first visible output | < 3 s (answers stream as they're produced) |
| NFR-PF-06 | AI assistant — complete answer | < 20 s for typical questions |
| NFR-PF-07 | Practice verdict | < 10 s after submit (excluding queue time, which must be shown) |
| NFR-PF-08 | Deploy — start | < 10 s after clicking Deploy; typical full deploy < 5 min |
| NFR-PF-09 | Deploy failure explanation | < 30 s after failure |
| NFR-PF-10 | Search and feed | < 1 s |
| NFR-PF-11 | Profile update after an activity | visible within 1 minute (near-real-time is fine; instant is not required) |

## 3. Availability & reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AV-01 | Availability during demo/evaluation windows | 99% ; best-effort otherwise |
| NFR-AV-02 | No data loss of saved user code | Autosaved work survives browser close, workspace stop and platform restarts |
| NFR-AV-03 | Graceful degradation | If the AI provider is down, editing, running, practice judging and deploying still work; the UI says AI is unavailable |
| NFR-AV-04 | Background work is retryable | Profile updates, deploys and judging survive a component restart without losing or double-counting work |
| NFR-AV-05 | Backups | User data backed up at least daily; restore tested once before launch |

## 4. Security

| ID | Requirement |
|----|-------------|
| NFR-SE-01 | **Untrusted code isolation.** Code in workspaces, practice submissions and deployments is untrusted. It must run isolated from the platform and from other users, with CPU, memory, disk, time and network limits. Practice submissions get **no network access**. |
| NFR-SE-02 | All traffic is encrypted in transit; stored user data and secrets are encrypted at rest. |
| NFR-SE-03 | GitHub access uses the minimum permissions needed, scoped to repos the user chose; tokens are stored encrypted and never exposed to the browser or to user code. |
| NFR-SE-04 | Deploy secrets (environment variables) are write-only from the UI, never logged, never sent to the AI. |
| NFR-SE-05 | Every request is authenticated and authorised; users can only access their own private resources. Role checks for moderator/admin actions. |
| NFR-SE-06 | Abuse limits: rate limits on sign-up, AI use, submissions, deploys and posting. Deployments cannot be used for crypto-mining, spam or attacks (resource caps + admin kill switch, AD-03). |
| NFR-SE-07 | AI safety: the AI cannot execute actions or change code without user approval (cross-cutting rule 1); untrusted content (repo files, posts) must not be able to make the AI leak other users' data or secrets. |
| NFR-SE-08 | Dependencies scanned for known vulnerabilities before each release. |

## 5. Privacy & data

| ID | Requirement |
|----|-------------|
| NFR-PR-01 | The Developer Profile stores structured evidence, not raw chat logs or keystrokes. |
| NFR-PR-02 | Users can view, correct, export and delete their profile and data (ID-06, DI-06). Deletion completes within 30 days, including backups' expiry. |
| NFR-PR-03 | Private code and profile data are never shown to other users and are not used to train AI models. |
| NFR-PR-04 | Only the minimum necessary context is sent to the AI provider for each request. |
| NFR-PR-05 | A plain-language privacy page explains what is tracked and why. |

## 6. AI quality & cost

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AI-01 | Answers about a project cite the files they used (AI-02). | 100% of project answers |
| NFR-AI-02 | Helpfulness rating (AI-10) | ≥ 70% "helpful" |
| NFR-AI-03 | Deploy-failure explanations identify the right root cause | ≥ 70% on a test set of common failures |
| NFR-AI-04 | Practice hints never contain a full solution unless asked | verified on a test set |
| NFR-AI-05 | AI cost is capped per user per day and in total per month; the system stops gracefully at the cap. | hard caps, configurable |
| NFR-AI-06 | The AI provider/model can be swapped without changing feature code. | — |
| NFR-AI-07 | An evaluation set of prompts (explain, generate, deploy-failure, hints) is kept and re-run when prompts or models change. | — |

## 7. Usability & accessibility

| ID | Requirement |
|----|-------------|
| NFR-UX-01 | A first-time user completes journey J1 without documentation in < 30 minutes. |
| NFR-UX-02 | Works on the latest two versions of Chrome, Edge, Firefox and Safari on desktop. Mobile: read-only views (profile, community, learning) usable; editing not required. |
| NFR-UX-03 | WCAG 2.1 AA for core flows (keyboard navigation, contrast, screen-reader labels). |
| NFR-UX-04 | Light and dark themes. |
| NFR-UX-05 | Error messages say what happened and what to do next — never a bare error code. |

## 8. Maintainability & operability

| ID | Requirement |
|----|-------------|
| NFR-MA-01 | The system can be run locally by a new team member with one documented setup step sequence in < 1 hour. |
| NFR-MA-02 | Module boundaries match `03-functional-requirements.md`; modules talk through defined interfaces, so any one can be rewritten or split out later. |
| NFR-MA-03 | Automated tests for core flows (J1, J4) run on every change. |
| NFR-MA-04 | Every deploy of DevVerse itself is automated and can be rolled back. |
| NFR-MA-05 | Structured logs, basic metrics (errors, latency, AI cost, queue lengths) and alerts for outages. |
| NFR-MA-06 | Configuration and secrets are separated from code. |

## 9. Cost

| ID | Requirement |
|----|-------------|
| NFR-CO-01 | Total running cost for V1 fits a student/hackathon budget; prefer free tiers and credits. *(Exact budget: open question Q-02.)* |
| NFR-CO-02 | Idle resources (workspaces, deployments) stop automatically; no meaningful cost when nobody is using the platform. |
| NFR-CO-03 | Cost per active user is measured and visible to admins. |

## 10. Compliance

| ID | Requirement |
|----|-------------|
| NFR-CM-01 | Terms of service and privacy policy in place before public users. |
| NFR-CM-02 | Respect GitHub's API terms and rate limits. |
| NFR-CM-03 | Formal certifications (SOC 2, HIPAA, etc.) are **out of scope** for V1. |
