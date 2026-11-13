import type { LearningResource } from "@/lib/types";

// Curated starting points (D-16: link to existing free resources, never copy them).
// Used as-is when Gemini is unavailable, and as the base Gemini personalises.

export type TrackStep = { id: string; title: string; skillIds: string[]; resources: LearningResource[] };
export type Track = { id: string; name: string; keywords: string[]; steps: TrackStep[] };

const r = (title: string, url: string, kind: LearningResource["kind"] = "docs"): LearningResource => ({ title, url, kind });

const GIT: TrackStep = {
  id: "git",
  title: "Git and GitHub basics",
  skillIds: ["git", "open-source"],
  resources: [r("Pro Git book (free)", "https://git-scm.com/book/en/v2"), r("GitHub Skills courses", "https://skills.github.com/", "course")],
};

export const TRACKS: Track[] = [
  {
    id: "frontend",
    name: "Frontend developer",
    keywords: ["frontend", "front-end", "front end", "ui", "web design", "react"],
    steps: [
      { id: "html-css", title: "HTML and CSS fundamentals", skillIds: ["html", "css"], resources: [r("MDN: Learn web development", "https://developer.mozilla.org/en-US/docs/Learn_web_development", "course")] },
      { id: "javascript", title: "Modern JavaScript", skillIds: ["javascript"], resources: [r("The Modern JavaScript Tutorial", "https://javascript.info/", "article")] },
      GIT,
      { id: "typescript", title: "TypeScript", skillIds: ["typescript"], resources: [r("TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html")] },
      { id: "react", title: "React", skillIds: ["react"], resources: [r("react.dev: Learn React", "https://react.dev/learn")] },
      { id: "nextjs", title: "Next.js and full pages", skillIds: ["nextjs"], resources: [r("Next.js Learn course", "https://nextjs.org/learn", "course")] },
      { id: "a11y", title: "Accessibility and performance", skillIds: ["accessibility"], resources: [r("web.dev: Learn Accessibility", "https://web.dev/learn/accessibility", "course")] },
    ],
  },
  {
    id: "backend",
    name: "Backend developer",
    keywords: ["backend", "back-end", "back end", "api", "server", "node"],
    steps: [
      { id: "language", title: "A server language (JavaScript/Node.js)", skillIds: ["javascript", "nodejs", "python"], resources: [r("Node.js: Introduction", "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs")] },
      GIT,
      { id: "http", title: "HTTP and REST APIs", skillIds: ["rest-api"], resources: [r("MDN: An overview of HTTP", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", "article")] },
      { id: "express", title: "Build an API with Express", skillIds: ["express"], resources: [r("Express: Getting started", "https://expressjs.com/en/starter/installing.html")] },
      { id: "sql", title: "Databases and SQL", skillIds: ["sql", "postgresql", "mongodb"], resources: [r("SQLBolt interactive lessons", "https://sqlbolt.com/", "course"), r("PostgreSQL tutorial", "https://www.postgresql.org/docs/current/tutorial.html")] },
      { id: "auth", title: "Authentication and security", skillIds: ["security"], resources: [r("OWASP Authentication Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", "article")] },
      { id: "docker", title: "Containers and deployment", skillIds: ["docker", "ci-cd"], resources: [r("Docker: Get started", "https://docs.docker.com/get-started/", "course")] },
    ],
  },
  {
    id: "data",
    name: "Data / ML engineer",
    keywords: ["data", "machine learning", "ml", "ai", "analyst", "science"],
    steps: [
      { id: "python", title: "Python", skillIds: ["python"], resources: [r("The Python Tutorial", "https://docs.python.org/3/tutorial/")] },
      GIT,
      { id: "pandas", title: "Data wrangling with pandas", skillIds: ["pandas", "jupyter"], resources: [r("pandas: Getting started tutorials", "https://pandas.pydata.org/docs/getting_started/intro_tutorials/")] },
      { id: "sql", title: "SQL for analysis", skillIds: ["sql"], resources: [r("SQLBolt interactive lessons", "https://sqlbolt.com/", "course")] },
      { id: "ml", title: "Machine learning fundamentals", skillIds: ["machine-learning"], resources: [r("Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course", "course")] },
      { id: "practice", title: "Practise on real datasets", skillIds: ["data-science"], resources: [r("Kaggle Learn", "https://www.kaggle.com/learn", "course")] },
    ],
  },
  {
    id: "mobile",
    name: "Mobile developer",
    keywords: ["mobile", "android", "ios", "flutter", "app developer"],
    steps: [
      { id: "dart", title: "Dart and Flutter basics", skillIds: ["dart", "flutter"], resources: [r("Flutter: Get started", "https://docs.flutter.dev/get-started")] },
      GIT,
      { id: "android", title: "Android with Kotlin", skillIds: ["kotlin", "android"], resources: [r("Android Developers: courses", "https://developer.android.com/courses", "course")] },
      { id: "rn", title: "Cross-platform with React Native", skillIds: ["react-native"], resources: [r("React Native: Get started", "https://reactnative.dev/docs/getting-started")] },
      { id: "backend", title: "Connect to a backend (Firebase)", skillIds: ["firebase"], resources: [r("Firebase: Get started", "https://firebase.google.com/docs/guides")] },
    ],
  },
  {
    id: "devops",
    name: "DevOps / Cloud engineer",
    keywords: ["devops", "cloud", "sre", "infrastructure", "platform"],
    steps: [
      { id: "linux", title: "Linux and the command line", skillIds: ["shell"], resources: [r("Linux Journey", "https://linuxjourney.com/", "course")] },
      GIT,
      { id: "ci", title: "CI/CD with GitHub Actions", skillIds: ["ci-cd"], resources: [r("GitHub Actions quickstart", "https://docs.github.com/en/actions/writing-workflows/quickstart")] },
      { id: "docker", title: "Docker", skillIds: ["docker"], resources: [r("Docker: Get started", "https://docs.docker.com/get-started/", "course")] },
      { id: "k8s", title: "Kubernetes basics", skillIds: ["kubernetes"], resources: [r("Kubernetes Basics tutorial", "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "course")] },
      { id: "cloud", title: "A cloud platform (Google Cloud)", skillIds: ["gcp", "aws"], resources: [r("Google Cloud: Get started", "https://cloud.google.com/docs/get-started")] },
    ],
  },
];

/** LN-03: focused packs for the struggles the profile can detect (lib/profile/rules.ts). */
export const STRUGGLE_PACKS: Record<string, { explainer: string; resources: LearningResource[] }> = {
  "Documenting projects": {
    explainer:
      "A README is the front door of a project: what it does, how to run it, and a screenshot. Recruiters and contributors decide in seconds whether to keep reading.",
    resources: [r("Make a README", "https://www.makeareadme.com/", "article"), r("GitHub Docs: About READMEs", "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes")],
  },
  "Failing CI builds": {
    explainer:
      "CI runs your checks on every push. When it fails, open the run, find the first red step, and reproduce that exact command locally. Most failures are missing dependencies, secrets or environment variables.",
    resources: [r("GitHub Actions quickstart", "https://docs.github.com/en/actions/writing-workflows/quickstart")],
  },
  "Taking projects past the first few commits": {
    explainer:
      "Small, finished projects beat many abandoned ones. Pick one repo, write down 3 features that make it 'done', and ship them in small commits.",
    resources: [r("roadmap.sh project ideas", "https://roadmap.sh/projects", "article")],
  },
  "Staying consistent": {
    explainer:
      "Consistency compounds. A small daily habit, like 30 minutes of code pushed to GitHub, builds skill and shows steady activity on your profile.",
    resources: [r("#100DaysOfCode challenge", "https://www.100daysofcode.com/", "article")],
  },
  "Contributing to other projects": {
    explainer:
      "Open source shows you can read other people's code, follow a process and collaborate. Start with a 'good first issue', comment that you'd like to work on it, then open a small pull request.",
    resources: [r("Open Source Guide: How to contribute", "https://opensource.guide/how-to-contribute/", "article"), r("Good First Issue", "https://goodfirstissue.dev/", "problem")],
  },
  "Describing your repositories": {
    explainer:
      "A one-line description and a few topics make each repository searchable and help recruiters understand it at a glance.",
    resources: [r("GitHub Docs: Repository topics", "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics")],
  },
};
