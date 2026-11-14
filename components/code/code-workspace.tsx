"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

import { type ApiAuth, apiJson } from "@/components/api";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileCss,
  FileHtml,
  FileJs,
  FileMd,
  FileTs,
  FileTsx,
  Files,
  Folder,
  FolderOpen,
  GitBranch,
  Loader2,
  X,
} from "@/components/icons";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { buildTree, fetchFile, fetchRepoTree, isPreviewable, languageOf, parseRepo, type RepoRef, type TreeNode } from "@/lib/code/repo";
import type { DeveloperProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type OpenFile = { path: string; content: string | null; error?: string; size: number };
type Explain = { status: "idle" | "loading" | "done" | "error"; text?: string; mode?: string; scope?: string };

/** D-33: file-type icons as in VS Code's explorer, in one colour. */
function FileTypeIcon({ path, className }: { path: string; className?: string }) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const Icon =
    ext === "ts" ? FileTs : ext === "tsx" ? FileTsx : ["js", "mjs", "cjs", "jsx"].includes(ext) ? FileJs : ext === "css" || ext === "scss" ? FileCss
    : ext === "html" ? FileHtml : ext === "md" || ext === "mdx" ? FileMd : ["py", "go", "rs", "java", "rb", "php", "c", "cpp", "json", "yml", "yaml", "sh"].includes(ext) ? FileCode : File;
  return <Icon className={className} />;
}

