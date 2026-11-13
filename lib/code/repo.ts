// WS-01 (lean): read a public GitHub repo in the browser. Pure helpers + fetchers usable on client or server.
// Read-only: nothing here writes to GitHub (cross-cutting rule 1).

export type RepoRef = { owner: string; repo: string };
export type TreeFile = { path: string; size: number };
export type TreeNode = { name: string; path: string; type: "dir" | "file"; size?: number; children?: TreeNode[] };

export const MAX_FILES = 2000;
export const MAX_FILE_BYTES = 300_000;

/** Accepts "owner/repo", a github.com URL, or "owner/repo/tree/branch". */
export function parseRepo(input: string): RepoRef | null {
  const s = input.trim().replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "").replace(/\.git$/i, "");
  const m = s.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})(?:\/.*)?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

const BINARY = /\.(png|jpe?g|gif|webp|ico|bmp|pdf|zip|gz|tgz|rar|7z|jar|exe|dll|so|dylib|woff2?|ttf|otf|eot|mp[34]|mov|avi|wav|ogg|psd|sqlite|db|bin|class|pyc|lock)$/i;
export function isPreviewable(path: string, size: number): boolean {
  return !BINARY.test(path) && size <= MAX_FILE_BYTES;
}

const LANG: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  json: "json", md: "markdown", py: "python", java: "java", go: "go", rb: "ruby", php: "php", cs: "csharp",
  rs: "rust", c: "c", h: "c", cpp: "cpp", cc: "cpp", hpp: "cpp", kt: "kotlin", swift: "swift", dart: "dart",
  css: "css", scss: "scss", html: "html", xml: "xml", yml: "yaml", yaml: "yaml", sh: "shell", sql: "sql",
  dockerfile: "dockerfile", toml: "ini", vue: "html", svelte: "html",
};
export function languageOf(path: string): string {
  const name = path.split("/").pop()!.toLowerCase();
  if (name === "dockerfile") return "dockerfile";
  return LANG[name.split(".").pop() ?? ""] ?? "plaintext";
}

/** Folders first, then files, alphabetically (VS Code explorer order). */
export function buildTree(files: TreeFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", type: "dir", children: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;
      let child = node.children!.find((c) => c.name === part);
      if (!child) {
        child = isFile ? { name: part, path, type: "file", size: f.size } : { name: part, path, type: "dir", children: [] };
        node.children!.push(child);
      }
      node = child;
    });
  }
  const sort = (n: TreeNode) => {
    n.children?.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
    n.children?.forEach(sort);
  };
  sort(root);
  return root.children!;
}

export class RepoError extends Error {
  constructor(public kind: "not_found" | "rate_limited" | "network" | "too_big", message: string) {
    super(message);
  }
}

async function gh<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  } catch {
    throw new RepoError("network", "Couldn't reach GitHub. Check your connection and try again.");
  }
  if (res.status === 404) throw new RepoError("not_found", "Repository not found. Only public repositories can be opened for now.");
  if (res.status === 403 || res.status === 429) throw new RepoError("rate_limited", "GitHub is limiting requests right now. Try again in a few minutes.");
  if (!res.ok) throw new RepoError("network", `GitHub returned ${res.status}.`);
  return (await res.json()) as T;
}

export async function fetchRepoTree(ref: RepoRef): Promise<{ branch: string; files: TreeFile[]; truncated: boolean }> {
  const meta = await gh<{ default_branch: string }>(`https://api.github.com/repos/${ref.owner}/${ref.repo}`);
  const tree = await gh<{ tree: { path: string; type: string; size?: number }[]; truncated: boolean }>(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
  );
  const files = tree.tree.filter((t) => t.type === "blob").map((t) => ({ path: t.path, size: t.size ?? 0 }));
  return { branch: meta.default_branch, files: files.slice(0, MAX_FILES), truncated: tree.truncated || files.length > MAX_FILES };
}

export async function fetchFile(ref: RepoRef, branch: string, path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${encodeURIComponent(branch)}/${path.split("/").map(encodeURIComponent).join("/")}`);
  } catch {
    throw new RepoError("network", "Couldn't load the file.");
  }
  if (!res.ok) throw new RepoError(res.status === 404 ? "not_found" : "network", `Couldn't load ${path} (${res.status}).`);
  return res.text();
}
