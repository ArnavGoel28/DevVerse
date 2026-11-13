import type { DeveloperProfile } from "@/lib/types";

// AI mentor logic (AI-01, AI-03, AI-07, AI-09). Pure functions — the route does the I/O.

export type Turn = { role: "user" | "model"; text: string };

export const MAX_TURNS = 20;
export const MAX_TURN_CHARS = 4000;

/** Validates chat history from the browser. Returns null if it is not acceptable. */
export function sanitizeTurns(input: unknown): Turn[] | null {
  if (!Array.isArray(input) || !input.length) return null;
  const turns: Turn[] = [];
  for (const t of input.slice(-MAX_TURNS)) {
    const o = t as Turn;
    if ((o?.role !== "user" && o?.role !== "model") || typeof o.text !== "string") return null;
    const text = o.text.trim().slice(0, MAX_TURN_CHARS);
    if (text) turns.push({ role: o.role, text });
  }
  // Gemini expects the conversation to start with the user and end with the user's question.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

/** DI-08: the profile summary every AI feature is given as context. */
export function profileContext(p: DeveloperProfile): string {
  const skills = p.skills
    .filter((s) => s.userFeedback !== "wrong" && s.userFeedback !== "hidden")
    .slice(0, 12)
    .map((s) => `${s.name} (${Math.round(s.confidence * 100)}%${s.userFeedback === "confirmed" ? ", confirmed" : ""})`);
  const wrong = p.skills.filter((s) => s.userFeedback === "wrong").map((s) => s.name);
  const t = p.githubStats.totals;
  return [
    `GitHub user: @${p.githubStats.login}. Level: ${p.level}. Focus: ${p.focusAreas.join(", ") || "unknown"}.`,
    `Summary: ${p.summary}`,
    `Skills (confidence from evidence): ${skills.join(", ") || "none yet"}.`,
    wrong.length ? `The user says they do NOT know: ${wrong.join(", ")}.` : "",
    `Struggles: ${p.struggles.map((s) => `${s.topic} (severity ${Math.round(s.severity * 100)}%, ${s.trend}): ${s.why}`).join(" | ") || "none detected"}`,
    `GitHub: ${t.repos} repos, ${t.stars} stars, ${t.pullRequests} PRs, ${t.mergedExternalPRs} merged open-source PRs.`,
    `Gaps a recruiter would notice: ${p.githubInsights.gaps.join(" | ") || "none"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMentorSystem(p: DeveloperProfile, teachMode: boolean): string {
  return [
    "You are the DevVerse mentor: a friendly senior developer who knows this user's real history.",
    "Use the profile below to personalise every answer (AI-07). When it is relevant, say which part of their",
    "history you are using (e.g. 'your notes-api repo', 'your failing CI runs'). Never invent repos or numbers.",
    `Explain at a ${p.level} level: ${p.level === "beginner" ? "plain words, define jargon, small steps" : p.level === "intermediate" ? "practical, show the why" : "concise and technical"}.`,
    "Use short Markdown: headings only if needed, bullet lists, fenced code blocks with a language.",
    "When useful, point to DevVerse pages: Learn (/learn) for roadmaps, Practice (/practice) for problems,",
    "Grow your GitHub (/github) for GitHub improvements and open-source issues.",
    "Never ask for or reveal passwords, tokens or API keys.",
    teachMode
      ? "TEACH MODE (AI-09): do NOT give the full answer or full code. Guide with hints and one or two questions so the user works it out."
      : "",
    "",
    "USER PROFILE:",
    profileContext(p),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** Skill ids from the profile that the question mentions (for ai_help evidence, DI-02). */
export function detectSkills(question: string, p: DeveloperProfile): string[] {
  const q = ` ${question.toLowerCase()} `;
  return p.skills
    .filter((s) => {
      const name = s.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${name}([^a-z0-9]|$)`).test(q);
    })
    .map((s) => s.id)
    .slice(0, 5);
}

/**
 * NFR-AV-03: when Gemini is unavailable (no key, outage, daily cap), still answer from the profile.
 * Simple intent matching — clearly labelled as an offline answer.
 */
export function offlineAnswer(p: DeveloperProfile, question: string): string {
  const q = question.toLowerCase();
  const note = "\n\n_Offline answer from your profile. The AI mentor is not available right now._";
  const recs = p.recommendations.map((r) => `- **${r.title}**: ${r.reason}`).join("\n");
  const top = p.struggles[0];

  if (/fail|error|broken|ci\b|build|deploy|crash/.test(q)) {
    const ci = p.struggles.find((s) => /ci|build|deploy/i.test(s.topic));
    return (
      (ci
        ? `### ${ci.topic}\n${ci.why}\n\nStart with the first failing step in the log, reproduce it locally, and check for missing environment variables or dependencies.`
        : "I can't see failing builds or deploys in your history yet. Paste the error message and I'll help once the AI is back.") +
      "\n\nSee [Learn](/learn) for a focused learning pack." +
      note
    );
  }
  if (/recruit|stand out|portfolio|github|hire|job|intern/.test(q)) {
    return (
      `### How recruiters see your GitHub\n${p.githubInsights.recruiterView}\n\n**Strengths**\n` +
      p.githubInsights.strengths.map((s) => `- ${s}`).join("\n") +
      (p.githubInsights.gaps.length ? `\n\n**Fix first**\n${p.githubInsights.gaps.map((g) => `- ${g}`).join("\n")}` : "") +
      note
    );
  }
  if (/struggl|weak|improve|bad at|problem/.test(q)) {
    return (
      (p.struggles.length
        ? `### Your recurring struggles\n${p.struggles.map((s) => `- **${s.topic}** (${s.trend}): ${s.why}`).join("\n")}`
        : "No recurring struggles stand out in your history right now.") + note
    );
  }
  if (/learn|next|roadmap|study|should i/.test(q)) {
    return (
      `### What to do next\n${recs || "- Keep building and pushing projects to GitHub."}` +
      (top ? `\n\nYour biggest gap is **${top.topic.toLowerCase()}**. There's a learning pack for it on [Learn](/learn).` : "") +
      note
    );
  }
  const skills = p.skills.slice(0, 5).map((s) => `${s.name} (${Math.round(s.confidence * 100)}%)`).join(", ");
  return `### Here's what I know about you\n${p.summary}\n\nTop skills: ${skills || "none yet"}.\n\nTry asking: *"What should I learn next?"* or *"How do recruiters see my GitHub?"*${note}`;
}

export const SUGGESTED_QUESTIONS = [
  "What should I learn next?",
  "How do recruiters see my GitHub?",
  "Explain my biggest struggle and how to fix it",
  "Suggest a project that would level me up",
];
