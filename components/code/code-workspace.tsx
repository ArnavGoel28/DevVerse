"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { ChevronDown, ChevronRight, File, FolderGit2, GitBranch, Loader2, X } from "@/components/icons";

import { type ApiAuth, apiJson } from "@/components/api";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { buildTree, fetchFile, fetchRepoTree, isPreviewable, languageOf, parseRepo, type RepoRef, type TreeNode } from "@/lib/code/repo";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type OpenFile = { path: string; content: string | null; error?: string; size: number };
type Explain = { status: "idle" | "loading" | "done" | "error"; text?: string; mode?: string; scope?: string };

// WS-01 + AI-03: VS Code-style explorer / tabs / editor with the Code Reviewer agent. Read-only toward GitHub.
export function CodeWorkspace({ auth, profile }: { auth: ApiAuth; profile: DeveloperProfile }) {
  const suggestions = profile.githubStats.topRepos.slice(0, 6).map((r) => `${r.owner}/${r.name}`);
  const [input, setInput] = useState(suggestions[0] ?? "");
  const [ref, setRef] = useState<RepoRef | null>(null);
  const [branch, setBranch] = useState("");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<OpenFile[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [explain, setExplain] = useState<Explain>({ status: "idle" });
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const openRepo = async (value = input) => {
    const parsed = parseRepo(value);
    if (!parsed) return setError("Enter a repository like owner/name or a github.com link.");
    setLoading(true);
    setError(null);
    try {
      const t = await fetchRepoTree(parsed);
      setRef(parsed);
      setBranch(t.branch);
      setTree(buildTree(t.files));
      setTruncated(t.truncated);
      setTabs([]);
      setActive(null);
      setOpen(new Set());
      setExplain({ status: "idle" });
      const readme = t.files.find((f) => /^readme\.md$/i.test(f.path));
      if (readme) void openFile(parsed, t.branch, readme.path, readme.size);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open the repository.");
    }
    setLoading(false);
  };

  const openFile = async (r: RepoRef, b: string, path: string, size: number) => {
    setActive(path);
    setExplain({ status: "idle" });
    if (tabs.some((t) => t.path === path)) return;
    if (!isPreviewable(path, size)) {
      setTabs((t) => [...t, { path, size, content: null, error: "Preview not available for binary or very large files." }]);
      return;
    }
    setTabs((t) => [...t, { path, size, content: null }]);
    try {
      const content = await fetchFile(r, b, path);
      setTabs((t) => t.map((x) => (x.path === path ? { ...x, content } : x)));
    } catch (e) {
      setTabs((t) => t.map((x) => (x.path === path ? { ...x, error: e instanceof Error ? e.message : "Couldn't load the file." } : x)));
    }
  };

  const closeTab = (path: string) => {
    setTabs((t) => {
      const next = t.filter((x) => x.path !== path);
      if (active === path) setActive(next.at(-1)?.path ?? null);
      return next;
    });
  };

  const current = tabs.find((t) => t.path === active);

  const runExplain = async () => {
    if (!current?.content) return;
    const ed = editorRef.current;
    const sel = ed?.getSelection();
    const selected = sel && !sel.isEmpty() ? ed!.getModel()?.getValueInRange(sel) ?? "" : "";
    const code = selected.trim() ? selected : current.content;
    setExplain({ status: "loading", scope: selected.trim() ? `lines ${sel!.startLineNumber}–${sel!.endLineNumber}` : "whole file" });
    try {
      const r = await apiJson<{ text: string; mode: string }>("/api/code/explain", auth, { body: { path: current.path, code } });
      setExplain((e) => ({ ...e, status: "done", text: r.text, mode: r.mode }));
    } catch (err) {
      setExplain({ status: "error", text: err instanceof Error ? err.message : "Couldn't explain this code." });
    }
  };

  if (!ref)
    return (
      <div className="mx-auto w-full max-w-xl rounded-md border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><FolderGit2 className="size-5" /> Open a Repository</h2>
        <p className="mb-4 text-sm text-muted-foreground">Read any public GitHub repo in a VS Code-style editor and ask the Code Reviewer to explain code at your level. Nothing is ever pushed.</p>
        <form onSubmit={(e) => { e.preventDefault(); void openRepo(); }} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Repository" name="repo" autoComplete="off" spellCheck={false} placeholder="owner/repo, e.g. vercel/next.js…" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
          <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Open</Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            <span className="text-muted-foreground">Your repos:</span>
            {suggestions.map((s) => <button key={s} onClick={() => { setInput(s); void openRepo(s); }} className="rounded-md border px-2 py-0.5 hover:bg-muted">{s}</button>)}
          </div>
        )}
      </div>
    );

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm">
        <FolderGit2 className="size-4" />
        <span className="font-medium">{ref.owner}/{ref.repo}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><GitBranch className="size-3" /> {branch}</span>
        <button onClick={() => setRef(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Open Another Repo</button>
      </div>
      <div className="grid grid-cols-1 grid-rows-[180px_440px_auto] sm:grid-cols-[200px_1fr] sm:grid-rows-[560px_auto] xl:grid-cols-[240px_1fr_320px] xl:grid-rows-[620px]">
        <nav aria-label="Explorer" className="overflow-auto border-b bg-muted/30 sm:border-r sm:border-b-0 py-2 text-[13px]">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Explorer</p>
          <TreeList nodes={tree} depth={0} open={open} active={active} onToggle={(p) => setOpen((o) => { const n = new Set(o); if (n.has(p)) n.delete(p); else n.add(p); return n; })} onOpen={(n) => void openFile(ref, branch, n.path, n.size ?? 0)} />
          {truncated && <p className="px-3 pt-2 text-xs text-muted-foreground">Large repo: showing the first 2,000 files.</p>}
        </nav>

        <section className="flex min-w-0 flex-col">
          <div className="flex overflow-x-auto border-b bg-muted/30" role="tablist">
            {tabs.map((t) => (
              <div key={t.path} className={cn("flex shrink-0 items-center gap-1 border-r px-3 py-1.5 text-xs", t.path === active ? "bg-background font-medium" : "text-muted-foreground")}>
                <button role="tab" aria-selected={t.path === active} onClick={() => { setActive(t.path); setExplain({ status: "idle" }); }}>{t.path.split("/").pop()}</button>
                <button onClick={() => closeTab(t.path)} aria-label={`Close ${t.path}`} className="rounded p-0.5 hover:bg-muted"><X className="size-3" /></button>
              </div>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {!current ? (
              <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">Pick a file in the explorer.</div>
            ) : current.error ? (
              <div className="p-6 text-sm text-muted-foreground">{current.error}</div>
            ) : current.content === null ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading {current.path}…</div>
            ) : (
              <Editor
                key={current.path}
                path={current.path}
                height="100%"
                language={languageOf(current.path)}
                defaultValue={current.content}
                onMount={(ed) => (editorRef.current = ed)}
                options={{ readOnly: true, minimap: { enabled: true }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 border-t bg-primary px-3 py-0.5 text-[11px] text-primary-foreground">
            <span className="flex items-center gap-1"><GitBranch className="size-3" /> {branch}</span>
            {current?.content && <span>{current.content.split("\n").length} lines</span>}
            {current && <span className="ml-auto">{languageOf(current.path)}</span>}
            <span>Read-only</span>
          </div>
        </section>

        <aside className="flex flex-col overflow-auto border-t p-4 sm:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">Code Reviewer</h2>
          <p className="mb-3 text-xs text-muted-foreground">Select code in the editor (or nothing for the whole file), then explain it at your {profile.level} level.</p>
          <Button onClick={runExplain} disabled={!current?.content || explain.status === "loading"}>
            {explain.status === "loading" ? <Loader2 className="animate-spin" /> : null} Explain Code
          </Button>
          {explain.status !== "idle" && explain.scope && <p className="mt-3 text-xs text-muted-foreground">Explaining {explain.scope} of {current?.path.split("/").pop()}</p>}
          {explain.status === "done" && (
            <div className="mt-2 text-sm">
              <Markdown>{explain.text ?? ""}</Markdown>
              {explain.mode === "limit" && <p className="mt-2 text-xs text-muted-foreground">(daily AI limit reached)</p>}
            </div>
          )}
          {explain.status === "error" && <p className="mt-2 text-sm text-destructive">{explain.text}</p>}
        </aside>
      </div>
    </div>
  );
}

function TreeList({ nodes, depth, open, active, onToggle, onOpen }: { nodes: TreeNode[]; depth: number; open: Set<string>; active: string | null; onToggle: (p: string) => void; onOpen: (n: TreeNode) => void }) {
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.path}>
          <button
            onClick={() => (n.type === "dir" ? onToggle(n.path) : onOpen(n))}
            className={cn("flex w-full items-center gap-1 truncate py-0.5 pr-2 text-left hover:bg-muted", n.path === active && "bg-primary/10 text-primary")}
            style={{ paddingLeft: 8 + depth * 12 }}
            aria-expanded={n.type === "dir" ? open.has(n.path) : undefined}
          >
            {n.type === "dir" ? (open.has(n.path) ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />) : <File className="ml-[2px] size-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{n.name}</span>
          </button>
          {n.type === "dir" && open.has(n.path) && n.children && <TreeList nodes={n.children} depth={depth + 1} open={open} active={active} onToggle={onToggle} onOpen={onOpen} />}
        </li>
      ))}
    </ul>
  );
}
