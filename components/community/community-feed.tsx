"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PenSquare, Search } from "lucide-react";

import { PostRow, Tag } from "@/components/community/parts";
import { useCommunity } from "@/components/community/use-community";
import { Button } from "@/components/ui/button";
import { feed, type FeedTab, type PostType } from "@/lib/community/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "for-you", label: "For you" },
  { id: "newest", label: "Newest" },
  { id: "top", label: "Top" },
  { id: "unanswered", label: "Unanswered" },
];
const TYPES: { id?: PostType; label: string }[] = [
  { label: "All posts" },
  { id: "question", label: "Questions" },
  { id: "article", label: "Articles" },
  { id: "showcase", label: "Showcases" },
  { id: "discussion", label: "Discussions" },
];

// CM-01/02/04/07/08: one feed for four post types, ranked for you (Stack Overflow list + dev.to tabs).
export function CommunityFeed({ profile }: { profile: DeveloperProfile }) {
  const me = profile.githubStats.login;
  const { posts, saved } = useCommunity(me);
  const params = useSearchParams();
  const tag = params.get("tag") ?? undefined;
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [type, setType] = useState<PostType | undefined>();
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());

  const list = useMemo(() => feed(posts, tab, profile, { type, tag, query }, now), [posts, tab, profile, type, tag, query, now]);
  const yourTags = profile.skills.filter((s) => s.userFeedback !== "hidden").slice(0, 8).map((s) => s.id);
  const unansweredForYou = feed(posts, "unanswered", profile, {}, now).filter((p) => p.tags.some((t) => yourTags.includes(t))).slice(0, 4);

  return (
    <div className="grid gap-6 lg:grid-cols-[170px_1fr] xl:grid-cols-[170px_1fr_260px]">
      <nav aria-label="Post types" className="flex gap-1 overflow-x-auto lg:flex-col">
        {TYPES.map((t) => (
          <button key={t.label} onClick={() => setType(t.id)} className={cn("shrink-0 rounded-md px-3 py-1.5 text-left text-sm", type === t.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted")}>
            {t.label}
          </button>
        ))}
        <p className="mt-4 hidden px-3 text-xs font-semibold uppercase text-muted-foreground lg:block">Your tags</p>
        <div className="hidden flex-wrap gap-1.5 px-3 lg:flex">
          {yourTags.map((t) => <Tag key={t} id={t} href={`/community?tag=${t}`} />)}
        </div>
      </nav>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" aria-label="Search posts" className="w-full rounded-md border bg-background py-2 pr-3 pl-8 text-sm" />
          </div>
          <Button asChild>
            <Link href="/community/new"><PenSquare /> Ask or write</Link>
          </Button>
        </div>
        <div className="mb-2 flex items-center gap-1 border-b" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === t.id ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
          {tag && (
            <Link href="/community" className="ml-auto text-xs text-muted-foreground hover:underline">
              Tagged <b>{tag}</b> · clear
            </Link>
          )}
        </div>
        {!saved && <p className="mb-2 text-xs text-amber-600">Your browser blocked storage, so changes last only for this visit.</p>}
        {list.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
            Nothing here yet. {tab === "unanswered" ? "Every question has an answer. " : ""}
            <Link href="/community/new" className="text-primary hover:underline">Start the first post</Link>.
          </div>
        ) : (
          <ul className="rounded-xl border bg-card">{list.map((p) => <PostRow key={p.id} post={p} now={now} />)}</ul>
        )}
      </section>

      <aside className="grid gap-4 sm:grid-cols-2 lg:col-span-2 xl:col-span-1 xl:flex xl:flex-col">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Questions you can answer</h2>
          {unansweredForYou.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {unansweredForYou.map((p) => (
                <li key={p.id}><Link href={`/community/${p.id}`} className="text-primary hover:underline">{p.title}</Link></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No open questions match your skills right now.</p>
          )}
        </div>
        {profile.struggles.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Your struggles</h2>
            <p className="mb-2 text-xs text-muted-foreground">The &quot;For you&quot; tab boosts posts about these.</p>
            <ul className="flex flex-col gap-1 text-sm">{profile.struggles.slice(0, 4).map((s) => <li key={s.topic}>• {s.topic}</li>)}</ul>
          </div>
        )}
      </aside>
    </div>
  );
}
