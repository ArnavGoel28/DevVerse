"use client";

import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

import { type Post, timeAgo, TYPE_LABEL } from "@/lib/community/model";
import { cn } from "@/lib/utils";

export const TYPE_STYLE: Record<Post["type"], string> = {
  question: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  article: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  showcase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  discussion: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export function TypeBadge({ type }: { type: Post["type"] }) {
  return <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", TYPE_STYLE[type])}>{TYPE_LABEL[type]}</span>;
}

export function Tag({ id, href }: { id: string; href?: string }) {
  const cls = "rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20";
  return href ? <Link href={href} className={cls}>{id}</Link> : <span className={cls}>{id}</span>;
}

export function SampleBadge() {
  return <span className="rounded border border-dashed px-1.5 py-0.5 text-[11px] text-muted-foreground" title="Seeded example content until the Community backend is live">Sample</span>;
}

export function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: `hsl(${hue} 55% 45%)`, width: size * 4, height: size * 4 }} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Stack Overflow-style list row: stats column, title, excerpt, tags, author. */
export function PostRow({ post, now }: { post: Post; now: number }) {
  const answered = post.answers.length > 0;
  const accepted = !!post.acceptedAnswerId;
  const excerpt = post.body.replace(/[#*`>\[\]()_-]/g, "").replace(/\s+/g, " ").slice(0, 160);
  return (
    <li className="flex gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="hidden w-20 shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
        <span className="font-medium text-foreground">{post.score} votes</span>
        <span className={cn("rounded px-1.5", accepted ? "bg-emerald-600 text-white" : answered ? "border border-emerald-600 text-emerald-700 dark:text-emerald-400" : "")}>
          {accepted && <CheckCircle2 className="mr-0.5 inline size-3" />}
          {post.answers.length} {post.type === "question" ? "answers" : "replies"}
        </span>
        <span>{post.views} views</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <TypeBadge type={post.type} />
          {post.sample && <SampleBadge />}
        </div>
        <Link href={`/community/${post.id}`} className="font-medium text-primary hover:underline">{post.title}</Link>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {post.tags.map((t) => <Tag key={t} id={t} href={`/community?tag=${encodeURIComponent(t)}`} />)}
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar name={post.author} size={4} /> {post.author} · {timeAgo(post.createdAt, now)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function VoteColumn({ score, voted, onVote, disabled, label }: { score: number; voted: boolean; onVote: () => void; disabled?: boolean; label: string }) {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-1">
      <button
        onClick={onVote}
        disabled={disabled}
        aria-pressed={voted}
        aria-label={voted ? `Remove your upvote from this ${label}` : `Upvote this ${label}`}
        title={disabled ? "You can't vote on your own post" : undefined}
        className={cn("rounded-full border p-1.5 transition-colors disabled:opacity-40", voted ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
      >
        <ChevronUp className="size-5" />
      </button>
      <span className="text-lg font-semibold">{score}</span>
      <ChevronDown className="size-5 text-muted-foreground/40" aria-hidden />
    </div>
  );
}
