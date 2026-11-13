"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Heart } from "lucide-react";
import { toast } from "sonner";

import { Avatar, SampleBadge, Tag, TypeBadge, VoteColumn } from "@/components/community/parts";
import { useCommunity } from "@/components/community/use-community";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { type Post, readingMinutes, timeAgo } from "@/lib/community/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

// CM-02/04/05: a post page. Questions & discussions use the Q&A layout (vote column, accepted answer);
// articles and showcases use a reading layout (Medium-style), with responses below.
export function PostView({ id, profile }: { id: string; profile: DeveloperProfile }) {
  const me = profile.githubStats.login;
  const c = useCommunity(me);
  const post = c.posts.find((p) => p.id === id);
  const [now] = useState(() => Date.now());
  const counted = useRef(false);

  useEffect(() => {
    if (post && !counted.current) {
      counted.current = true;
      c.view(post.id);
    }
  }, [post, c]);

  if (!post)
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="mb-3 font-medium">This post doesn&apos;t exist or was removed.</p>
        <Link href="/community" className="text-primary hover:underline">Back to Community</Link>
      </div>
    );

  const reading = post.type === "article" || post.type === "showcase";
  const answers = [...post.answers].sort((a, b) => (b.id === post.acceptedAnswerId ? 1 : 0) - (a.id === post.acceptedAnswerId ? 1 : 0) || b.score - a.score);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/community" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Community</Link>

      {reading ? (
        <article className="mx-auto w-full max-w-2xl">
          <div className="mb-3 flex items-center gap-2"><TypeBadge type={post.type} />{post.sample && <SampleBadge />}</div>
          <h1 className="mb-4 font-serif text-3xl leading-tight font-bold sm:text-4xl">{post.title}</h1>
          <div className="mb-6 flex items-center gap-3 border-y py-3 text-sm text-muted-foreground">
            <Avatar name={post.author} size={8} />
            <span className="font-medium text-foreground">{post.author}</span>· {readingMinutes(post.body)} min read · {timeAgo(post.createdAt, now)}
            <button onClick={() => c.vote(post.id)} disabled={post.author === me} aria-pressed={!!c.votes[post.id]} className={cn("ml-auto flex items-center gap-1 rounded-full px-2 py-1 disabled:opacity-40", c.votes[post.id] ? "text-rose-600" : "hover:text-foreground")}>
              <Heart className={cn("size-4", c.votes[post.id] && "fill-current")} /> {post.score}
            </button>
          </div>
          {post.url && (
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Open the project <ExternalLink className="size-3.5" />
            </a>
          )}
          <div className="text-[17px] leading-8"><Markdown>{post.body}</Markdown></div>
          <div className="mt-6 flex flex-wrap gap-1.5">{post.tags.map((t) => <Tag key={t} id={t} href={`/community?tag=${t}`} />)}</div>
        </article>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-2"><TypeBadge type={post.type} />{post.sample && <SampleBadge />}</div>
          <h1 className="mb-2 text-2xl font-semibold">{post.title}</h1>
          <p className="mb-4 border-b pb-3 text-xs text-muted-foreground">Asked {timeAgo(post.createdAt, now)} · Viewed {post.views} times</p>
          <div className="flex gap-4">
            <VoteColumn score={post.score} voted={!!c.votes[post.id]} onVote={() => c.vote(post.id)} disabled={post.author === me} label="post" />
            <div className="min-w-0 flex-1">
              <Markdown>{post.body}</Markdown>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {post.tags.map((t) => <Tag key={t} id={t} href={`/community?tag=${t}`} />)}
                <span className="ml-auto flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-1 text-xs"><Avatar name={post.author} size={5} /> {post.author}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className={cn(reading && "mx-auto w-full max-w-2xl")}>
        <h2 className="mb-3 border-b pb-2 text-lg font-semibold">
          {post.answers.length} {post.type === "question" ? (post.answers.length === 1 ? "Answer" : "Answers") : post.answers.length === 1 ? "Response" : "Responses"}
        </h2>
        <ul className="flex flex-col">
          {answers.map((a) => {
            const accepted = a.id === post.acceptedAnswerId;
            const key = `${post.id}:${a.id}`;
            return (
              <li key={a.id} className={cn("flex gap-4 border-b py-4", accepted && "rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 dark:bg-emerald-950/20")}>
                <div className="flex flex-col items-center gap-2">
                  <VoteColumn score={a.score} voted={!!c.votes[key]} onVote={() => c.vote(post.id, a.id)} disabled={a.author === me} label="answer" />
                  {post.type === "question" && (post.author === me ? (
                    <button onClick={() => c.accept(post.id, a.id)} aria-label={accepted ? "Unaccept this answer" : "Accept this answer"} title={accepted ? "Unaccept" : "Accept as the solution"} className={accepted ? "text-emerald-600" : "text-muted-foreground hover:text-emerald-600"}>
                      <CheckCircle2 className="size-7" />
                    </button>
                  ) : accepted && <CheckCircle2 className="size-7 text-emerald-600" aria-label="Accepted answer" />)}
                </div>
                <div className="min-w-0 flex-1">
                  <Markdown>{a.body}</Markdown>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Avatar name={a.author} size={4} /> {a.author} · {timeAgo(a.createdAt, now)}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <AnswerForm onSubmit={(body) => c.answer(post.id, body)} label={post.type === "question" ? "Your answer" : "Your response"} />
      </section>
    </div>
  );
}

function AnswerForm({ onSubmit, label }: { onSubmit: (body: string) => void; label: string }) {
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (body.trim().length < 15) return setError("Write at least 15 characters.");
    onSubmit(body);
    toast.success("Posted", { description: "Thanks for helping the community." });
    setBody("");
    setError(null);
    setPreview(false);
  };
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-3">
        <h3 className="font-semibold">{label}</h3>
        <button className={cn("text-sm", !preview ? "font-medium" : "text-muted-foreground")} onClick={() => setPreview(false)}>Write</button>
        <button className={cn("text-sm", preview ? "font-medium" : "text-muted-foreground")} onClick={() => setPreview(true)}>Preview</button>
      </div>
      {preview ? (
        <div className="min-h-32 rounded-md border p-3"><Markdown>{body || "_Nothing to preview._"}</Markdown></div>
      ) : (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} aria-label={label} placeholder="Markdown supported. Use ``` for code." className="w-full rounded-md border bg-background p-3 font-mono text-sm" />
      )}
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
      <Button className="mt-2" onClick={submit}>Post {label.toLowerCase().replace("your ", "")}</Button>
    </div>
  );
}

export type { Post };
