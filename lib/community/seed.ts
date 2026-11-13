// Sample posts so Community isn't empty before the backend exists. Original content, labelled "Sample" in the UI.
import type { Post } from "./model";

const ago = (now: number, hours: number) => new Date(now - hours * 3_600_000).toISOString();

export function seedPosts(now = Date.now()): Post[] {
  return [
    {
      id: "s-env-vars", type: "question", sample: true, author: "maya.codes", score: 14, views: 312, createdAt: ago(now, 5),
      title: "Why is process.env.API_URL undefined in my Next.js client component?",
      tags: ["nextjs", "react", "javascript"],
      body: "Locally it works from `.env.local`, but in the browser `process.env.API_URL` is `undefined`. I restarted the dev server. What am I missing?",
      answers: [
        { id: "a1", author: "devraj", score: 21, createdAt: ago(now, 4), body: "Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Rename it to `NEXT_PUBLIC_API_URL` and restart. Keep secrets **without** the prefix so they stay on the server." },
        { id: "a2", author: "lin.k", score: 3, createdAt: ago(now, 3), body: "Also check your hosting provider: env vars set there must be available at build time for client code." },
      ],
      acceptedAnswerId: "a1",
    },
    {
      id: "s-ci-lockfile", type: "question", sample: true, author: "arjun_dev", score: 6, views: 97, createdAt: ago(now, 26),
      title: "GitHub Actions fails at npm ci but works locally",
      tags: ["ci-cd", "nodejs"],
      body: "My workflow fails on `npm ci` with *'package-lock.json is out of sync'*. Locally `npm install` works fine. How do I fix this properly?",
      answers: [],
    },
    {
      id: "s-async-loop", type: "question", sample: true, author: "sara.builds", score: 9, views: 154, createdAt: ago(now, 50),
      title: "await inside forEach doesn't wait. How do I run requests in order?",
      tags: ["javascript", "typescript"],
      body: "```js\nitems.forEach(async (i) => { await save(i); });\nconsole.log('done');\n```\n`done` prints before anything is saved. Why?",
      answers: [
        { id: "a1", author: "devraj", score: 12, createdAt: ago(now, 48), body: "`forEach` ignores returned promises. Use `for (const i of items) await save(i);` for order, or `await Promise.all(items.map(save))` for parallel." },
      ],
    },
    {
      id: "s-article-firestore", type: "article", sample: true, author: "nikhil.writes", score: 32, views: 1204, createdAt: ago(now, 72),
      title: "Designing Firestore data for a real app: 5 rules I wish I knew earlier",
      tags: ["firebase", "gcp"],
      body: "## 1. Model for your reads\nFirestore is cheap to read when your screens map to documents. Start from the screens, not the entities.\n\n## 2. Keep documents small\nAnything that grows without limit (comments, votes) belongs in a sub-collection.\n\n## 3. One writer per field\nIf the server owns a field, lock it in security rules.\n\n## 4. Denormalise on purpose\nCopy the author name into the post. Update it with a function if it changes.\n\n## 5. Index what you sort by\nComposite indexes are part of your schema; commit them.\n\nThat's it: small docs, clear owners, indexes in git.",
      answers: [],
    },
    {
      id: "s-showcase-portfolio", type: "showcase", sample: true, author: "maya.codes", score: 18, views: 420, createdAt: ago(now, 30),
      title: "Built my portfolio with Next.js + Tailwind in a weekend",
      tags: ["nextjs", "tailwind", "react"],
      url: "https://example.com",
      body: "Server components for the blog, a contact form on a route handler, and a dark mode toggle. Feedback on the layout welcome!",
      answers: [{ id: "a1", author: "lin.k", score: 2, createdAt: ago(now, 28), body: "Clean! The project cards could show the tech stack as tags." }],
    },
    {
      id: "s-discuss-dsa", type: "discussion", sample: true, author: "arjun_dev", score: 11, views: 233, createdAt: ago(now, 10),
      title: "How much DSA do you actually need for a frontend internship?",
      tags: ["javascript", "react"],
      body: "Placement season is close. Should I grind 300 problems or build two solid projects? What worked for you?",
      answers: [
        { id: "a1", author: "nikhil.writes", score: 7, createdAt: ago(now, 9), body: "Arrays, strings, hash maps and basic recursion cover most frontend rounds. Projects get you the interview; DSA gets you through it." },
      ],
    },
    {
      id: "s-python-venv", type: "question", sample: true, author: "zoya.py", score: 4, views: 61, createdAt: ago(now, 3),
      title: "ModuleNotFoundError after pip install in a Python virtual environment",
      tags: ["python"],
      body: "I ran `pip install requests` but running my script says `ModuleNotFoundError: No module named 'requests'`.",
      answers: [],
    },
    {
      id: "s-article-docker", type: "article", sample: true, author: "devraj", score: 24, views: 802, createdAt: ago(now, 120),
      title: "Your first Dockerfile for a Node.js API, explained line by line",
      tags: ["docker", "nodejs"],
      body: "```dockerfile\nFROM node:22-slim\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nCMD [\"node\", \"server.js\"]\n```\n\n**Why copy package files first?** Docker caches layers. Dependencies change less often than code, so installs are reused.\n\n**Why `npm ci`?** It installs exactly what the lockfile says, which keeps builds reproducible.",
      answers: [],
    },
  ];
}
