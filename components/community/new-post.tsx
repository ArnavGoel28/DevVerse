"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCommunity } from "@/components/community/use-community";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { normaliseTags, type PostType, similarQuestions, TYPE_LABEL, validateDraft } from "@/lib/community/model";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const HELP: Record<PostType, string> = {
  question: "Ask something specific. Include what you tried and the exact error.",
  article: "Teach something you learned. Headings and code blocks help.",
  showcase: "Show a project you built. Add a link and what you'd like feedback on.",
  discussion: "Start an open conversation: opinions, advice, comparisons.",
};

// CM-01 + CM-07: write any post type; similar questions appear before posting a question.
export function NewPost({ profile }: { profile: DeveloperProfile }) {
  const router = useRouter();
  const c = useCommunity(profile.githubStats.login);
  const [type, setType] = useState<PostType>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagText, setTagText] = useState("");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(false);
  const [tried, setTried] = useState(false);

  const tags = normaliseTags(tagText);
  const draft = { type, title, body, tags, url: type === "showcase" ? url : undefined };
  const errors = validateDraft(draft);
  const similar = useMemo(() => (type === "question" ? similarQuestions(c.posts, title) : []), [c.posts, title, type]);
  const suggested = profile.skills.slice(0, 8).map((s) => s.id).filter((t) => !tags.includes(t));

  const publish = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const id = c.create(draft);
    toast.success(`${TYPE_LABEL[type]} published`, { description: "It's live in the Community feed." });
    router.push(`/community/${id}`);
  };

  const err = (k: keyof typeof errors) => tried && errors[k] && <p className="mt-1 text-sm text-rose-600">{errors[k]}</p>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/community" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Community</Link>
      <div role="radiogroup" aria-label="Post type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(TYPE_LABEL) as PostType[]).map((t) => (
          <button key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cn("rounded-lg border px-3 py-2 text-sm", type === t ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{HELP[type]}</p>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className="rounded-md border bg-background px-3 py-2 font-normal" placeholder={type === "question" ? "e.g. Why does my fetch return undefined in useEffect?" : "A clear, specific title"} />
        {err("title")}
      </label>

      {similar.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          <p className="mb-1 font-medium">Similar questions already exist. One might answer yours:</p>
          <ul className="list-disc pl-5">{similar.map((p) => <li key={p.id}><Link href={`/community/${p.id}`} className="text-primary hover:underline">{p.title}</Link></li>)}</ul>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-3 text-sm">
          <span className="font-medium">Body</span>
          <button onClick={() => setPreview(false)} className={!preview ? "font-medium" : "text-muted-foreground"}>Write</button>
          <button onClick={() => setPreview(true)} className={preview ? "font-medium" : "text-muted-foreground"}>Preview</button>
        </div>
        {preview ? (
          <div className="min-h-48 rounded-md border p-3"><Markdown>{body || "_Nothing to preview._"}</Markdown></div>
        ) : (
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} aria-label="Body" placeholder="Markdown supported." className="w-full rounded-md border bg-background p-3 font-mono text-sm" />
        )}
        {err("body")}
      </div>

      {type === "showcase" && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Project link (optional)
          <input aria-label="Project link" value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-md border bg-background px-3 py-2 font-normal" placeholder="https://" />
          {err("url")}
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Tags (1–5, comma separated)
        <input aria-label="Tags" value={tagText} onChange={(e) => setTagText(e.target.value)} className="rounded-md border bg-background px-3 py-2 font-normal" placeholder="react, typescript" />
        {err("tags")}
      </label>
      {suggested.length > 0 && (
        <div className="-mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          From your profile:
          {suggested.map((t) => (
            <button key={t} onClick={() => setTagText((v) => normaliseTags(`${v},${t}`).join(", "))} className="rounded-md border px-2 py-0.5 hover:bg-muted">+ {t}</button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={publish}>Publish {TYPE_LABEL[type].toLowerCase()}</Button>
        <Button variant="ghost" asChild><Link href="/community">Cancel</Link></Button>
      </div>
    </div>
  );
}