// WS-01 + AI-03: VS Code layout (activity bar, explorer, tabs, breadcrumbs, editor, status bar) with the Code Reviewer
// agent as the secondary side bar. Read-only toward GitHub.
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
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  // Client-only render (ProfileGate), so the window width is known: show the reviewer by default on wide screens only.
  const [showExplorer, setShowExplorer] = useState(true);
  const [showReviewer, setShowReviewer] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1280);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  // Below 1280 px the two side bars take turns, so the editor never gets squeezed.
  const narrow = () => typeof window !== "undefined" && window.innerWidth < 1280;
  const toggleExplorer = () => {
    if (!showExplorer && narrow()) setShowReviewer(false);
    setShowExplorer((v) => !v);
  };
  const openReviewer = (open: boolean) => {
    if (open && narrow()) setShowExplorer(false);
    setShowReviewer(open);
  };

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
      setError(e instanceof Error ? e.message : "Couldn't open the repository. Check the name and try again.");
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
    openReviewer(true);
    const ed = editorRef.current;
    const sel = ed?.getSelection();
    const selected = sel && !sel.isEmpty() ? ed!.getModel()?.getValueInRange(sel) ?? "" : "";
    const code = selected.trim() ? selected : current.content;
    setExplain({ status: "loading", scope: selected.trim() ? `lines ${sel!.startLineNumber}–${sel!.endLineNumber}` : "the whole file" });
    try {
      const r = await apiJson<{ text: string; mode: string }>("/api/code/explain", auth, { body: { path: current.path, code } });
      setExplain((e) => ({ ...e, status: "done", text: r.text, mode: r.mode }));
    } catch (err) {
      setExplain({ status: "error", text: err instanceof Error ? `${err.message} Try again in a moment.` : "Couldn't explain this code. Try again in a moment." });
    }
  };

  if (!ref)
    return (
      <div className="mx-auto w-full max-w-xl rounded-md border bg-card p-6">
        <h2 className="mb-1 font-semibold">Open a Repository</h2>
        <p className="mb-4 text-sm text-muted-foreground">Read any public GitHub repo in a VS Code-style editor and ask the Code Reviewer to explain code at your level. Nothing is ever pushed.</p>
        <form onSubmit={(e) => { e.preventDefault(); void openRepo(); }} className="flex gap-2">
          <label htmlFor="code-repo" className="sr-only">Repository</label>
          <input id="code-repo" value={input} onChange={(e) => setInput(e.target.value)} name="repo" autoComplete="off" spellCheck={false} placeholder="owner/repo, e.g. vercel/next.js…" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} {loading ? "Opening…" : "Open"}</Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Your repos:</span>
            {suggestions.map((s) => <button type="button" key={s} onClick={() => { setInput(s); void openRepo(s); }} className="rounded-sm border px-2 py-0.5 font-mono hover:border-primary/50 hover:text-primary">{s}</button>)}
          </div>
        )}
      </div>
    );

  const crumbs = current?.path.split("/") ?? [];

  return (
    <div className="flex flex-col overflow-hidden rounded-md border bg-card sm:h-[calc(100dvh-15rem)] sm:min-h-[560px]">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs">
        <span className="truncate font-medium" translate="no">{ref.owner}/{ref.repo}</span>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground"><GitBranch className="size-3" /> <span translate="no">{branch}</span></span>
        <button type="button" onClick={() => setRef(null)} className="ml-auto shrink-0 rounded-sm px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">Open Another Repo</button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* Activity bar */}
        <div className="hidden w-11 shrink-0 flex-col items-center gap-1 border-r bg-muted/40 py-2 sm:flex" role="toolbar" aria-label="Views" aria-orientation="vertical">
          <ActivityButton label="Explorer" pressed={showExplorer} onClick={toggleExplorer}><Files className="size-5" /></ActivityButton>
          <ActivityButton label="Code Reviewer" pressed={showReviewer} onClick={() => openReviewer(!showReviewer)}><Bot className="size-5" /></ActivityButton>
        </div>

        {/* Explorer */}
        {showExplorer && (
          <nav aria-label="Explorer" className="max-h-56 shrink-0 overflow-auto border-b bg-muted/20 pb-2 text-[13px] sm:max-h-none sm:w-56 sm:border-r sm:border-b-0">
            <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Explorer</p>
            <p className="flex items-center gap-1 px-2 pb-1 text-[11px] font-semibold tracking-wide uppercase" translate="no"><ChevronDown className="size-3.5" /> {ref.repo}</p>
            <TreeList nodes={tree} depth={0} open={open} active={active} onToggle={(p) => setOpen((o) => { const n = new Set(o); if (n.has(p)) n.delete(p); else n.add(p); return n; })} onOpen={(n) => void openFile(ref, branch, n.path, n.size ?? 0)} />
            {truncated && <p className="px-3 pt-2 text-xs text-muted-foreground">Large repo: showing the first 2,000 files.</p>}
          </nav>
        )}

        {/* Editor group */}
        <section className="flex min-w-0 flex-1 flex-col sm:min-h-0">
          <div className="flex shrink-0 overflow-x-auto overflow-y-hidden border-b bg-muted/40" role="tablist" aria-label="Open files">
            {tabs.map((t) => (
              <div key={t.path} className={cn("group flex shrink-0 items-center gap-1.5 border-r py-1.5 pr-1 pl-3 text-xs", t.path === active ? "bg-background font-medium text-foreground" : "text-muted-foreground")}>
                <FileTypeIcon path={t.path} className="size-3.5" />
                <button type="button" role="tab" aria-selected={t.path === active} onClick={() => { setActive(t.path); setExplain({ status: "idle" }); }} translate="no">{t.path.split("/").pop()}</button>
                <button type="button" onClick={() => closeTab(t.path)} aria-label={`Close ${t.path}`} className="rounded-sm p-0.5 opacity-60 hover:bg-accent hover:opacity-100 focus-visible:opacity-100"><X className="size-3" /></button>
              </div>
            ))}
          </div>
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b px-3 py-1 text-xs whitespace-nowrap text-muted-foreground" translate="no">
              {crumbs.map((c, i) => (
                <span key={i} className={cn("flex items-center gap-0.5", i === crumbs.length - 1 && "text-foreground")}>
                  {i > 0 && <ChevronRight className="size-3" />}
                  {i === crumbs.length - 1 && <FileTypeIcon path={c} className="size-3.5" />} {c}
                </span>
              ))}
            </nav>
          )}
          {/* Fixed height on phones: the IDE has no definite height there, so the editor's 100% would collapse. */}
          <div className="h-[380px] min-h-0 sm:h-auto sm:flex-1">
            {!current ? (
              <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">Pick a file in the Explorer.</div>
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
                onMount={(ed) => {
                  editorRef.current = ed;
                  // Monaco can measure before the stacked phone layout settles; re-measure once it has.
                  requestAnimationFrame(() => ed.layout());
                  ed.onDidChangeCursorPosition((e) => setCursor({ line: e.position.lineNumber, col: e.position.column }));
                }}
                options={{ readOnly: true, minimap: { enabled: true }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            )}
          </div>
        </section>

        {/* Secondary side bar: Code Reviewer agent */}
        {showReviewer && (
          <aside aria-label="Code Reviewer" className="flex shrink-0 flex-col overflow-auto border-t sm:w-72 sm:border-t-0 sm:border-l xl:w-80">
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Code Reviewer</p>
              <button type="button" onClick={() => openReviewer(false)} aria-label="Close Code Reviewer" className="ml-auto hidden rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground sm:block"><X className="size-3.5" /></button>
            </div>
            <div className="flex flex-col gap-3 px-3 pb-4">
              <p className="text-xs text-muted-foreground">Select code in the editor, or nothing for the whole file, then get it explained at your {profile.level} level.</p>
              <Button onClick={runExplain} disabled={!current?.content || explain.status === "loading"}>
                {explain.status === "loading" ? <Loader2 className="animate-spin" /> : null} {explain.status === "loading" ? "Explaining…" : "Explain Code"}
              </Button>
              <div aria-live="polite">
                {explain.status !== "idle" && explain.scope && <p className="text-xs text-muted-foreground">Explaining {explain.scope} of <span translate="no">{current?.path.split("/").pop()}</span></p>}
                {explain.status === "done" && (
                  <div className="mt-2 text-sm">
                    <Markdown>{explain.text ?? ""}</Markdown>
                    {explain.mode === "limit" && <p className="mt-2 text-xs text-muted-foreground">Daily AI limit reached; this is the built-in summary.</p>}
                  </div>
                )}
                {explain.status === "error" && <p role="alert" className="mt-2 text-sm text-destructive">{explain.text}</p>}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-3 overflow-x-auto bg-primary px-3 py-0.5 text-[11px] whitespace-nowrap text-primary-foreground">
        <span className="flex items-center gap-1"><GitBranch className="size-3" /> <span translate="no">{branch}</span></span>
        {current?.content && <span className="tabular-nums">{new Intl.NumberFormat().format(current.content.split("\n").length)} lines</span>}
        <span className="ml-auto tabular-nums">{current?.content ? `Ln ${cursor.line}, Col ${cursor.col}` : ""}</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        {current && <span className="capitalize">{languageOf(current.path)}</span>}
        <span>Read-only</span>
      </div>
    </div>
  );
}

function ActivityButton({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn("flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent", pressed ? "text-foreground" : "text-muted-foreground")}
    >
      {children}
    </button>
  );
}

function TreeList({ nodes, depth, open, active, onToggle, onOpen }: { nodes: TreeNode[]; depth: number; open: Set<string>; active: string | null; onToggle: (p: string) => void; onOpen: (n: TreeNode) => void }) {
  return (
    <ul>
      {nodes.map((n) => {
        const expanded = n.type === "dir" && open.has(n.path);
        return (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => (n.type === "dir" ? onToggle(n.path) : onOpen(n))}
              className={cn("flex w-full items-center gap-1 truncate py-[3px] pr-2 text-left hover:bg-accent/70", n.path === active && "bg-accent font-medium")}
              style={{ paddingLeft: 8 + depth * 12 }}
              aria-expanded={n.type === "dir" ? expanded : undefined}
              translate="no"
            >
              {n.type === "dir" ? (
                <>
                  {expanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
                  {expanded ? <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" /> : <Folder className="size-3.5 shrink-0 text-muted-foreground" />}
                </>
              ) : (
                <FileTypeIcon path={n.path} className="ml-[14px] size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{n.name}</span>
            </button>
            {expanded && n.children && <TreeList nodes={n.children} depth={depth + 1} open={open} active={active} onToggle={onToggle} onOpen={onOpen} />}
          </li>
        );
      })}
    </ul>
  );
}
