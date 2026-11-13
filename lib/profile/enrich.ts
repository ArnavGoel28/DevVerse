import type { DeveloperProfile, GitHubSnapshot, Recommendation } from "@/lib/types";

// Gemini layer on top of the rules profile (DI-08, DI-09, GH-09).
// Skills and their confidence stay evidence-based (rules) so they are explainable (DI-06);
// Gemini only rewrites the human-facing text: summary, focus areas, insights, struggle explanations, recommendations.
// Any failure or invalid output falls back to the rules profile — the import never breaks because of AI.

export type GenerateJson = (prompt: string, schema: unknown) => Promise<string>;

export const ENRICH_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-3 sentences about this developer, in third person." },
    focusAreas: { type: "array", items: { type: "string" }, maxItems: 3 },
    strengths: { type: "array", items: { type: "string" }, maxItems: 5 },
    gaps: { type: "array", items: { type: "string" }, maxItems: 5 },
    recruiterView: { type: "string" },
    struggleWhy: {
      type: "array",
      items: { type: "object", properties: { topic: { type: "string" }, why: { type: "string" } }, required: ["topic", "why"] },
    },
    recommendations: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["learn", "practice", "contribute", "github"] },
          title: { type: "string" },
          reason: { type: "string" },
        },
        required: ["type", "title", "reason"],
      },
    },
  },
  required: ["summary", "focusAreas", "strengths", "gaps", "recruiterView", "struggleWhy", "recommendations"],
} as const;

type EnrichOutput = {
  summary: string;
  focusAreas: string[];
  strengths: string[];
  gaps: string[];
  recruiterView: string;
  struggleWhy: { topic: string; why: string }[];
  recommendations: { type: Recommendation["type"]; title: string; reason: string }[];
};

/** Compact facts for the prompt — never the GitHub token or private data beyond counts. */
export function buildEnrichPrompt(s: GitHubSnapshot, draft: DeveloperProfile): string {
  const facts = {
    login: s.account.login,
    memberSince: s.account.createdAt,
    followers: s.account.followers,
    level: draft.level,
    totals: draft.githubStats.totals,
    contributionsByYear: s.contributionsByYear,
    topLanguages: draft.githubStats.topLanguages,
    skills: draft.skills.slice(0, 12).map((k) => ({ name: k.name, confidence: k.confidence })),
    repos: s.repos
      .filter((r) => !r.isFork)
      .slice(0, 25)
      .map((r) => ({ name: r.name, lang: r.primaryLanguage, stars: r.stars, topics: r.topics, readme: r.hasReadme, desc: r.description, commits: r.commitCount })),
    externalContributions: s.externalContributions.slice(0, 10),
    struggles: draft.struggles.map((x) => ({ topic: x.topic, evidence: x.why })),
  };
  return [
    "You are DevVerse's profile analyst. You help developers grow a GitHub profile that recruiters value.",
    "Using ONLY the facts below (do not invent projects, numbers or employers), write:",
    "- summary: 2-3 sentences in third person describing this developer's level, focus and standout work.",
    "- focusAreas: up to 3 areas such as Frontend, Backend, Data & AI, Mobile, DevOps & Cloud, Systems.",
    "- strengths and gaps: short bullet phrases a recruiter would notice. Gaps must be fixable actions.",
    "- recruiterView: one honest, encouraging paragraph on how a recruiter would read this GitHub.",
    "- struggleWhy: for each struggle topic given, a one-sentence plain-language explanation citing the evidence. Keep the topic text identical.",
    "- recommendations: up to 5 concrete next actions (learn / practice / contribute / github), most impactful first.",
    "",
    "FACTS (JSON):",
    JSON.stringify(facts),
  ].join("\n");
}

export function parseEnrichOutput(text: string): EnrichOutput | null {
  try {
    const o = JSON.parse(text) as Partial<EnrichOutput>;
    const strArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
    if (typeof o.summary !== "string" || !o.summary.trim()) return null;
    if (typeof o.recruiterView !== "string") return null;
    if (!strArr(o.focusAreas) || !strArr(o.strengths) || !strArr(o.gaps)) return null;
    if (!Array.isArray(o.struggleWhy) || !Array.isArray(o.recommendations)) return null;
    const types = new Set(["learn", "practice", "contribute", "github"]);
    return {
      summary: o.summary.trim(),
      focusAreas: o.focusAreas!.slice(0, 3),
      strengths: o.strengths!.slice(0, 5),
      gaps: o.gaps!.slice(0, 5),
      recruiterView: o.recruiterView,
      struggleWhy: o.struggleWhy.filter((x) => typeof x?.topic === "string" && typeof x?.why === "string"),
      recommendations: o.recommendations
        .filter((r) => r && types.has(r.type) && typeof r.title === "string" && typeof r.reason === "string")
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}

const HREF: Record<Recommendation["type"], string> = {
  learn: "/learn",
  practice: "/practice",
  contribute: "/github",
  github: "/github",
};

export async function enrichProfile(
  s: GitHubSnapshot,
  draft: DeveloperProfile,
  generate: GenerateJson | null,
): Promise<DeveloperProfile> {
  if (!generate) return draft;
  let out: EnrichOutput | null = null;
  try {
    out = parseEnrichOutput(await generate(buildEnrichPrompt(s, draft), ENRICH_SCHEMA));
  } catch (e) {
    console.error("Gemini profile enrichment failed; using rules profile.", e);
  }
  if (!out) return draft;
  const whyByTopic = new Map(out.struggleWhy.map((x) => [x.topic, x.why]));
  return {
    ...draft,
    summary: out.summary,
    focusAreas: out.focusAreas.length ? out.focusAreas : draft.focusAreas,
    struggles: draft.struggles.map((x) => ({ ...x, why: whyByTopic.get(x.topic) ?? x.why })),
    githubInsights: {
      strengths: out.strengths.length ? out.strengths : draft.githubInsights.strengths,
      gaps: out.gaps.length ? out.gaps : draft.githubInsights.gaps,
      recruiterView: out.recruiterView || draft.githubInsights.recruiterView,
    },
    recommendations: out.recommendations.length
      ? out.recommendations.map((r) => ({ ...r, href: HREF[r.type] }))
      : draft.recommendations,
    generatedBy: "gemini",
  };
}
