// Skill catalogue: maps GitHub languages/topics to skill ids, display names and parents (DI-01 hierarchy).

export type SkillMeta = { id: string; name: string; parent?: string };

const PARENTS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  data: "Data & AI",
  devops: "DevOps & Cloud",
  systems: "Systems",
  tools: "Tools",
};

export function parentName(id?: string): string {
  return (id && PARENTS[id]) || "Other";
}

const LANGUAGES: Record<string, Omit<SkillMeta, "name"> & { name?: string }> = {
  javascript: { id: "javascript", parent: "frontend" },
  typescript: { id: "typescript", parent: "frontend" },
  html: { id: "html", name: "HTML", parent: "frontend" },
  css: { id: "css", name: "CSS", parent: "frontend" },
  scss: { id: "css", name: "CSS", parent: "frontend" },
  vue: { id: "vue", name: "Vue", parent: "frontend" },
  svelte: { id: "svelte", parent: "frontend" },
  python: { id: "python", parent: "backend" },
  java: { id: "java", parent: "backend" },
  go: { id: "go", parent: "backend" },
  ruby: { id: "ruby", parent: "backend" },
  php: { id: "php", name: "PHP", parent: "backend" },
  "c#": { id: "csharp", name: "C#", parent: "backend" },
  rust: { id: "rust", parent: "systems" },
  c: { id: "c", name: "C", parent: "systems" },
  "c++": { id: "cpp", name: "C++", parent: "systems" },
  kotlin: { id: "kotlin", parent: "mobile" },
  swift: { id: "swift", parent: "mobile" },
  dart: { id: "dart", parent: "mobile" },
  "jupyter notebook": { id: "jupyter", name: "Jupyter", parent: "data" },
  r: { id: "r", name: "R", parent: "data" },
  shell: { id: "shell", name: "Shell scripting", parent: "devops" },
  dockerfile: { id: "docker", name: "Docker", parent: "devops" },
  hcl: { id: "terraform", name: "Terraform", parent: "devops" },
  powershell: { id: "powershell", name: "PowerShell", parent: "devops" },
};

const TOPICS: Record<string, SkillMeta> = {
  react: { id: "react", name: "React", parent: "frontend" },
  reactjs: { id: "react", name: "React", parent: "frontend" },
  nextjs: { id: "nextjs", name: "Next.js", parent: "frontend" },
  angular: { id: "angular", name: "Angular", parent: "frontend" },
  tailwindcss: { id: "tailwind", name: "Tailwind CSS", parent: "frontend" },
  nodejs: { id: "nodejs", name: "Node.js", parent: "backend" },
  node: { id: "nodejs", name: "Node.js", parent: "backend" },
  express: { id: "express", name: "Express", parent: "backend" },
  django: { id: "django", name: "Django", parent: "backend" },
  flask: { id: "flask", name: "Flask", parent: "backend" },
  fastapi: { id: "fastapi", name: "FastAPI", parent: "backend" },
  spring: { id: "spring", name: "Spring", parent: "backend" },
  "spring-boot": { id: "spring", name: "Spring", parent: "backend" },
  graphql: { id: "graphql", name: "GraphQL", parent: "backend" },
  "rest-api": { id: "rest-api", name: "REST APIs", parent: "backend" },
  api: { id: "rest-api", name: "REST APIs", parent: "backend" },
  mongodb: { id: "mongodb", name: "MongoDB", parent: "backend" },
  postgresql: { id: "postgresql", name: "PostgreSQL", parent: "backend" },
  mysql: { id: "sql", name: "SQL", parent: "backend" },
  sql: { id: "sql", name: "SQL", parent: "backend" },
  firebase: { id: "firebase", name: "Firebase", parent: "devops" },
  docker: { id: "docker", name: "Docker", parent: "devops" },
  kubernetes: { id: "kubernetes", name: "Kubernetes", parent: "devops" },
  aws: { id: "aws", name: "AWS", parent: "devops" },
  gcp: { id: "gcp", name: "Google Cloud", parent: "devops" },
  "google-cloud": { id: "gcp", name: "Google Cloud", parent: "devops" },
  "github-actions": { id: "ci-cd", name: "CI/CD", parent: "devops" },
  "machine-learning": { id: "machine-learning", name: "Machine learning", parent: "data" },
  "deep-learning": { id: "machine-learning", name: "Machine learning", parent: "data" },
  tensorflow: { id: "tensorflow", name: "TensorFlow", parent: "data" },
  pytorch: { id: "pytorch", name: "PyTorch", parent: "data" },
  pandas: { id: "pandas", name: "pandas", parent: "data" },
  "data-science": { id: "data-science", name: "Data science", parent: "data" },
  "react-native": { id: "react-native", name: "React Native", parent: "mobile" },
  flutter: { id: "flutter", name: "Flutter", parent: "mobile" },
  android: { id: "android", name: "Android", parent: "mobile" },
  ios: { id: "ios", name: "iOS", parent: "mobile" },
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function languageSkill(language: string): SkillMeta {
  const key = language.toLowerCase();
  const m = LANGUAGES[key];
  if (m) return { id: m.id, name: m.name ?? titleCase(language), parent: m.parent };
  return { id: key.replace(/[^a-z0-9+#]+/g, "-"), name: language, parent: undefined };
}

export function topicSkill(topic: string): SkillMeta | null {
  return TOPICS[topic.toLowerCase()] ?? null;
}

/** Display metadata for any known skill id. */
export function skillMeta(id: string): SkillMeta {
  for (const m of Object.values(TOPICS)) if (m.id === id) return m;
  for (const [lang, m] of Object.entries(LANGUAGES)) if (m.id === id) return { id, name: m.name ?? titleCase(lang), parent: m.parent };
  return { id, name: titleCase(id.replace(/-/g, " ")) };
}
