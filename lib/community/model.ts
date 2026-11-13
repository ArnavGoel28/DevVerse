// CM-01…CM-08: one content model for questions, articles, showcases and discussions (D-04).
// Pure logic, shared by the UI now and the server later (docs/10-backend-plan.md).
import type { DeveloperProfile } from "@/lib/types";

export type PostType = "question" | "article" | "showcase" | "discussion";

export type Answer = { id: string; body: string; author: string; score: number; createdAt: string };

export type Post = {
  id: string;
  type: PostType;
  title: string;
  body: string; // markdown
  tags: string[]; // skill ids
  url?: string; // showcase link
  author: string;
  score: number;
  views: number;
  answers: Answer[];
  acceptedAnswerId?: string;
  createdAt: string;
  sample?: boolean; // seeded content, shown with a "Sample" badge until the backend is live
};

export const TYPE_LABEL: Record<PostType, string> = { question: "Question", article: "Article", showcase: "Showcase", discussion: "Discussion" };

export type FeedTab = "for-you" | "newest" | "top" | "unanswered";

const HOUR = 3_600_000;

/** CM-08: rank by overlap with your skills and struggles, then votes and freshness. */
export function forYouScore(post: Post, profile: Pick<DeveloperProfile, "skills" | "struggles">, now = Date.now()): number {
  const conf = new Map(profile.skills.filter((s) => s.userFeedback !== "wrong" && s.userFeedback !== "hidden").map((s) => [s.id, s.confidence]));
  const tagScore = post.tags.reduce((sum, t) => sum + (conf.has(t) ? 1 + (conf.get(t) ?? 0) : 0), 0);
  const text = `${post.title} ${post.tags.join(" ")}`.toLowerCase();
  const struggleHit = profile.struggles.some((s) => s.topic.toLowerCase().split(/\W+/).some((w) => w.length > 3 && text.includes(w)));
  const ageHours = Math.max(0, (now - Date.parse(post.createdAt)) / HOUR);
  return tagScore * 3 + (struggleHit ? 4 : 0) + Math.log2(Math.max(post.score, 0) + 1) + 2 / (1 + ageHours / 24);
}

export function feed(posts: Post[], tab: FeedTab, profile: Pick<DeveloperProfile, "skills" | "struggles">, filter: { type?: PostType; tag?: string; query?: string } = {}, now = Date.now()): Post[] {
  const q = filter.query?.trim().toLowerCase();
  const list = posts.filter(
    (p) =>
      (!filter.type || p.type === filter.type) &&
      (!filter.tag || p.tags.includes(filter.tag)) &&
      (!q || `${p.title} ${p.body} ${p.tags.join(" ")}`.toLowerCase().includes(q)) &&
      (tab !== "unanswered" || (p.type === "question" && p.answers.length === 0)),
  );
  const byNew = (a: Post, b: Post) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (tab === "newest" || tab === "unanswered") return list.sort(byNew);
  if (tab === "top") return list.sort((a, b) => b.score - a.score || byNew(a, b));
  return list.map((p) => ({ p, s: forYouScore(p, profile, now) })).sort((a, b) => b.s - a.s || byNew(a.p, b.p)).map((x) => x.p);
}

const STOP = new Set(["the", "a", "an", "to", "in", "of", "and", "or", "is", "how", "do", "i", "my", "for", "with", "on", "what", "why", "when", "can", "it", "does"]);
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9+#.]+/).filter((w) => w.length > 1 && !STOP.has(w)));

/** CM-07: similar existing questions while writing (Jaccard on title words; embeddings later, D-23). */
export function similarQuestions(posts: Post[], title: string, limit = 3): Post[] {
  const a = words(title);
  if (a.size < 2) return [];
  return posts
    .filter((p) => p.type === "question")
    .map((p) => {
      const b = words(p.title);
      const inter = [...a].filter((w) => b.has(w)).length;
      return { p, j: inter / (a.size + b.size - inter) };
    })
    .filter((x) => x.j >= 0.25)
    .sort((x, y) => y.j - x.j)
    .slice(0, limit)
    .map((x) => x.p);
}

export type PostDraft = { type: PostType; title: string; body: string; tags: string[]; url?: string };

export function validateDraft(d: PostDraft): Partial<Record<"title" | "body" | "tags" | "url", string>> {
  const e: Partial<Record<"title" | "body" | "tags" | "url", string>> = {};
  const title = d.title.trim();
  if (title.length < 10 || title.length > 150) e.title = "Title must be 10–150 characters.";
  if (d.body.trim().length < 20) e.body = "Add a bit more detail (20+ characters).";
  if (d.tags.length < 1 || d.tags.length > 5) e.tags = "Pick 1–5 tags.";
  if (d.type === "showcase" && d.url && !/^https:\/\/\S+$/.test(d.url)) e.url = "Use a full https:// link.";
  return e;
}

export function normaliseTags(input: string): string[] {
  return [...new Set(input.split(/[,\s]+/).map((t) => t.trim().toLowerCase().replace(/[^a-z0-9+#.-]/g, "")).filter(Boolean))].slice(0, 5);
}

/** Toggle a vote; returns the new score delta and vote state (one vote per user per item, CM-04). */
export function toggleVote(voted: boolean): { delta: 1 | -1; voted: boolean } {
  return voted ? { delta: -1, voted: false } : { delta: 1, voted: true };
}

export function timeAgo(iso: string, now = Date.now()): string {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 220));
}
