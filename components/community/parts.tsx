"use client";

import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp } from "@/components/icons";

import { type Post, timeAgo, TYPE_LABEL } from "@/lib/community/model";
import { cn } from "@/lib/utils";

export const TYPE_STYLE: Record<Post["type"], string> = {
  question: "border-foreground/30 text-foreground",
  article: "border-foreground/30 text-foreground",
  showcase: "border-primary/50 text-primary",
  discussion: "border-foreground/30 text-muted-foreground",
};

export function TypeBadge({ type }: { type: Post["type"] }) {
  return <span className={cn("rounded-sm border px-1.5 py-px font-mono text-[10px] tracking-wide uppercase", TYPE_STYLE[type])}>{TYPE_LABEL[type]}</span>;
}

export function Tag({ id, href }: { id: string; href?: string }) {
  const cls = "rounded-sm border border-border bg-secondary px-1.5 py-px font-mono text-[11px] text-secondary-foreground hover:border-primary/50 hover:text-primary";
  return href ? <Link href={href} className={cls}>{id}</Link> : <span className={cls}>{id}</span>;
}

export function SampleBadge() {
  return <span className="rounded border border-dashed px-1.5 py-0.5 text-[11px] text-muted-foreground" title="Seeded example content until the Community backend is live">Sample</span>;
}

export function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground ring-1 ring-border" style={{ width: size * 4, height: size * 4 }} aria-hidden>
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
        <span className={cn("rounded px-1.5", accepted ? "bg-success text-primary-foreground" : answered ? "border border-success/40 text-success" : "")}>
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
        className={cn("rounded-md border p-1.5 transition-colors disabled:opacity-40", voted ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
      >
        <ChevronUp className="size-5" />
      </button>
      <span className="text-lg font-semibold">{score}</span>
      <ChevronDown className="size-5 text-muted-foreground/40" aria-hidden />
    </div>
  );
}
